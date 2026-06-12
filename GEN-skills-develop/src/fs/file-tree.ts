import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertInsideRoot } from "./path-safety.js";

export interface TreeFile {
  path: string;
  content: Buffer;
}

export async function readTree(root: string, relativeDir = "."): Promise<TreeFile[]> {
  const dir = assertInsideRoot(root, relativeDir);
  const files = await readTreeFromDir(dir, dir);

  return files.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
}

export async function writeTreeFile(root: string, relativePath: string, content: Buffer | string): Promise<void> {
  const target = assertInsideRoot(root, relativePath);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

export async function removePath(root: string, relativePath: string): Promise<void> {
  if (isRootPath(root, relativePath)) {
    throw new Error("Refusing to remove root path");
  }

  const target = assertInsideRoot(root, relativePath);

  await rm(target, { recursive: true, force: true });
}

export async function exists(root: string, relativePath: string): Promise<boolean> {
  const target = assertInsideRoot(root, relativePath);

  try {
    await stat(target);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

async function readTreeFromDir(baseDir: string, dir: string): Promise<TreeFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: TreeFile[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await readTreeFromDir(baseDir, absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push({
        path: path.relative(baseDir, absolutePath),
        content: await readFile(absolutePath),
      });
    }
  }

  return files;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isRootPath(root: string, relativePath: string): boolean {
  return !path.isAbsolute(relativePath) && path.resolve(root, relativePath) === path.resolve(root);
}
