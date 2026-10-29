// WorktreeCreate hook. Claude Code calls it for an agent with `isolation: worktree` and for `claude --worktree <name>`.
// The worktree goes beside the main checkout, on a new branch from origin/main. Its name is issue-<n> when the
// agent that it is for names an issue, else the name that Claude Code gives, for example agent-<id>.
// The protocol: the last line on stdout is the worktree path. Everything else goes to stderr.
import { execSync } from "node:child_process";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { git, issueOfAgent, mainCheckout, readConfig, readInput, tryGit } from "./lib.mjs";

const input = readInput();
const given = String(input.name ?? "");
if (!/^[a-z0-9][a-z0-9-]*$/.test(given)) {
  console.error(`the worktree name must be a kebab-case slug, got ${JSON.stringify(given)}`);
  process.exit(1);
}

const main = mainCheckout(input.cwd);
const issue = issueOfAgent(input.transcript_path);
let name = issue === null ? given : `issue-${issue}`;
for (let k = 2; issue !== null && existsSync(path.join(path.dirname(main), name)); k++) name = `issue-${issue}-${k}`;
const dir = path.join(path.dirname(main), name);
const config = readConfig(main);

tryGit(main, "fetch", "--quiet", "origin");
const base = tryGit(main, "rev-parse", "--verify", "--quiet", "origin/main") ? "origin/main" : "main";
if (tryGit(main, "rev-parse", "--verify", "--quiet", `refs/heads/${name}`)) git(main, "worktree", "add", "--quiet", dir, name);
else git(main, "worktree", "add", "--quiet", dir, "-b", name, base);

if (config.setup) execSync(config.setup, { cwd: dir, stdio: ["ignore", process.stderr, "inherit"] });

// Git ignores the files of this hook in every worktree, through the shared info/exclude of the repository.
const exclude = path.resolve(main, git(main, "rev-parse", "--git-common-dir"), "info", "exclude");
mkdirSync(path.dirname(exclude), { recursive: true });
const known = existsSync(exclude) ? readFileSync(exclude, "utf8").split("\n") : [];
const missing = [".work/", ".claude/settings.local.json"].filter((line) => !known.includes(line));
if (missing.length > 0) appendFileSync(exclude, `${known.length > 0 && known.at(-1) !== "" ? "\n" : ""}${missing.join("\n")}\n`);

// The session state of the worktree.
mkdirSync(path.join(dir, ".work"), { recursive: true });
copyFileSync(path.join(import.meta.dirname, "plan.md"), path.join(dir, ".work", "plan.md"));

// Claude Code keys its memory by the folder of the session. Every worktree uses the memory of the main checkout.
const memory = path.join(os.homedir(), ".claude", "projects", main.replace(/[^a-zA-Z0-9]/g, "-"), "memory");
const local = path.join(dir, ".claude", "settings.local.json");
if (!existsSync(local)) {
  mkdirSync(path.dirname(local), { recursive: true });
  writeFileSync(local, `${JSON.stringify({ autoMemoryDirectory: memory }, null, 2)}\n`);
}

console.log(dir);
