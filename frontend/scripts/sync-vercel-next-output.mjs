import {
  copyFileSync,
  cpSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
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
const frontendNodeModules = join(appRoot, "node_modules");
const rootNodeModules = join(repoRoot, "node_modules");

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

const routesManifest = join(target, "routes-manifest.json");
const deterministicRoutesManifest = join(
  target,
  "routes-manifest-deterministic.json",
);

if (existsSync(routesManifest) && !existsSync(deterministicRoutesManifest)) {
  copyFileSync(routesManifest, deterministicRoutesManifest);
}

if (!existsSync(rootNodeModules) && existsSync(frontendNodeModules)) {
  symlinkSync(frontendNodeModules, rootNodeModules, "dir");
  console.log("[vercel] Linked repo-root node_modules to frontend/node_modules.");
}

console.log("[vercel] Synced frontend/.next to repo root for Vercel finalization.");
