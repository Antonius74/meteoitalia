import { readFile, readdir, rmdir, stat } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { upsertAgentsBlock } from "../agents-md/block.js";
import { exists, removePath, writeTreeFile } from "../fs/file-tree.js";
import { assertInsideRoot } from "../fs/path-safety.js";
import { sha256Buffer } from "../hashing/sha256.js";
import { writeLockfile } from "../lockfile/read-write.js";
import type { Lockfile } from "../schemas/lockfile.js";

export type OverwriteMode = "prompt" | "force" | "fail";

export interface ApplyDesiredStateInput {
  root: string;
  mode: OverwriteMode;
  existingLockfile?: Lockfile;
  desiredFiles: Map<string, Buffer>;
  desiredLockfilePath: string;
  desiredLockfile: Lockfile;
  agentsBlock?: string;
  ignoredExistingPackages?: Set<string>;
}

export interface ApplyResult {
  writtenFiles: string[];
  removedFiles: string[];
  preservedFolders: string[];
  warnings: string[];
}

interface ManagedFolder {
  skillName: string;
  relativePath: string;
}

export async function applyDesiredState(input: ApplyDesiredStateInput): Promise<ApplyResult> {
  const result: ApplyResult = {
    writtenFiles: [],
    removedFiles: [],
    preservedFolders: [],
    warnings: [],
  };

  assertDesiredFilesUnderSkillsRoot(input);
  await assertNoUnmanagedSkillFolderCollisions(input);
  await verifyExistingManagedFiles(input);

  for (const [relativePath, content] of input.desiredFiles) {
    await writeTreeFile(input.root, relativePath, content);
    result.writtenFiles.push(relativePath);
  }

  const obsoleteFiles = obsoleteManagedFiles(input);
  for (const relativePath of obsoleteFiles) {
    assertManagedFileUnderSkillsRoot(input, relativePath, "remove");
    if (await exists(input.root, relativePath)) {
      await removePath(input.root, relativePath);
      result.removedFiles.push(relativePath);
      await pruneEmptyParents(input.root, path.dirname(relativePath), result);
    }
  }

  if (input.agentsBlock) {
    const existing = await readOptionalText(input.root, "AGENTS.md");
    await writeTreeFile(input.root, "AGENTS.md", upsertAgentsBlock(existing, input.agentsBlock));
    result.writtenFiles.push("AGENTS.md");
  }

  const desiredLockfile = lockfileWithComputedHashes(input);
  input.desiredLockfile.managedFiles = desiredLockfile.managedFiles;

  await writeLockfile(input.root, input.desiredLockfilePath, desiredLockfile);
  result.writtenFiles.push(input.desiredLockfilePath);

  return result;
}

function assertDesiredFilesUnderSkillsRoot(input: ApplyDesiredStateInput): void {
  for (const relativePath of input.desiredFiles.keys()) {
    assertManagedFileUnderSkillsRoot(input, relativePath, "write");
  }
}

function assertManagedFileUnderSkillsRoot(
  input: ApplyDesiredStateInput,
  relativePath: string,
  operation: "remove" | "write",
): void {
  const skillsRoot = skillsRootForTool(input.desiredLockfile.tool);
  if (isUnderRelativeRoot(relativePath, skillsRoot)) {
    return;
  }

  throw new Error(`Refusing to ${operation} managed file outside skills root: ${relativePath}`);
}

async function assertNoUnmanagedSkillFolderCollisions(input: ApplyDesiredStateInput): Promise<void> {
  const existingManagedSkills = new Set(input.existingLockfile?.managedSkills.map((skill) => skill.name) ?? []);

  for (const folder of desiredManagedFolders(input)) {
    if (existingManagedSkills.has(folder.skillName)) {
      continue;
    }

    if (await isDirectory(input.root, folder.relativePath)) {
      throw new Error(`Refusing to overwrite unmanaged skill folder: ${assertInsideRoot(input.root, folder.relativePath)}`);
    }
  }
}

async function verifyExistingManagedFiles(input: ApplyDesiredStateInput): Promise<void> {
  for (const managedFile of input.existingLockfile?.managedFiles ?? []) {
    if (input.ignoredExistingPackages?.has(managedFile.package)) {
      continue;
    }

    if (!(await exists(input.root, managedFile.path))) {
      continue;
    }

    const currentHash = sha256Buffer(await readFile(assertInsideRoot(input.root, managedFile.path)));
    if (currentHash === managedFile.sha256) {
      continue;
    }

    if (input.mode === "force") {
      continue;
    }

    if (input.mode === "prompt" && (await confirmOverwrite(managedFile.path))) {
      continue;
    }

    throw new Error(`Managed file changed locally: ${assertInsideRoot(input.root, managedFile.path)}`);
  }
}

