// Posts the judged findings of the review-pr skill as one GitHub review. Run it from the main checkout.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const pr = args.find((a) => /^\d+$/.test(a));
if (pr === undefined) {
  console.error(
    "usage: node .claude/skills/review-pr/post-review.mjs <pr> [--threshold 70] [--judgement 50] [--round 1] [--dry-run]",
  );
  process.exit(1);
}
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const threshold = Number(option("--threshold", "70"));
const judgementFloor = Number(option("--judgement", "50"));
const round = option("--round", "1");
const dryRun = args.includes("--dry-run");

const findings = JSON.parse(readFileSync(`.work/review/${pr}/judged.json`, "utf8"));
const diff = execFileSync("gh", ["pr", "diff", pr], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const commentable = linesInDiff(diff);

const bySeverity = (a, b) => rank(a.severity) - rank(b.severity) || b.confidence - a.confidence;
const comments = findings.filter((f) => f.kind === "comment").toSorted(bySeverity);
const code = findings.filter((f) => f.kind !== "comment");
const above = code.filter((f) => f.confidence >= threshold).toSorted(bySeverity);
const judgement = code
  .filter((f) => f.confidence >= judgementFloor && f.confidence < threshold)
  .toSorted(bySeverity);
const below = code.length - above.length - judgement.length;

const inline = [];
const elsewhere = [];
for (const f of above) {
  if (commentable.get(f.file)?.has(f.line)) {
    inline.push({ path: f.file, line: f.line, side: "RIGHT", body: describe(f) });
  } else {
    elsewhere.push(f);
  }
}

const body = [
  `## Review round ${round}`,
  "",
  `${above.length} finding(s) at or above confidence ${threshold}; ${judgement.length} between ${judgementFloor} and ${threshold - 1} for the author's judgement; ${comments.length} on comments; ${below} below, not shown.`,
  "Findings are claims with a failure scenario; zero is a valid result. Merging stays with the author.",
  ...(elsewhere.length === 0
    ? []
    : [
        "",
        "### Outside the diff's lines",
        ...elsewhere.map((f) => `- \`${f.file}:${f.line}\` — ${describe(f)}`),
      ]),
  ...collapsed("Comments outside the rule", comments),
  ...collapsed("For the author's judgement", judgement),
].join("\n");

const payload = { event: "COMMENT", body, comments: inline };

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  const out = execFileSync(
    "gh",
    ["api", `repos/{owner}/{repo}/pulls/${pr}/reviews`, "--method", "POST", "--input", "-"],
    { input: JSON.stringify(payload), encoding: "utf8" },
  );
  console.log(JSON.parse(out).html_url);
}

function collapsed(title, list) {
  if (list.length === 0) {
    return [];
  }
  return [
    "",
    `<details><summary>${title} (${list.length})</summary>`,
    "",
    ...list.map((f) => `- \`${f.file}:${f.line}\` — ${describe(f)}`),
    "",
    "</details>",
  ];
}

function describe(f) {
  return `**${f.severity}** · confidence ${f.confidence} · ${f.reviewer}\n\n${f.claim}\n\nFails when: ${f.failure_scenario}`;
}

function rank(severity) {
  return { blocker: 0, major: 1, minor: 2 }[severity] ?? 3;
}

// Map of new-file path -> set of new-file line numbers that appear in a hunk
// (added or context); GitHub refuses inline comments anywhere else.
function linesInDiff(text) {
  const map = new Map();
  let path = null;
  let line = 0;
  for (const raw of text.split("\n")) {
    if (raw.startsWith("+++ ")) {
      path = raw.slice(4).replace(/^b\//, "");
      map.set(path, new Set());
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }
    if (path === null || raw.startsWith("---") || raw.startsWith("\\")) {
      continue;
    }
    if (raw.startsWith("-")) {
      continue;
    }
    map.get(path).add(line);
    line += 1;
  }
  return map;
}
