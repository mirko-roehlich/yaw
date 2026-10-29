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

// The paths of every worktree of the repository, the main checkout first.
export function worktrees(cwd) {
  return tryGit(cwd, "worktree", "list", "--porcelain")
    .split("\n\n")
    .map((entry) => entry.split("\n"))
    .filter((lines) => lines[0].startsWith("worktree ") && !lines.includes("bare"))
    .map((lines) => lines[0].slice("worktree ".length));
}

// .claude/yaw.json of the main checkout. Adoption writes it.
export function readConfig(cwd) {
  const file = path.join(mainCheckout(cwd), ".claude", "yaw.json");
  if (!existsSync(file)) throw new Error(`${file} does not exist. Adoption writes it.`);
  const config = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(config.testPaths) || config.testPaths.length === 0) throw new Error(`${file} has no testPaths.`);
  return config;
}

// A glob as a regular expression: ** matches across folders, * and ? inside one name.
export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      const slash = glob[i + 2] === "/";
      out += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

export function matchesAny(relative, globs) {
  return globs.some((g) => globToRegExp(g).test(relative));
}

// The path of a file relative to the worktree that holds it, with / as separator. Null outside every worktree.
export function relativeToWorktree(file, roots) {
  const resolved = path.resolve(file);
  const root = roots
    .map((r) => path.resolve(r))
    .filter((r) => resolved === r || resolved.startsWith(r + path.sep))
    .sort((a, b) => b.length - a.length)[0];
  return root === undefined ? null : path.relative(root, resolved).split(path.sep).join("/");
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

// A PreToolUse answer that refuses the tool call.
export function deny(reason) {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
}
