// PreToolUse hook for Edit|Write, in .claude/settings.json. The input names the agent that makes the call:
//   tester       may write only the test paths and files under .work/
//   implementer  may write no test path
//   anyone else  is not checked, for example the user's own session
// The test paths are the testPaths globs in .claude/yaw.json. --only and --deny force a mode, for tests and checks.
// Hooks in the front matter of an agent do not run in every mode of Claude Code, so this hook lives in the settings.
import path from "node:path";
import { deny, matchesAny, readConfig, readInput, relativeToWorktree, worktrees } from "./lib.mjs";

const input = readInput();
const role = String(input.agent_type ?? "").replace(/^yaw-/, "");
const mode = process.argv[2] ?? (role === "tester" ? "--only" : role === "implementer" ? "--deny" : null);
const target = input.tool_input?.file_path;
if (mode === null || typeof target !== "string") process.exit(0);

const cwd = input.cwd ?? process.cwd();
const { testPaths } = readConfig(cwd);
// The tester writes into another agent's worktree with absolute paths, so the path is matched relative to its worktree.
const relative = relativeToWorktree(path.resolve(cwd, target), worktrees(cwd));
const isTest = relative !== null && matchesAny(relative, testPaths);
const isSessionState = relative !== null && relative.startsWith(".work/");

if (mode === "--only" && !(isTest || isSessionState)) {
  deny(`${target} is not a test file. The tester writes only the test paths of .claude/yaw.json and files under .work/.`);
} else if (mode === "--deny" && isTest) {
  deny(`${target} is a test file. The implementer never edits a test. If a test is wrong, write a "- Dispute:" line under Handoff in .work/plan.md.`);
}
