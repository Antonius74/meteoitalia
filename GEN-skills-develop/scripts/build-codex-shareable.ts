import { chmod, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_OUTPUT_DIR = "dist/codex-shareable";

interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface ResolveShareableVersionOptions {
  baseVersion: string;
  outputRoot: string;
  explicitVersion?: string;
  nextVersion?: boolean;
}

export interface BuildCodexShareableOptions {
  repoRoot: string;
  outputRoot?: string;
  explicitVersion?: string;
  nextVersion?: boolean;
  skipBuild?: boolean;
}

export interface BuildCodexShareableResult {
  version: string;
  tarballPath: string;
  runnerPath: string;
}

export async function buildCodexShareable({
  repoRoot,
  outputRoot = path.join(repoRoot, DEFAULT_OUTPUT_DIR),
  explicitVersion,
  nextVersion = false,
  skipBuild = false,
}: BuildCodexShareableOptions): Promise<BuildCodexShareableResult> {
  const packageJson = await readPackageJson(repoRoot);
  const absoluteOutputRoot = path.resolve(repoRoot, outputRoot);
  const version = await resolveShareableVersion({
    baseVersion: packageJson.version,
    outputRoot: absoluteOutputRoot,
    explicitVersion,
    nextVersion,
  });

  if (!skipBuild) {
    await run("npm", ["run", "build"], repoRoot);
    await run("npm", ["run", "build:registry"], repoRoot);
  }

  await mkdir(absoluteOutputRoot, { recursive: true });

  const stagingRoot = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-shareable-"));
  try {
    await stagePackageRoot({ repoRoot, stagingRoot, packageJson: { ...packageJson, version } });

    const packOutput = await run(
      "npm",
      ["pack", stagingRoot, "--pack-destination", absoluteOutputRoot, "--ignore-scripts", "--json"],
      repoRoot,
    );
    const packedPath = resolvePackedPath(packOutput.stdout, absoluteOutputRoot);
    const tarballPath = path.join(absoluteOutputRoot, `gen-skills-${version}.tgz`);
    await rm(tarballPath, { force: true });
    await rename(packedPath, tarballPath);

    const runnerPath = path.join(absoluteOutputRoot, "run-codex-install.js");
    await writeFile(runnerPath, renderRunnerScript(version), "utf8");
    await chmod(runnerPath, 0o755);

    return { version, tarballPath, runnerPath };
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

export async function resolveShareableVersion({
  baseVersion,
  explicitVersion,
  nextVersion = false,
}: ResolveShareableVersionOptions): Promise<string> {
  if (explicitVersion && nextVersion) {
    throw new Error("Use either --version or --next-version, not both.");
  }

  if (explicitVersion) {
    assertMicroVersion(explicitVersion);
    return explicitVersion;
  }

  assertMicroVersion(baseVersion);
  if (!nextVersion) {
    return baseVersion;
  }

  const parsed = parseMicroVersion(baseVersion);
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

export function renderRunnerScript(version: string): string {
  return `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [utilitySkill, targetRepo, ...extraArgs] = process.argv.slice(2);

if (!utilitySkill || !targetRepo) {
  console.error("Usage: node run-codex-install.js <utility-skill> /path/to/target-repo [--force]");
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const tarballPath = path.join(scriptDir, "gen-skills-${version}.tgz");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npmCommand,
  [
    "exec",
    "--yes",
    "--package",
    tarballPath,
    "--",
    "nd-gen-skills",
    "add-skill",
    utilitySkill,
    "--tool",
    "codex",
    "--ci",
    ...extraArgs,
  ],
  {
    cwd: path.resolve(targetRepo),
    env: { ...process.env, CI: process.env.CI ?? "true" },
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
`;
}

async function stagePackageRoot({
  repoRoot,
  stagingRoot,
  packageJson,
}: {
  repoRoot: string;
  stagingRoot: string;
  packageJson: PackageJson;
}): Promise<void> {
  await writeFile(path.join(stagingRoot, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  await cp(path.join(repoRoot, "README.md"), path.join(stagingRoot, "README.md"));
  await cp(path.join(repoRoot, "dist"), path.join(stagingRoot, "dist"), { recursive: true });
  await rm(path.join(stagingRoot, "dist", "codex-shareable"), { force: true, recursive: true });
  await cp(path.join(repoRoot, "dist-registry"), path.join(stagingRoot, "dist-registry"), { recursive: true });
}

async function readPackageJson(repoRoot: string): Promise<PackageJson> {
  const content = await readFile(path.join(repoRoot, "package.json"), "utf8");
  const parsed = JSON.parse(content) as PackageJson;
  assertMicroVersion(parsed.version);
  return parsed;
}

function resolvePackedPath(stdout: string, outputRoot: string): string {
  const packs = JSON.parse(stdout) as Array<{ filename: string }>;
  const filename = packs[0]?.filename;
  if (!filename) {
    throw new Error("npm pack did not return a package filename.");
  }

  return path.isAbsolute(filename) ? filename : path.join(outputRoot, filename);
}

async function run(command: string, args: string[], cwd: string): Promise<{ stdout: string }> {
  const executable = command === "npm" && process.platform === "win32" ? "npm.cmd" : command;
  return execFileAsync(executable, args, {
    cwd,
    env: { ...process.env, CI: "true" },
    maxBuffer: 1024 * 1024 * 10,
  });
}

function parseMicroVersion(version: string): { major: number; minor: number; patch: number } {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Expected a major.minor.patch version, got: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function assertMicroVersion(version: string): void {
  parseMicroVersion(version);
}

function parseCliArgs(argv: string[]): { explicitVersion?: string; nextVersion: boolean; outputRoot?: string } {
  let explicitVersion: string | undefined;
  let outputRoot: string | undefined;
  let nextVersion = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--next-version") {
      nextVersion = true;
      continue;
    }
    if (arg === "--version") {
      explicitVersion = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--output-dir") {
      outputRoot = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { explicitVersion, nextVersion, outputRoot };
}

function requiredValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFilePath) {
  const args = parseCliArgs(process.argv.slice(2));
  const result = await buildCodexShareable({
    repoRoot: path.resolve("."),
    outputRoot: args.outputRoot,
    explicitVersion: args.explicitVersion,
    nextVersion: args.nextVersion,
  });

  console.log(`Built ${result.tarballPath}`);
  console.log(`Runner ${result.runnerPath}`);
  console.log(`Version ${result.version}`);
}
