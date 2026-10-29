// WorktreeRemove hook. Claude Code calls it when an agent with `isolation: worktree` ends.
// A worktree with commits that are not on origin/main stays: the review and the fix rounds still need its branch.
// The `worktree` skill removes it after the merge.
import { git, mainCheckout, readInput, tryGit } from "./lib.mjs";

const input = readInput();
const worktree = String(input.worktree_path ?? "");
if (worktree === "") {
  console.error("worktree_path is missing");
  process.exit(1);
}

const main = mainCheckout(worktree);
const base = tryGit(main, "rev-parse", "--verify", "--quiet", "origin/main") ? "origin/main" : "main";
const ahead = git(worktree, "rev-list", "--count", `${base}..HEAD`);
if (ahead !== "0") {
  console.error(`${worktree} has ${ahead} commit(s) that are not on ${base}. It stays.`);
  process.exit(1);
}

// No --force: git refuses a worktree with uncommitted work, and then it stays.
try {
  git(main, "worktree", "remove", worktree);
} catch {
  console.error(`git did not remove ${worktree}. It has uncommitted work. It stays.`);
  process.exit(1);
}
