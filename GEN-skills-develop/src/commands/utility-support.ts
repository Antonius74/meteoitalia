import { readFile } from "node:fs/promises";
import path from "node:path";
import { getToolAdapter } from "../adapters/index.js";
import { renderAgentsBlock } from "../agents-md/block.js";
import { assertInsideRoot } from "../fs/path-safety.js";
import { sha256Buffer } from "../hashing/sha256.js";
import type { DesiredState } from "../installer/desired-state.js";
import type { Lockfile } from "../schemas/lockfile.js";
import type { ContractManifest, UtilityManifest } from "../schemas/manifests.js";
import type { LoadedPackage } from "./install-support.js";

export interface UtilityPackageState {
  package: LoadedPackage<UtilityManifest>;
  requested: boolean;
  requiredBy: string[];
}

export async function buildAddUtilityDesiredState(input: {
  root: string;
  existingLockfile: Lockfile;
  requestedUtilityName: string;
  contracts: Array<LoadedPackage<ContractManifest>>;
  utilities: UtilityPackageState[];
}): Promise<DesiredState> {
  const desiredFiles = await readExistingManagedFiles(input.root, input.existingLockfile);
  const adapter = getToolAdapter(input.existingLockfile.tool);

  for (const contract of input.contracts) {
    addSkillFiles(desiredFiles, adapter, contract, contract.manifest.skill.name, contract.manifest.skill.source);
  }
  for (const utility of input.utilities) {
    const existing = input.existingLockfile.utilities.find(
      (installedUtility) => installedUtility.name === utility.package.manifest.name,
    );
    if (existing && utility.package.manifest.name !== input.requestedUtilityName) {
      continue;
    }

    addSkillFiles(
      desiredFiles,
      adapter,
      utility.package,
      utility.package.manifest.skill.name,
      utility.package.manifest.skill.source,
    );
  }

  const managedSkills = [
    ...input.existingLockfile.managedSkills,
    ...input.contracts
      .filter(
        (contract) =>
          !input.existingLockfile.managedSkills.some((skill) => skill.package === `contract/${contract.manifest.name}`),
      )
      .map((contract) => ({
        name: contract.manifest.skill.name,
        role: "contract" as const,
        package: `contract/${contract.manifest.name}`,
      })),
    ...input.utilities
      .filter(
        (utility) =>
          !input.existingLockfile.managedSkills.some((skill) => skill.package === `utility/${utility.package.manifest.name}`),
      )
      .map((utility) => ({
        name: utility.package.manifest.skill.name,
        role: "utility" as const,
        package: `utility/${utility.package.manifest.name}`,
      })),
  ];

  return {
    files: desiredFiles,
    managedSkills,
    lockfile: {
      ...input.existingLockfile,
      contracts: mergeContracts(input.existingLockfile.contracts, input.contracts),
      utilities: input.utilities.map((utility) => {
        const existing = input.existingLockfile.utilities.find(
          (installedUtility) => installedUtility.name === utility.package.manifest.name,
        );
        return {
          name: utility.package.manifest.name,
          version:
            existing && utility.package.manifest.name !== input.requestedUtilityName
              ? existing.version
              : utility.package.manifest.version,
          requested: utility.requested,
          requiredBy: utility.requiredBy,
        };
      }),
      managedSkills,
      managedFiles: input.existingLockfile.managedFiles,
    },
  };
}

export async function buildRemoveUtilityDesiredState(input: {
  root: string;
  existingLockfile: Lockfile;
  remainingUtilities: UtilityPackageState[];
}): Promise<DesiredState> {
  const remainingUtilityPackages = new Set(
    input.remainingUtilities.map((utility) => `utility/${utility.package.manifest.name}`),
  );
  const removedPackages = new Set(
    input.existingLockfile.utilities
      .map((utility) => `utility/${utility.name}`)
      .filter((utilityPackage) => !remainingUtilityPackages.has(utilityPackage)),
  );
  const desiredFiles = await readExistingManagedFiles(input.root, input.existingLockfile, removedPackages);
  const managedSkills = input.existingLockfile.managedSkills.filter((skill) => !removedPackages.has(skill.package));

  return {
    files: desiredFiles,
    managedSkills,
    lockfile: {
      ...input.existingLockfile,
      utilities: input.remainingUtilities.map((utility) => {
        const existing = input.existingLockfile.utilities.find(
          (installedUtility) => installedUtility.name === utility.package.manifest.name,
        );
        return {
          name: utility.package.manifest.name,
          version: existing?.version ?? utility.package.manifest.version,
          requested: utility.requested,
          requiredBy: utility.requiredBy,
        };
      }),
      managedSkills,
      managedFiles: input.existingLockfile.managedFiles.filter((file) => !removedPackages.has(file.package)),
    },
  };
}

export function renderAgentsBlockFromLockfile(lockfile: Lockfile): string {
  return renderAgentsBlock({
    variant: lockfile.variant?.name,
    runtimeSkill: lockfile.variant?.runtimeSkill,
    utilities: lockfile.utilities.map((utility) => ({
      name: utility.name,
      description: utilityDescription(utility.name),
    })),
  });
}

export async function assertExistingManagedFilesUnchanged(
  root: string,
  lockfile: Lockfile,
  excludedPackages: Set<string> = new Set(),
): Promise<void> {
  await readExistingManagedFiles(root, lockfile, excludedPackages);
}

async function readExistingManagedFiles(
  root: string,
  lockfile: Lockfile,
  excludedPackages: Set<string> = new Set(),
): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();

  for (const managedFile of lockfile.managedFiles) {
    if (excludedPackages.has(managedFile.package)) {
      continue;
    }

    const content = await readFile(assertInsideRoot(root, managedFile.path));
    if (sha256Buffer(content) !== managedFile.sha256) {
      throw new Error(`Managed file changed locally: ${managedFile.path}`);
    }

    files.set(managedFile.path, content);
  }

  return files;
}

function targetRelativePath(targetSkillDir: string, source: string, sourcePath: string): string {
  if (sourcePath === source) {
    return path.join(targetSkillDir, path.basename(sourcePath));
  }

  if (!sourcePath.startsWith(`${source}/`)) {
    throw new Error(`Utility package source file is outside declared source: ${sourcePath}`);
  }

  return path.join(targetSkillDir, sourcePath.slice(source.length + 1));
}

function addSkillFiles(
  files: Map<string, Buffer>,
  adapter: ReturnType<typeof getToolAdapter>,
  packageToAdd: LoadedPackage<ContractManifest | UtilityManifest>,
  skillName: string,
  source: string,
): void {
  for (const [sourcePath, content] of packageToAdd.files) {
    files.set(targetRelativePath(adapter.skillDir(skillName), source, sourcePath), content);
  }
}

function mergeContracts(
  existingContracts: Lockfile["contracts"],
  contracts: Array<LoadedPackage<ContractManifest>>,
): Lockfile["contracts"] {
  const merged = [...existingContracts];

  for (const contract of contracts) {
    if (!merged.some((installedContract) => installedContract.name === contract.manifest.name)) {
      merged.push({ name: contract.manifest.name, version: contract.manifest.version });
    }
  }

  return merged;
}

function utilityDescription(name: string): string {
  if (name === "read-jira-issue") {
    return "Read Jira issue evidence for workflow skills in read-only mode.";
  }

  return "Installed utility skill.";
}
