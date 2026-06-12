import { access, lstat, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { getToolAdapter, type ToolAdapter } from "../adapters/index.js";
import { renderAgentsBlock } from "../agents-md/block.js";
import { assertInsideRoot } from "../fs/path-safety.js";
import { buildDesiredState, type DesiredState } from "../installer/desired-state.js";
import type { OverwriteMode } from "../installer/apply.js";
import { readLockfile } from "../lockfile/read-write.js";
import { extractPackageArchive } from "../registry/archive.js";
import { loadRegistryIndex } from "../registry/load-registry.js";
import { resolveRegistryRoot } from "../registry/resolve-registry.js";
import type { RegistryIndex } from "../registry/types.js";
import {
  parsePackageManifest,
  type ContractManifest,
  type PackageManifest,
  type ProviderManifest,
  type UtilityManifest,
  type VariantManifest,
} from "../schemas/manifests.js";
import type { Lockfile } from "../schemas/lockfile.js";
import type { ToolName } from "../domain/types.js";

export const GENERATED_BY = "@nexidigital/nd-gen-skills@0.1.0";

export interface RuntimePackageSet {
  provider: LoadedPackage<ProviderManifest>;
  contracts: Array<LoadedPackage<ContractManifest>>;
  variant: LoadedPackage<VariantManifest>;
  utilities: Array<LoadedPackage<UtilityManifest>>;
  utilityStates: Array<{ name: string; requested: boolean; requiredBy: string[] }>;
}

export interface LoadedPackage<TManifest extends PackageManifest> {
  manifest: TManifest;
  files: Map<string, Buffer>;
}

export interface RegistryContext {
  root: string;
  index: RegistryIndex;
}

export async function loadRuntimePackageSet(input: {
  registry?: string;
  providerName?: string;
  provider?: LoadedPackage<ProviderManifest>;
  contractNames?: string[];
  variantName: string;
  variant?: LoadedPackage<VariantManifest>;
  utilities?: Array<{ name: string; requested?: boolean; requiredBy?: string[] }>;
}): Promise<RuntimePackageSet> {
  const registry = await loadRegistry(input.registry);
  const provider =
    input.provider ??
    (await loadPackageOfKind<ProviderManifest>(
      registry,
      "provider",
      input.providerName ?? registry.index.defaults.provider,
    ));
  const variant = input.variant ?? (await loadPackageOfKind<VariantManifest>(registry, "variant", input.variantName));
  const contracts = await Promise.all(
    (input.contractNames ?? variant.manifest.requiresContracts).map((contractName) =>
      loadPackageOfKind<ContractManifest>(registry, "contract", contractName),
    ),
  );
  const utilities = await Promise.all(
    (input.utilities ?? []).map((utility) => loadPackageOfKind<UtilityManifest>(registry, "utility", utility.name)),
  );
  const utilityStates = (input.utilities ?? []).map((utility) => ({
    name: utility.name,
    requested: utility.requested ?? true,
    requiredBy: utility.requiredBy ?? [],
  }));

  return { provider, contracts, variant, utilities, utilityStates };
}

export async function loadProviderPackage(input: {
  registry?: string;
  name?: string;
}): Promise<LoadedPackage<ProviderManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<ProviderManifest>(registry, "provider", input.name ?? registry.index.defaults.provider);
}

export async function loadVariantPackage(input: {
  registry?: string;
  name: string;
}): Promise<LoadedPackage<VariantManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<VariantManifest>(registry, "variant", input.name);
}

export async function loadUtilityPackage(input: {
  registry?: string;
  name: string;
}): Promise<LoadedPackage<UtilityManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<UtilityManifest>(registry, "utility", input.name);
}

export async function loadContractPackage(input: {
  registry?: string;
  name: string;
}): Promise<LoadedPackage<ContractManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<ContractManifest>(registry, "contract", input.name);
}

export function mergeContractPackages(
  contracts: Array<LoadedPackage<ContractManifest>>,
  additionalContracts: Array<LoadedPackage<ContractManifest>>,
): Array<LoadedPackage<ContractManifest>> {
  const merged = [...contracts];

  for (const contract of additionalContracts) {
    if (!merged.some((installedContract) => installedContract.manifest.name === contract.manifest.name)) {
      merged.push(contract);
    }
  }

  return merged;
}

