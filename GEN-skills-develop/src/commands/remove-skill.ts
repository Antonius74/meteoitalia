import { getToolAdapter } from "../adapters/index.js";
import type { ToolName } from "../domain/types.js";
import { applyDesiredState, type ApplyResult } from "../installer/apply.js";
import { commandRoot, loadUtilityPackage, overwriteMode, readExistingLockfile } from "./install-support.js";
import { removedUtilityPackages, withoutRemovedUtilityRoots } from "./removed-utilities.js";
import { resolveUtilityDependencyClosure } from "./utility-dependencies.js";
import {
  assertExistingManagedFilesUnchanged,
  buildRemoveUtilityDesiredState,
  renderAgentsBlockFromLockfile,
} from "./utility-support.js";

export interface RemoveSkillCommandOptions {
  root?: string;
  tool: ToolName;
  skill: string;
  force?: boolean;
  ci?: boolean;
  registry?: string;
}

export async function removeSkillCommand(options: RemoveSkillCommandOptions): Promise<ApplyResult> {
  const root = commandRoot(options.root);
  const adapter = getToolAdapter(options.tool);
  const existingLockfile = await readExistingLockfile(root, adapter);

  if (!existingLockfile) {
    throw new Error("No nd-gen-skills lockfile found. Run install first.");
  }

  if (!existingLockfile.utilities.some((utility) => utility.name === options.skill)) {
    throw new Error(`Utility skill is not installed: ${options.skill}`);
  }

  try {
    const utilityPackage = await loadUtilityPackage({ registry: options.registry, name: options.skill });
    if (!utilityPackage.manifest.userInstallable) {
      throw new Error(`Utility skill is internal and cannot be removed directly: ${options.skill}`);
    }
  } catch (error) {
    if (!isRegistryPackageNotFoundError(error, options.skill)) {
      throw error;
    }
  }

  const ignoredExistingPackages = removedUtilityPackages();
  await assertExistingManagedFilesUnchanged(root, existingLockfile, ignoredExistingPackages);

  const remainingUtilityRoots = existingLockfile.utilities
    .map((utility) => {
      const requiredByRuntimeState = runtimeStateRequiredBy(utility.requiredBy);

      if (utility.name !== options.skill) {
        if (!utility.requested && requiredByRuntimeState.length === 0) {
          return undefined;
        }

        return {
          name: utility.name,
          requested: utility.requested,
          requiredBy: requiredByRuntimeState,
        };
      }

      if (requiredByRuntimeState.length > 0) {
        return {
          name: utility.name,
          requested: false,
          requiredBy: requiredByRuntimeState,
        };
      }

      return undefined;
    })
    .filter((utility): utility is { name: string; requested: boolean; requiredBy: string[] } => utility !== undefined);
  const closure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: withoutRemovedUtilityRoots(remainingUtilityRoots),
  });
  const desired = await buildRemoveUtilityDesiredState({
    root,
    existingLockfile,
    remainingUtilities: closure.utilities,
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

function runtimeStateRequiredBy(requiredBy: string[]): string[] {
  return requiredBy.filter((source) => !source.startsWith("utility/"));
}

function isRegistryPackageNotFoundError(error: unknown, skill: string): boolean {
  return error instanceof Error && error.message === `Registry package not found: utility/${skill}`;
}
