import path from "node:path";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { t as listTar, x as extractTar } from "tar";

export async function extractPackageArchive(archivePath: string): Promise<string> {
  const destination = await mkdtemp(path.join(tmpdir(), `nd-gen-skills-package-${archiveTempName(archivePath)}-`));
  try {
    await assertSafeArchiveEntries(archivePath);
    await extractTar({
      file: archivePath,
      cwd: destination,
      filter(entryPath) {
        return isSafeArchiveEntryPath(entryPath);
      },
    });
    await access(path.join(destination, "manifest.yaml"));
  } catch (error) {
    await rm(destination, { force: true, recursive: true });
    if (isMissingFileError(error)) {
      throw new Error("Package archive is missing manifest.yaml");
    }
    throw error;
  }

  return destination;
}

function archiveTempName(archivePath: string): string {
  return path.basename(archivePath).replace(/[^A-Za-z0-9_.-]/g, "-");
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function assertSafeArchiveEntries(archivePath: string): Promise<void> {
  let unsafePath: string | undefined;

  await listTar({
    file: archivePath,
    onReadEntry(entry) {
      if (!isSafeArchiveEntryPath(entry.path)) {
        unsafePath = entry.path;
      }
    },
  });

  if (unsafePath !== undefined) {
    throw new Error(`Refusing to extract unsafe archive entry: ${unsafePath}`);
  }
}

function isSafeArchiveEntryPath(entryPath: string): boolean {
  if (path.posix.isAbsolute(entryPath) || path.win32.isAbsolute(entryPath)) {
    return false;
  }

  const segments = entryPath.split(/[\\/]+/);
  return !segments.includes("..");
}