export async function buildRuntimeDesiredState(input: {
  tool: ToolName;
  packageSet: RuntimePackageSet;
}): Promise<DesiredState> {
  const adapter = getToolAdapter(input.tool);
  const files = new Map<string, Buffer>();

  addProviderFiles(files, adapter, input.packageSet.provider);
  for (const contract of input.packageSet.contracts) {
    addSingleSkillFiles(files, adapter, contract, contract.manifest.skill.name, contract.manifest.skill.source);
  }
  addSingleSkillFiles(
    files,
    adapter,
    input.packageSet.variant,
    input.packageSet.variant.manifest.runtime.skillName,
    input.packageSet.variant.manifest.runtime.source,
  );
  for (const utility of input.packageSet.utilities) {
    addSingleSkillFiles(files, adapter, utility, utility.manifest.skill.name, utility.manifest.skill.source);
  }

  return buildDesiredState({
    tool: input.tool,
    generatedBy: GENERATED_BY,
    provider: input.packageSet.provider.manifest,
    contracts: input.packageSet.contracts.map((contract) => contract.manifest),
    variant: input.packageSet.variant.manifest,
    utilities: input.packageSet.utilities.map((utility) => utility.manifest),
    utilityStates: input.packageSet.utilityStates,
    files,
  });
}

export async function buildUtilityDesiredState(input: {
  tool: ToolName;
  contracts?: Array<LoadedPackage<ContractManifest>>;
  utilities: Array<LoadedPackage<UtilityManifest>>;
  utilityStates?: Array<{ name: string; requested: boolean; requiredBy: string[] }>;
}): Promise<DesiredState> {
  const adapter = getToolAdapter(input.tool);
  const files = new Map<string, Buffer>();

  for (const contract of input.contracts ?? []) {
    addSingleSkillFiles(files, adapter, contract, contract.manifest.skill.name, contract.manifest.skill.source);
  }
  for (const utility of input.utilities) {
    addSingleSkillFiles(files, adapter, utility, utility.manifest.skill.name, utility.manifest.skill.source);
  }

  return buildDesiredState({
    tool: input.tool,
    generatedBy: GENERATED_BY,
    contracts: input.contracts?.map((contract) => contract.manifest),
    utilities: input.utilities.map((utility) => utility.manifest),
    utilityStates: input.utilityStates,
    files,
  });
}

export async function readExistingLockfile(root: string, adapter: ToolAdapter): Promise<Lockfile | undefined> {
  return readLockfile(root, adapter.lockfilePath);
}

export function renderRuntimeAgentsBlock(packageSet: RuntimePackageSet): string {
  return renderAgentsBlock({
    variant: packageSet.variant.manifest.name,
    runtimeSkill: packageSet.variant.manifest.runtime.skillName,
    utilities: packageSet.utilities.map((utility) => ({
      name: utility.manifest.skill.name,
      description: utility.manifest.description,
    })),
  });
}

export function renderUtilityAgentsBlock(utilities: Array<LoadedPackage<UtilityManifest>>): string {
  return renderAgentsBlock({
    utilities: utilities.map((utility) => ({
      name: utility.manifest.skill.name,
      description: utility.manifest.description,
    })),
  });
}

export function overwriteMode(input: { force?: boolean; ci?: boolean }): OverwriteMode {
  if (input.force) {
    return "force";
  }

  if (input.ci || !process.stdin.isTTY) {
    return "fail";
  }

  return "prompt";
}

export function commandRoot(root: string | undefined): string {
  return root ?? process.cwd();
}

export async function loadRegistry(flag: string | undefined): Promise<RegistryContext> {
  const packageRoot = await findPackageRoot();
  const root = resolveRegistryRoot({
    flag,
    env: process.env.NEXI_AI_SKILLS_REGISTRY,
    packageRoot,
  });

  return {
    root,
    index: await loadRegistryIndex(root),
  };
}

async function findPackageRoot(): Promise<string> {
  let current = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

  while (true) {
    try {
      await access(path.join(current, "package.json"));
      return current;
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Unable to locate package root for bundled registry.");
    }
    current = parent;
  }
}

