import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c as createTar } from "tar";
import YAML from "yaml";
import { API_VERSION, type PackageKind } from "../src/domain/types.js";
import { assertInsideRoot } from "../src/fs/path-safety.js";
import { parsePackageManifest, type PackageManifest } from "../src/schemas/manifests.js";
import type { RegistryIndex } from "../src/registry/types.js";

const PACKAGE_KINDS: PackageKind[] = ["provider", "contract", "variant", "utility"];
const PACKAGE_ORDER = new Map(
  [
    "provider/superpowers",
    "provider/workflow-stack",
    "contract/nexi-workflow-contracts",
    "contract/documentation-core",
    "variant/frontend-react",
    "variant/backend-java",
    "variant/mobile-ios",
    "variant/mobile-android",
    "utility/frontend-react-e2e-test-implementation",
    "utility/backend-service-implementation-kit",
    "utility/backend-controller-implementation-kit",
    "utility/backend-deployment-management",
    "utility/backend-jenkins-build",
    "utility/backend-jenkins-build-script",
    "utility/backend-postman-flow-tests",
    "utility/backend-run-collection",
    "utility/mobile-android-layout-inspector",
    "utility/docx",
    "utility/pdf",
    "utility/pptx",
    "utility/xlsx",
    "utility/office-kit",
    "utility/read-jira-issue",
    "utility/documentation-kit",
    "utility/documentation-design-kit",
    "utility/documentation-ubiquitous-language",
    "utility/documentation-quality-assessment",
    "utility/agents-md-refactor",
    "utility/grill-me",
    "utility/tdd",
    "utility/figma-use",
    "utility/markitdown",
    "utility/cavecrew",
    "utility/caveman",
    "utility/caveman-commit",
    "utility/caveman-compress",
    "utility/caveman-help",
    "utility/caveman-review",
    "utility/caveman-stats",
  ].map((packageKey, index) => [packageKey, index]),
);

export interface BuildRegistryOptions {
  packagesRoot: string;
  outputRoot: string;
}

interface PackageSource {
  root: string;
  manifest: PackageManifest;
  archiveEntries: string[];
}

export async function buildRegistry({ packagesRoot, outputRoot }: BuildRegistryOptions): Promise<RegistryIndex> {
  const packageSources = await discoverPackageSources(packagesRoot);
  const outputPackagesRoot = path.join(outputRoot, "packages");

  await rm(outputRoot, { force: true, recursive: true });
  await mkdir(outputPackagesRoot, { recursive: true });

  const index: RegistryIndex = {
    apiVersion: API_VERSION,
    defaults: {
      provider: "superpowers",
      contracts: ["nexi-workflow-contracts"],
    },
    packages: {},
  };

  for (const packageSource of packageSources) {
    const { manifest, root, archiveEntries } = packageSource;
    const packageKey = `${manifest.kind}/${manifest.name}`;
    const artifact = `packages/${manifest.kind}-${manifest.name}-${manifest.version}.tgz`;

    await createTar(
      {
        cwd: root,
        file: path.join(outputRoot, artifact),
        gzip: true,
        noMtime: true,
        portable: true,
      },
      archiveEntries,
    );

    const entry: RegistryIndex["packages"][string] = {
      latest: manifest.version,
      artifact,
    };
    if (manifest.kind === "utility" && !manifest.userInstallable) {
      entry.userInstallable = false;
    }

    index.packages[packageKey] = entry;
  }

  await writeFile(path.join(outputRoot, "index.yaml"), YAML.stringify(index), "utf8");

  return index;
}

