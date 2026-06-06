import { cpSync, existsSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";

if (!process.env.VERCEL) {
  process.exit(0);
}

const appRoot = process.cwd();
const repoRoot = dirname(appRoot);

if (basename(appRoot) !== "frontend") {
  process.exit(0);
}

const source = join(appRoot, ".next");
const target = join(repoRoot, ".next");

if (!existsSync(source)) {
  console.warn("[vercel] .next output was not found; skipping sync.");
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, {
  recursive: true,
  force: true,
  filter: (path) => !path.includes(`${join(".next", "cache")}`),
});

console.log("[vercel] Synced frontend/.next to repo root for Vercel finalization.");