async function loadPackageOfKind<TManifest extends PackageManifest>(
  registry: RegistryContext,
  kind: TManifest["kind"],
  name: string,
): Promise<LoadedPackage<TManifest>> {
  const packageKey = `${kind}/${name}`;
  const entry = registry.index.packages[packageKey];
  if (!entry) {
    throw new Error(`Registry package not found: ${packageKey}`);
  }

  const extractedRoot = await extractPackageArchive(path.join(registry.root, entry.artifact));
  try {
    const manifest = parsePackageManifest(YAML.parse(await readFile(path.join(extractedRoot, "manifest.yaml"), "utf8")));
    if (manifest.kind !== kind || manifest.name !== name) {
      throw new Error(`Registry artifact identity mismatch for ${packageKey}.`);
    }

    return {
      manifest: manifest as TManifest,
      files: await readDeclaredSourceFiles(extractedRoot, manifest),
    };
  } finally {
    await rm(extractedRoot, { recursive: true, force: true });
  }
}

async function readDeclaredSourceFiles(packageRoot: string, manifest: PackageManifest): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();

  for (const source of declaredSources(manifest)) {
    for (const [relativePath, content] of await readSourceFiles(packageRoot, source)) {
      files.set(relativePath, content);
    }
  }

  return files;
}

function declaredSources(manifest: PackageManifest): string[] {
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

async function readSourceFiles(packageRoot: string, source: string): Promise<Array<[string, Buffer]>> {
  const absoluteSource = assertInsideRoot(packageRoot, source);
  const stat = await lstat(absoluteSource);

  if (stat.isFile()) {
    return [[toPortablePath(source), await readFile(absoluteSource)]];
  }

  const files: Array<[string, Buffer]> = [];
  await readDirectorySource(packageRoot, absoluteSource, files);
  return files;
}

async function readDirectorySource(
  packageRoot: string,
  directory: string,
  files: Array<[string, Buffer]>,
): Promise<void> {
  const relativeDirectory = path.relative(packageRoot, directory);
  assertInsideRoot(packageRoot, relativeDirectory || ".");

  const dirents = await readdir(directory, { withFileTypes: true });

  for (const dirent of dirents.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(directory, dirent.name);
    if (dirent.isDirectory()) {
      await readDirectorySource(packageRoot, absolutePath, files);
      continue;
    }
    if (dirent.isFile()) {
      const relativePath = path.relative(packageRoot, absolutePath);
      files.push([toPortablePath(relativePath), await readFile(assertInsideRoot(packageRoot, relativePath))]);
    }
  }
}

function addProviderFiles(
  desiredFiles: Map<string, Buffer>,
  adapter: ToolAdapter,
  provider: LoadedPackage<ProviderManifest>,
): void {
  for (const skill of provider.manifest.skills) {
    addFilesUnderSource(desiredFiles, adapter.skillDir(skill.name), provider.files, skill.source);
  }
}

function addSingleSkillFiles<TManifest extends PackageManifest>(
  desiredFiles: Map<string, Buffer>,
  adapter: ToolAdapter,
  loadedPackage: LoadedPackage<TManifest>,
  skillName: string,
  source: string,
): void {
  addFilesUnderSource(desiredFiles, adapter.skillDir(skillName), loadedPackage.files, source);
}

function addFilesUnderSource(
  desiredFiles: Map<string, Buffer>,
  targetSkillDir: string,
  sourceFiles: Map<string, Buffer>,
  source: string,
): void {
  const normalizedSource = toPortablePath(source);

  for (const [sourcePath, content] of sourceFiles) {
    const normalizedSourcePath = toPortablePath(sourcePath);
    const targetPath = targetRelativePath(targetSkillDir, normalizedSource, normalizedSourcePath);
    if (targetPath) {
      desiredFiles.set(targetPath, content);
    }
  }
}

function targetRelativePath(targetSkillDir: string, source: string, sourcePath: string): string | undefined {
  if (sourcePath === source) {
    return path.join(targetSkillDir, path.basename(sourcePath));
  }

  if (!sourcePath.startsWith(`${source}/`)) {
    return undefined;
  }

  return path.join(targetSkillDir, sourcePath.slice(source.length + 1));
}

function toPortablePath(relativePath: string): string {
  return relativePath.split(path.sep).join(path.posix.sep);
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
