// SubagentStop hook, in .claude/settings.json. For the implementer, it refuses "done" while the work is not done:
// an open behaviour in .work/plan.md, uncommitted changes, or no pull request for the branch.
// A Handoff line that the build skill answers lets the session end: Awaiting, Dispute, Challenge, Blocked.
// After three refusals in a row the session can end anyway, so that a stuck agent does not burn tokens.
// Hooks in the front matter of an agent do not run in every mode of Claude Code, so this hook lives in the settings.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mainCheckout, readInput, tryGit } from "./lib.mjs";

const input = readInput();
if (String(input.agent_type ?? "").replace(/^yaw-/, "") !== "implementer") process.exit(0);

// For an isolated agent, cwd is its worktree.
const cwd = input.cwd ?? process.cwd();
const main = mainCheckout(cwd);
const plan = path.join(cwd, ".work", "plan.md");
if (!existsSync(plan) || path.resolve(cwd) === main) process.exit(0);

const text = readFileSync(plan, "utf8");
const section = (name) => text.split(`\n## ${name}`)[1]?.split(/\n## /)[0] ?? "";
if (/^- (Awaiting|Dispute|Challenge|Blocked):/m.test(section("Handoff"))) process.exit(0);

const reasons = [];
const open = section("Behaviours").split("\n").filter((l) => l.startsWith("- [ ]"));
if (open.length > 0) reasons.push(`${open.length} behaviour(s) are still open in .work/plan.md:\n${open.join("\n")}`);
if (tryGit(cwd, "status", "--porcelain") !== "") reasons.push("the worktree has uncommitted changes");
const branch = tryGit(cwd, "branch", "--show-current");
if (branch !== "" && pullRequests(branch) === "0") reasons.push(`branch ${branch} has no pull request`);

const counter = path.join(cwd, ".work", "stop-count");
if (reasons.length === 0) {
  writeFileSync(counter, "0\n");
  process.exit(0);
}
const count = (existsSync(counter) ? Number(readFileSync(counter, "utf8")) : 0) + 1;
writeFileSync(counter, `${count}\n`);
const list = reasons.map((r) => `- ${r}`).join("\n");
if (count >= 3) {
  console.log(JSON.stringify({ systemMessage: `The implementer stopped after ${count} refusals. Still open:\n${list}` }));
  process.exit(0);
}
console.log(JSON.stringify({
  decision: "block",
  reason: `Not done yet (refusal ${count} of 3). Finish these, or write a "- Blocked: <question>" line under Handoff in .work/plan.md and open a draft pull request:\n${list}`,
}));

function pullRequests(name) {
  try {
    return execFileSync("gh", ["pr", "list", "--head", name, "--state", "all", "--json", "number", "--jq", "length"], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // Without gh or a network, the check cannot run. It does not block.
    return "";
  }
}
