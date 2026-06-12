import { readFile, stat } from "node:fs/promises";
import { getToolAdapter } from "../adapters/index.js";
import { assertInsideRoot } from "../fs/path-safety.js";
import { sha256Buffer } from "../hashing/sha256.js";
import { readLockfile } from "../lockfile/read-write.js";
import type { ToolName } from "../domain/types.js";
import type { Lockfile } from "../schemas/lockfile.js";
import {
  buildRuntimeDesiredState,
  buildUtilityDesiredState,
  loadContractPackage,
  loadRuntimePackageSet,
  loadUtilityPackage,
} from "../commands/install-support.js";

const AGENTS_START = "<!-- nd-gen-skills:start -->";
const AGENTS_END = "<!-- nd-gen-skills:end -->";

export interface ValidateInstallationOptions {
  root: string;
  tool: ToolName;
  registry?: string;
}

export interface ValidateInstallationResult {
  valid: boolean;
  lockfile?: Lockfile;
  errors: string[];
  warnings: string[];
}

export async function validateInstallation(options: ValidateInstallationOptions): Promise<ValidateInstallationResult> {
  const adapter = getToolAdapter(options.tool);
  const errors: string[] = [];
  const warnings: string[] = [];
  const lockfile = await readLockfile(options.root, adapter.lockfilePath);

  if (!lockfile) {
    return {
      valid: false,
      errors: ["No nd-gen-skills lockfile found."],
      warnings,
    };
  }

  if (lockfile.tool !== options.tool) {
    errors.push(`Lockfile tool ${lockfile.tool} does not match selected tool ${options.tool}.`);
  }

  if (lockfile.managedSkills.length > 0 && !(await isDirectory(options.root, adapter.skillsRoot))) {
    errors.push(`Selected tool skills folder is missing: ${adapter.skillsRoot}`);
  }

  await validateManagedFiles(options.root, lockfile, errors, warnings);
  await validatePackages(options, lockfile, errors);
  await validateAgentsBlock(options.root, lockfile, errors);

  return {
    valid: errors.length === 0 && warnings.length === 0,
    lockfile,
    errors,
    warnings,
  };
}

async function validateManagedFiles(
  root: string,
  lockfile: Lockfile,
  errors: string[],
  warnings: string[],
): Promise<void> {
  for (const managedFile of lockfile.managedFiles) {
    const absolutePath = assertInsideRoot(root, managedFile.path);
    let content: Buffer;
    try {
      content = await readFile(absolutePath);
    } catch (error) {
      if (isNotFoundError(error)) {
        errors.push(`Managed file is missing: ${managedFile.path}`);
        continue;
      }
      throw error;
    }

    const currentHash = sha256Buffer(content);
    if (currentHash !== managedFile.sha256) {
      warnings.push(`Managed file changed locally: ${managedFile.path}`);
    }
  }
}

