// Tests of the hooks in claude/hooks/. Run them with: node --test tests/
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { globToRegExp } from "../claude/hooks/lib.mjs";

const hooks = path.join(import.meta.dirname, "..", "claude", "hooks");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

// A project folder with a bare origin, the main checkout in main/, and .claude/yaw.json.
function project({ setup = null } = {}) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "yaw-test-")));
  const main = path.join(root, "main");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", path.join(root, "origin.git")]);
  execFileSync("git", ["clone", "-q", path.join(root, "origin.git"), main], { stdio: "ignore" });
  git(main, "config", "user.email", "test@example.com");
  git(main, "config", "user.name", "Test");
  mkdirSync(path.join(main, ".claude"));
  writeFileSync(path.join(main, ".claude", "yaw.json"), JSON.stringify({ testPaths: ["**/*.test.mjs", "e2e/**"], setup }));
  writeFileSync(path.join(main, "README.md"), "test\n");
  git(main, "add", "README.md");
  git(main, "commit", "-q", "-m", "init");
  git(main, "push", "-q", "origin", "main");
  return { root, main };
}

function hook(name, input, { args = [], env = {} } = {}) {
  const r = spawnSync("node", [path.join(hooks, name), ...args], { input: JSON.stringify(input), encoding: "utf8", env: { ...process.env, ...env } });
  return { status: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() };
}

function worktree(p, name) {
  const r = hook("worktree-create.mjs", { name, cwd: p.main });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.split("\n").at(-1);
}

test("a glob matches across folders with ** and inside one name with *", () => {
  assert.ok(globToRegExp("**/*.test.ts").test("a.test.ts"));
  assert.ok(globToRegExp("**/*.test.ts").test("src/a/b.test.ts"));
  assert.ok(!globToRegExp("**/*.test.ts").test("src/a.ts"));
  assert.ok(globToRegExp("e2e/**").test("e2e/x/y.ts"));
  assert.ok(!globToRegExp("*.md").test("docs/a.md"));
});

test("the worktree goes beside the main checkout, with the plan and the shared memory", () => {
  const p = project({ setup: "mkdir -p .work && touch .work/setup-ran" });
  const dir = worktree(p, "agent-1");
  assert.equal(dir, path.join(p.root, "agent-1"));
  assert.equal(git(dir, "branch", "--show-current"), "agent-1");
  assert.ok(existsSync(path.join(dir, ".work", "plan.md")));
  assert.ok(existsSync(path.join(dir, ".work", "setup-ran")));
  const local = JSON.parse(readFileSync(path.join(dir, ".claude", "settings.local.json"), "utf8"));
  assert.ok(local.autoMemoryDirectory.endsWith(`${p.main.replace(/[^a-zA-Z0-9]/g, "-")}${path.sep}memory`));
  assert.equal(git(dir, "status", "--porcelain"), "");
});

test("the worktree of an agent for an issue is named after the issue", () => {
  const p = project();
  const transcript = path.join(p.root, "transcript.jsonl");
  const call = (prompt) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Agent", input: { subagent_type: "implementer", prompt } }] } });
  writeFileSync(transcript, `${call("Invoke the implement-issue skill for #7.")}\n`);
  const create = () => hook("worktree-create.mjs", { name: "agent-x1", cwd: p.main, transcript_path: transcript }).stdout.split("\n").at(-1);
  assert.equal(create(), path.join(p.root, "issue-7"));
  assert.equal(create(), path.join(p.root, "issue-7-2"));
  writeFileSync(transcript, `${call("Run pwd.")}\n`);
  assert.equal(create(), path.join(p.root, "agent-x1"));
});

test("a worktree name that is not a kebab-case slug is refused", () => {
  const p = project();
  assert.equal(hook("worktree-create.mjs", { name: "Bad Name", cwd: p.main }).status, 1);
});

