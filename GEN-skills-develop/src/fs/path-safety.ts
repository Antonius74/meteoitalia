import { realpathSync } from "node:fs";
import path from "node:path";

export function assertInsideRoot(root: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Path escapes root: ${relativePath}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath);
  const relation = path.relative(resolvedRoot, resolvedTarget);

  if (relation !== "" && (relation.startsWith("..") || path.isAbsolute(relation))) {
    throw new Error(`Path escapes root: ${relativePath}`);
  }

  const realRoot = realpathSync(resolvedRoot);
  const existingAncestor = findExistingAncestor(resolvedTarget, resolvedRoot);
  const realAncestor = realpathSync(existingAncestor);
  const realRelation = path.relative(realRoot, realAncestor);

  if (realRelation === "" || (!realRelation.startsWith("..") && !path.isAbsolute(realRelation))) {
    return resolvedTarget;
  }

  throw new Error(`Refusing to access path outside root: ${relativePath}`);
}

function findExistingAncestor(target: string, root: string): string {
  let candidate = target;

  while (candidate !== root && !pathExists(candidate)) {
    candidate = path.dirname(candidate);
  }

  return candidate;
}

function pathExists(target: string): boolean {
  try {
    realpathSync(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}
