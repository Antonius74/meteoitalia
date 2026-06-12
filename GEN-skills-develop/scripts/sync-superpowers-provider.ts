import { cp, lstat, mkdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");

export const DEFAULT_SUPERPOWERS_PROVIDER_ROOT = path.join(repoRoot, "packages/provider/superpowers/skills");
const OVERLAPPING_ROOTS_ERROR = "Superpowers provider sync source and target must not overlap.";

export const SUPERPOWERS_PROVIDER_SKILLS = [
  "brainstorming",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "verification-before-completion",
  "writing-plans",
] as const;

export interface SyncSuperpowersProviderOptions {
  sourceRoot: string;
  providerRoot?: string;
  skills?: readonly string[];
}

export interface SyncSuperpowersProviderResult {
  copiedSkills: string[];
}

export async function syncSuperpowersProvider(
  options: SyncSuperpowersProviderOptions,
): Promise<SyncSuperpowersProviderResult> {
  const sourceRoot = path.resolve(options.sourceRoot);
  const providerRoot = path.resolve(options.providerRoot ?? DEFAULT_SUPERPOWERS_PROVIDER_ROOT);
  const skills = [...(options.skills ?? SUPERPOWERS_PROVIDER_SKILLS)].sort();

  for (const skillName of skills) {
    assertValidSkillName(skillName);
  }

  if (await pathsOverlap(sourceRoot, providerRoot)) {
    throw new Error(OVERLAPPING_ROOTS_ERROR);
  }

  for (const skillName of skills) {
    const sourceSkillRoot = path.join(sourceRoot, skillName);
    await assertDirectory(
      sourceSkillRoot,
      `Missing upstream Superpowers skill: ${skillName}`,
      `Upstream Superpowers skill must not be a symlink: ${skillName}`,
    );
    await assertFile(
      path.join(sourceSkillRoot, "SKILL.md"),
      `Upstream Superpowers skill lacks SKILL.md: ${skillName}`,
      `Upstream Superpowers skill SKILL.md must not be a symlink: ${skillName}`,
    );
  }

  for (const skillName of skills) {
    const sourceSkillRoot = path.join(sourceRoot, skillName);
    const destinationSkillRoot = path.join(providerRoot, skillName);

    await rm(destinationSkillRoot, { force: true, recursive: true });
    await mkdir(path.dirname(destinationSkillRoot), { recursive: true });
    await cp(sourceSkillRoot, destinationSkillRoot, { force: true, recursive: true });
  }

  return { copiedSkills: skills };
}

async function assertDirectory(directoryPath: string, message: string, symlinkMessage: string): Promise<void> {
  try {
    const stats = await lstat(directoryPath);
    if (stats.isSymbolicLink()) {
      throw new Error(symlinkMessage);
    }
    if (!stats.isDirectory()) {
      throw new Error(message);
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(message);
    }

    throw error;
  }
}

async function assertFile(filePath: string, message: string, symlinkMessage: string): Promise<void> {
  try {
    const stats = await lstat(filePath);
    if (stats.isSymbolicLink()) {
      throw new Error(symlinkMessage);
    }
    if (!stats.isFile()) {
      throw new Error(message);
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(message);
    }

    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return isNodeError(error) && error.code === "ENOENT";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && typeof (error as NodeJS.ErrnoException).code === "string";
}

function assertValidSkillName(skillName: string): void {
  if (
    skillName.length === 0 ||
    skillName === "." ||
    skillName === ".." ||
    path.isAbsolute(skillName) ||
    skillName.includes("/") ||
    skillName.includes("\\")
  ) {
    throw new Error(`Invalid Superpowers provider skill name: ${skillName}`);
  }
}

async function pathsOverlap(firstPath: string, secondPath: string): Promise<boolean> {
  const [firstComparablePath, secondComparablePath] = await Promise.all([
    comparableRootPath(firstPath),
    comparableRootPath(secondPath),
  ]);

  return (
    firstComparablePath === secondComparablePath ||
    pathContains(firstComparablePath, secondComparablePath) ||
    pathContains(secondComparablePath, firstComparablePath)
  );
}

async function comparableRootPath(rootPath: string): Promise<string> {
  const missingSegments: string[] = [];
  let candidatePath = rootPath;

  while (true) {
    try {
      const realCandidatePath = await realpath(candidatePath);
      return path.join(realCandidatePath, ...missingSegments.reverse());
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const parentPath = path.dirname(candidatePath);
      if (parentPath === candidatePath) {
        return rootPath;
      }

      missingSegments.push(path.basename(candidatePath));
      candidatePath = parentPath;
    }
  }
}

function pathContains(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath.length > 0 && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const sourceRoot = valueAfter(args, "--source") ?? process.env.SUPERPOWERS_SKILLS_SOURCE;
  if (sourceRoot === undefined || sourceRoot.length === 0) {
    throw new Error("Missing --source. Pass the upstream Superpowers skills directory.");
  }

  const result = await syncSuperpowersProvider({
    sourceRoot,
    providerRoot: valueAfter(args, "--target"),
  });

  console.log(`Synced ${result.copiedSkills.length} Superpowers provider skills: ${result.copiedSkills.join(", ")}`);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFilePath) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