test("the implementer cannot edit a test, the tester only tests and .work/, the user anything", () => {
  const p = project();
  const dir = worktree(p, "agent-2");
  const edit = (file, agent) => hook("test-paths.mjs", { cwd: p.main, agent_type: agent, tool_input: { file_path: path.join(dir, file) } }).stdout;
  assert.match(edit("src/a.test.mjs", "implementer"), /"deny"/);
  assert.equal(edit("src/a.mjs", "implementer"), "");
  assert.match(edit("src/a.mjs", "tester"), /"deny"/);
  assert.equal(edit("e2e/flow.mjs", "yaw-tester"), "");
  assert.equal(edit(".work/plan.md", "tester"), "");
  assert.equal(edit("src/a.test.mjs", undefined), "");
});

test("a worktree without own commits is removed, one with commits stays", () => {
  const p = project();
  const empty = worktree(p, "agent-3");
  assert.equal(hook("worktree-remove.mjs", { cwd: p.main, worktree_path: empty }).status, 0);
  assert.ok(!existsSync(empty));
  const busy = worktree(p, "agent-4");
  writeFileSync(path.join(busy, "a.txt"), "a");
  git(busy, "add", "a.txt");
  git(busy, "commit", "-q", "-m", "a");
  assert.equal(hook("worktree-remove.mjs", { cwd: p.main, worktree_path: busy }).status, 1);
  assert.ok(existsSync(busy));
});

test("the implementer cannot stop with an open behaviour, and can after three refusals", () => {
  const p = project();
  const dir = worktree(p, "agent-a5");
  const bin = mkdtempSync(path.join(os.tmpdir(), "yaw-gh-"));
  writeFileSync(path.join(bin, "gh"), "#!/bin/sh\necho 1\n");
  chmodSync(path.join(bin, "gh"), 0o755);
  const env = { PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const stop = (agent = "implementer") => hook("subagent-stop.mjs", { cwd: dir, agent_type: agent, agent_id: "a5" }, { env }).stdout;
  const plan = path.join(dir, ".work", "plan.md");
  writeFileSync(plan, "# Plan\n\n## Behaviours\n\n- [ ] it does a\n\n## Handoff\n\n- …\n");
  assert.equal(stop("tester"), "");
  assert.match(stop(), /"block"/);
  assert.match(stop(), /"block"/);
  assert.match(stop(), /systemMessage/);
  writeFileSync(plan, "# Plan\n\n## Behaviours\n\n- [ ] it does a\n\n## Handoff\n\n- Awaiting: tests\n");
  assert.equal(stop(), "");
  writeFileSync(plan, "# Plan\n\n## Behaviours\n\n- [x] it does a\n\n## Handoff\n\n- …\n");
  assert.equal(stop(), "");
});

test("the review places a finding on a diff line inline, and one outside the diff in the body", () => {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "yaw-review-")));
  mkdirSync(path.join(dir, ".work", "review", "7"), { recursive: true });
  const finding = (line, confidence) => ({ reviewer: "reviewer-code", file: "src/a.mjs", line, severity: "major", claim: "c", failure_scenario: "f", confidence, kind: "code" });
  writeFileSync(path.join(dir, ".work", "review", "7", "judged.json"), JSON.stringify([finding(2, 90), finding(40, 80), finding(3, 10)]));
  const bin = mkdtempSync(path.join(os.tmpdir(), "yaw-gh-"));
  writeFileSync(path.join(bin, "gh"), "#!/bin/sh\nprintf '+++ b/src/a.mjs\\n@@ -1,1 +1,3 @@\\n a\\n+b\\n+c\\n'\n");
  chmodSync(path.join(bin, "gh"), 0o755);
  const script = path.join(import.meta.dirname, "..", "claude", "skills", "review-pr", "post-review.mjs");
  const r = spawnSync("node", [script, "7", "--dry-run"], { cwd: dir, encoding: "utf8", env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } });
  assert.equal(r.status, 0, r.stderr);
  const payload = JSON.parse(r.stdout);
  assert.deepEqual(payload.comments.map((c) => c.line), [2]);
  assert.match(payload.body, /src\/a\.mjs:40/);
  assert.match(payload.body, /1 below, not shown/);
});
