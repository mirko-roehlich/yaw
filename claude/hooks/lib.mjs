// Shared parts of the YAW hooks. Plain Node, no dependencies.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// The input that Claude Code sends to a hook on stdin.
export function readInput() {
  return JSON.parse(readFileSync(0, "utf8"));
}

export function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

export function tryGit(cwd, ...args) {
  try {
    return git(cwd, ...args);
  } catch {
    return "";
  }
}

// The main checkout: the folder that holds the common .git of every worktree.
export function mainCheckout(cwd) {
  const common = path.resolve(cwd, git(cwd, "rev-parse", "--git-common-dir"));
  if (path.basename(common) !== ".git") throw new Error(`expected <project>/main/.git, found ${common}`);
  return path.dirname(common);
}

// .claude/yaw.json of the main checkout. Adoption writes it.
export function readConfig(cwd) {
  const file = path.join(mainCheckout(cwd), ".claude", "yaw.json");
  if (!existsSync(file)) throw new Error(`${file} does not exist. Adoption writes it.`);
  const config = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(config.testPaths) || config.testPaths.length === 0) throw new Error(`${file} has no testPaths.`);
  return config;
}

// The issue number in the prompt of the agent that the session starts now, or null.
// When Claude Code creates the worktree of an agent, the Agent call is the last tool call in the transcript of the
// session. The transcript format belongs to Claude Code. If it changes, this returns null and the hook keeps its name.
export function issueOfAgent(transcript) {
  if (typeof transcript !== "string" || !existsSync(transcript)) return null;
  let last = null;
  for (const line of readFileSync(transcript, "utf8").split("\n")) {
    try {
      const content = JSON.parse(line).message?.content;
      if (Array.isArray(content)) for (const block of content) if (block.type === "tool_use") last = block;
    } catch {
      // A line that is not JSON is not a tool call.
    }
  }
  if (last === null || !["Agent", "Task"].includes(last.name)) return null;
  const match = /#(\d+)\b/.exec(String(last.input?.prompt ?? ""));
  return match === null ? null : match[1];
}