async function validatePackages(
  options: ValidateInstallationOptions,
  lockfile: Lockfile,
  errors: string[],
): Promise<void> {
  const installedUtilities = new Set(lockfile.utilities.map((utility) => utility.name));
  const installedContracts = new Set(lockfile.contracts.map((contract) => contract.name));
  const utilityPackages = await Promise.all(
    lockfile.utilities.map((utility) => loadUtilityPackage({ registry: options.registry, name: utility.name })),
  );

  for (const utility of lockfile.utilities) {
    const utilityPackage = utilityPackages.find((candidate) => candidate.manifest.name === utility.name);
    if (!utilityPackage) {
      continue;
    }

    for (const requiredUtility of utilityPackage.manifest.requiresUtilities) {
      if (!installedUtilities.has(requiredUtility)) {
        errors.push(`Utility ${utility.name} requires utility ${requiredUtility}, but it is not installed.`);
      }
    }

    for (const requiredContract of utilityPackage.manifest.requiresContracts) {
      if (!installedContracts.has(requiredContract)) {
        errors.push(`Utility ${utility.name} requires contract ${requiredContract}, but it is not installed.`);
      }
    }

    if (
      !lockfile.managedSkills.some(
        (skill) => skill.name === utilityPackage.manifest.skill.name && skill.role === "utility",
      )
    ) {
      errors.push(`Utility skill is missing from managed skills: ${utilityPackage.manifest.skill.name}`);
    }
  }

  if (!lockfile.variant) {
    const contractPackages = await Promise.all(
      lockfile.contracts.map((contract) => loadContractPackage({ registry: options.registry, name: contract.name })),
    );
    await buildUtilityDesiredState({
      tool: options.tool,
      contracts: contractPackages,
      utilities: utilityPackages,
      utilityStates: lockfile.utilities.map((utility) => ({
        name: utility.name,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    });
    return;
  }

  if (!lockfile.provider) {
    errors.push(`Installed variant ${lockfile.variant.name} is missing a provider.`);
    return;
  }

  const packageSet = await loadRuntimePackageSet({
    registry: options.registry,
    providerName: lockfile.provider.name,
    contractNames: lockfile.contracts.map((contract) => contract.name),
    variantName: lockfile.variant.name,
    utilities: lockfile.utilities,
  });

  for (const utilityName of packageSet.provider.manifest.requiresUtilities) {
    if (!installedUtilities.has(utilityName)) {
      errors.push(
        `Provider ${packageSet.provider.manifest.name} requires utility ${utilityName}, but it is not installed.`,
      );
    }
  }

  for (const utilityName of packageSet.variant.manifest.requiresUtilities) {
    if (!installedUtilities.has(utilityName)) {
      errors.push(
        `Variant ${packageSet.variant.manifest.name} requires utility ${utilityName}, but it is not installed.`,
      );
    }
  }

  for (const requiredContract of packageSet.variant.manifest.requiresContracts) {
    if (!installedContracts.has(requiredContract)) {
      errors.push(`Variant ${lockfile.variant.name} requires contract ${requiredContract}, but it is not installed.`);
    }
  }

  const installedSkills = new Set(lockfile.managedSkills.map((skill) => skill.name));
  for (const reference of packageSet.variant.manifest.runtime.references) {
    if (!installedSkills.has(reference)) {
      errors.push(`Runtime ${lockfile.variant.runtimeSkill} references missing skill ${reference}.`);
    }
  }

  if (errors.length === 0) {
    await buildRuntimeDesiredState({ tool: options.tool, packageSet });
  }
}

async function validateAgentsBlock(root: string, lockfile: Lockfile, errors: string[]): Promise<void> {
  if (!lockfile.variant && lockfile.utilities.length === 0) {
    return;
  }

  let agents: string;
  try {
    agents = await readFile(assertInsideRoot(root, "AGENTS.md"), "utf8");
  } catch (error) {
    if (isNotFoundError(error)) {
      errors.push("AGENTS.md managed block is missing.");
      return;
    }
    throw error;
  }

  const start = agents.indexOf(AGENTS_START);
  const end = agents.indexOf(AGENTS_END);
  if (start === -1 || end === -1 || end < start) {
    errors.push("AGENTS.md managed block is missing.");
    return;
  }

  const block = agents.slice(start, end + AGENTS_END.length);
  if (!block.includes("## Nexi AI Skills")) {
    errors.push("AGENTS.md managed block is invalid.");
    return;
  }

  if (lockfile.variant && !runtimeSentences(lockfile.variant.runtimeSkill).some((sentence) => block.includes(sentence))) {
    errors.push("AGENTS.md managed block is invalid.");
    return;
  }
}

function runtimeSentences(runtimeSkill: string): string[] {
  return [
    `- Start with \`${runtimeSkill}\` for implementation, debugging, testing, review, and maintenance.`,
    `For implementation, debugging, testing, review, and maintenance work in this repository, start with \`${runtimeSkill}\`.`,
  ];
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

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