async function confirmOverwrite(relativePath: string): Promise<boolean> {
  const readline = createInterface({ input, output });

  try {
    const answer = await readline.question(`Managed file changed locally: ${relativePath}. Overwrite? [y/N] `);
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    readline.close();
  }
}

function obsoleteManagedFiles(input: ApplyDesiredStateInput): string[] {
  const desiredPaths = new Set(input.desiredFiles.keys());

  return (input.existingLockfile?.managedFiles ?? [])
    .map((file) => file.path)
    .filter((relativePath) => !desiredPaths.has(relativePath));
}

function lockfileWithComputedHashes(input: ApplyDesiredStateInput): Lockfile {
  return {
    ...input.desiredLockfile,
    managedFiles: Array.from(input.desiredFiles, ([relativePath, content]) => ({
      path: relativePath,
      package: packageForDesiredFile(input.desiredLockfile, relativePath),
      sha256: sha256Buffer(content),
    })).sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0)),
  };
}

function packageForDesiredFile(lockfile: Lockfile, relativePath: string): string {
  const existing = lockfile.managedFiles.find((file) => file.path === relativePath);
  if (existing) {
    return existing.package;
  }

  const skill = lockfile.managedSkills.find((managedSkill) =>
    normalizedPathSegments(relativePath).includes(managedSkill.name),
  );

  return skill?.package ?? "generated";
}

function desiredManagedFolders(input: ApplyDesiredStateInput): ManagedFolder[] {
  const folders = new Map<string, ManagedFolder>();

  for (const skill of input.desiredLockfile.managedSkills) {
    for (const relativePath of input.desiredFiles.keys()) {
      const folder = skillFolderForPath(relativePath, skill.name);
      if (folder) {
        folders.set(`${skill.name}\0${folder}`, { skillName: skill.name, relativePath: folder });
      }
    }
  }

  for (const relativePath of input.desiredFiles.keys()) {
    const folder = skillFolderFromPath(relativePath);
    if (folder) {
      folders.set(`${folder.skillName}\0${folder.relativePath}`, folder);
    }
  }

  return Array.from(folders.values());
}

function skillFolderForPath(relativePath: string, skillName: string): string | undefined {
  const segments = normalizedPathSegments(relativePath);
  const skillIndex = segments.findIndex((segment, index) => segment === skillName && segments[index - 1] === "skills");

  if (skillIndex === -1) {
    return undefined;
  }

  return path.join(...segments.slice(0, skillIndex + 1));
}

function skillFolderFromPath(relativePath: string): ManagedFolder | undefined {
  const segments = normalizedPathSegments(relativePath);
  const skillsIndex = segments.indexOf("skills");
  const skillName = segments[skillsIndex + 1];

  if (skillsIndex === -1 || !skillName) {
    return undefined;
  }

  return {
    skillName,
    relativePath: path.join(...segments.slice(0, skillsIndex + 2)),
  };
}

function normalizedPathSegments(relativePath: string): string[] {
  return relativePath.split(/[\\/]+/).filter(Boolean);
}

function skillsRootForTool(tool: Lockfile["tool"]): string {
  switch (tool) {
    case "codex":
      return path.join(".agents", "skills");
    case "claude":
      return path.join(".claude", "skills");
  }
}

function isUnderRelativeRoot(relativePath: string, rootPath: string): boolean {
  const segments = normalizedPathSegments(relativePath);
  const rootSegments = normalizedPathSegments(rootPath);

  return (
    segments.length > rootSegments.length &&
    rootSegments.every((rootSegment, index) => segments[index] === rootSegment)
  );
}

async function readOptionalText(root: string, relativePath: string): Promise<string | undefined> {
  try {
    return await readFile(assertInsideRoot(root, relativePath), "utf8");
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function pruneEmptyParents(root: string, relativeDir: string, result: ApplyResult): Promise<void> {
  let current = relativeDir;

  while (!isRootRelativePath(current)) {
    const entries = await readdir(assertInsideRoot(root, current));
    if (entries.length > 0) {
      result.preservedFolders.push(current);
      return;
    }

    await rmdir(assertInsideRoot(root, current));
    current = path.dirname(current);
  }
}

async function isDirectory(root: string, relativePath: string): Promise<boolean> {
  try {
    return (await stat(assertInsideRoot(root, relativePath))).isDirectory();
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isRootRelativePath(relativePath: string): boolean {
  return relativePath === "." || relativePath === "";
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