async function discoverPackageSources(packagesRoot: string): Promise<PackageSource[]> {
  const packageSources: PackageSource[] = [];

  for (const kind of PACKAGE_KINDS) {
    const kindRoot = assertInsideRoot(packagesRoot, kind);
    const packageNames = await readdir(kindRoot);

    for (const packageName of packageNames.sort()) {
      const packageRoot = assertInsideRoot(kindRoot, packageName);
      const stat = await lstat(packageRoot);
      if (!stat.isDirectory()) {
        continue;
      }

      const manifest = parsePackageManifest(YAML.parse(await readFile(path.join(packageRoot, "manifest.yaml"), "utf8")));
      if (manifest.kind !== kind || manifest.name !== packageName) {
        throw new Error(`Manifest identity does not match package path: ${kind}/${packageName}`);
      }

      packageSources.push({
        root: packageRoot,
        manifest,
        archiveEntries: await collectArchiveEntries(packageRoot, manifest),
      });
    }
  }

  return packageSources.sort(comparePackageSources);
}

async function collectArchiveEntries(packageRoot: string, manifest: PackageManifest): Promise<string[]> {
  const entries = new Set<string>(["manifest.yaml"]);

  for (const source of getDeclaredSources(manifest)) {
    const sourceEntries = await collectSourceEntries(packageRoot, source);
    for (const entry of sourceEntries) {
      entries.add(entry);
    }
  }

  return [...entries].sort();
}

function getDeclaredSources(manifest: PackageManifest): string[] {
  switch (manifest.kind) {
    case "provider":
      return manifest.skills.map((skill) => skill.source);
    case "variant":
      return [manifest.runtime.source];
    case "contract":
    case "utility":
      return [manifest.skill.source];
  }
}

async function collectSourceEntries(packageRoot: string, relativeSource: string): Promise<string[]> {
  const sourcePath = assertInsideRoot(packageRoot, relativeSource);
  await assertRealPathInsideRoot(packageRoot, sourcePath, relativeSource);

  const stat = await lstat(sourcePath);
  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing to archive symbolic link: ${relativeSource}`);
  }

  if (stat.isFile()) {
    return [toArchivePath(path.relative(packageRoot, sourcePath))];
  }

  if (!stat.isDirectory()) {
    throw new Error(`Package source is not a file or directory: ${relativeSource}`);
  }

  const entries: string[] = [];
  await collectDirectoryEntries(packageRoot, sourcePath, entries);
  return entries;
}

async function collectDirectoryEntries(packageRoot: string, directoryPath: string, entries: string[]): Promise<void> {
  const dirents = await readdir(directoryPath, { withFileTypes: true });

  for (const dirent of dirents.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(directoryPath, dirent.name);
    const relativePath = toArchivePath(path.relative(packageRoot, absolutePath));

    await assertRealPathInsideRoot(packageRoot, absolutePath, relativePath);

    if (dirent.isSymbolicLink()) {
      throw new Error(`Refusing to archive symbolic link: ${relativePath}`);
    }

    if (dirent.isDirectory()) {
      await collectDirectoryEntries(packageRoot, absolutePath, entries);
      continue;
    }

    if (dirent.isFile()) {
      entries.push(relativePath);
    }
  }
}

async function assertRealPathInsideRoot(packageRoot: string, absolutePath: string, displayPath: string): Promise<void> {
  const [realRoot, realTarget] = await Promise.all([realpath(packageRoot), realpath(absolutePath)]);
  const relation = path.relative(realRoot, realTarget);

  if (relation !== "" && (relation.startsWith("..") || path.isAbsolute(relation))) {
    throw new Error(`Refusing to archive path outside package root: ${displayPath}`);
  }
}

function toArchivePath(relativePath: string): string {
  return relativePath.split(path.sep).join(path.posix.sep);
}

function comparePackageSources(left: PackageSource, right: PackageSource): number {
  const leftKey = `${left.manifest.kind}/${left.manifest.name}`;
  const rightKey = `${right.manifest.kind}/${right.manifest.name}`;
  const leftOrder = PACKAGE_ORDER.get(leftKey);
  const rightOrder = PACKAGE_ORDER.get(rightKey);

  if (leftOrder !== undefined || rightOrder !== undefined) {
    return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
  }

  return leftKey.localeCompare(rightKey);
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFilePath) {
  await buildRegistry({ packagesRoot: "packages", outputRoot: "dist-registry" });
}
