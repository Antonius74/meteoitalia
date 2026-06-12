import { getToolAdapter } from "../adapters/index.js";
import type { ToolName } from "../domain/types.js";
import { applyDesiredState, type ApplyResult } from "../installer/apply.js";
import type { Lockfile } from "../schemas/lockfile.js";
import {
  buildUtilityDesiredState,
  commandRoot,
  overwriteMode,
  readExistingLockfile,
  renderUtilityAgentsBlock,
} from "./install-support.js";
import {
  isRemovedUtilityName,
  lockfileWithoutRemovedUtilities,
  removedUtilityPackages,
  withoutRemovedUtilityRoots,
} from "./removed-utilities.js";
import { resolveUtilityDependencyClosure } from "./utility-dependencies.js";
import {
  assertExistingManagedFilesUnchanged,
  buildAddUtilityDesiredState,
  renderAgentsBlockFromLockfile,
} from "./utility-support.js";

export interface AddSkillCommandOptions {
  root?: string;
  tool: ToolName;
  skill: string;
  force?: boolean;
  ci?: boolean;
  registry?: string;
}

export async function addSkillCommand(options: AddSkillCommandOptions): Promise<ApplyResult> {
  const root = commandRoot(options.root);
  const adapter = getToolAdapter(options.tool);
  const existingLockfile = await readExistingLockfile(root, adapter);
  const ignoredExistingPackages = removedUtilityPackages();
  if (existingLockfile) {
    await assertExistingManagedFilesUnchanged(root, existingLockfile, ignoredExistingPackages);
  }
  if (isRemovedUtilityName(options.skill)) {
    throw new Error(`Utility skill has been removed and cannot be installed: ${options.skill}`);
  }
  const closure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: withoutRemovedUtilityRoots(
      existingLockfile
        ? [...existingUtilityRoots(existingLockfile.utilities), { name: options.skill, requested: true, requiredBy: [] }]
        : [{ name: options.skill, requested: true, requiredBy: [] }],
    ),
  });
  const activeExistingLockfile = existingLockfile ? lockfileWithoutRemovedUtilities(existingLockfile) : undefined;
  const requestedUtility = closure.utilities.find((utility) => utility.package.manifest.name === options.skill);
  if (requestedUtility && !requestedUtility.package.manifest.userInstallable) {
    throw new Error(`Utility skill is internal and cannot be installed directly: ${options.skill}`);
  }

  if (activeExistingLockfile) {
    const existingContractNames = new Set(activeExistingLockfile.contracts.map((contract) => contract.name));
    const desired = await buildAddUtilityDesiredState({
      root,
      existingLockfile: activeExistingLockfile,
      requestedUtilityName: options.skill,
      contracts: closure.contracts.filter((contract) => !existingContractNames.has(contract.manifest.name)),
      utilities: closure.utilities,
    });

    return applyDesiredState({
      root,
      mode: overwriteMode(options),
      existingLockfile,
      desiredFiles: desired.files,
      desiredLockfilePath: adapter.lockfilePath,
      desiredLockfile: desired.lockfile,
      agentsBlock: renderAgentsBlockFromLockfile(desired.lockfile),
      ignoredExistingPackages,
    });
  }

  const utilityPackages = closure.utilities.map((utility) => utility.package);
  const desired = await buildUtilityDesiredState({
    tool: options.tool,
    contracts: closure.contracts,
    utilities: utilityPackages,
    utilityStates: closure.utilities.map((utility) => ({
      name: utility.package.manifest.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy,
    })),
  });

  return applyDesiredState({
    root,
    mode: overwriteMode(options),
    existingLockfile,
    desiredFiles: desired.files,
    desiredLockfilePath: adapter.lockfilePath,
    desiredLockfile: desired.lockfile,
    agentsBlock: renderUtilityAgentsBlock(utilityPackages),
    ignoredExistingPackages,
  });
}

function existingUtilityRoots(utilities: Lockfile["utilities"]) {
  return utilities.map((utility) => ({
    name: utility.name,
    requested: utility.requested,
    requiredBy: utility.requiredBy,
  }));
}
