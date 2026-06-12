import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { assertInsideRoot } from "../fs/path-safety.js";
import { writeTreeFile } from "../fs/file-tree.js";
import { parseLockfile, type Lockfile } from "../schemas/lockfile.js";

export async function readLockfile(root: string, path: string): Promise<Lockfile | undefined> {
  try {
    const content = await readFile(assertInsideRoot(root, path), "utf8");
    return parseLockfile(YAML.parse(content));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

export async function writeLockfile(root: string, path: string, lockfile: Lockfile): Promise<void> {
  await writeTreeFile(root, path, YAML.stringify(lockfile));
}
