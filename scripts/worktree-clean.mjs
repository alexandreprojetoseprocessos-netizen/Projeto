import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const targets = [
  ".npm-cache",
  "playwright-report",
  "test-results",
  path.join("apps", "front", ".playwright-results"),
  path.join("apps", "front", ".e2e-logs"),
  path.join("apps", "front", "test-results")
];

let removedCount = 0;

for (const relativeTarget of targets) {
  const absoluteTarget = path.resolve(root, relativeTarget);
  if (!fs.existsSync(absoluteTarget)) {
    console.log(`[worktree:clean] skip ${relativeTarget} (not found)`);
    continue;
  }

  try {
    fs.rmSync(absoluteTarget, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
    removedCount += 1;
    console.log(`[worktree:clean] removed ${relativeTarget}`);
  } catch (error) {
    const errorCode = error && typeof error === "object" && "code" in error ? String(error.code) : "UNKNOWN";
    console.warn(`[worktree:clean] warn ${relativeTarget} (${errorCode})`);
  }
}

console.log(`[worktree:clean] done. removed=${removedCount}`);
