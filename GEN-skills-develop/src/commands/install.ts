import { getToolAdapter } from "../adapters/index.js";
import { applyDesiredState, type ApplyResult } from "../installer/apply.js";
import { planInstall } from "../installer/planner.js";
import type { ToolName } from "../domain/types.js";
import type { Lockfile } from "../schemas/lockfile.js";
import {
  buildRuntimeDesiredState,
  commandRoot,
  loadRuntimePackageSet,
  mergeContractPackages,
  overwriteMode,
  readExistingLockfile,
  renderRuntimeAgentsBlock,
} from "./install-support.js";
import { isRemovedUtilityName, removedUtilityPackages, withoutRemovedUtilityRoots } from "./removed-utilities.js";
import { runtimeUtilityRequests } from "./runtime-utility-requirements.js";
import { resolveUtilityDependencyClosure } from "./utility-dependencies.js";

export interface InstallCommandOptions {
  root?: string;
  tool: ToolName;
  variant: string;
  provider?: string;
  replaceVariant?: boolean;
  force?: boolean;
  ci?: boolean;
  registry?: string;
}

export async function installCommand(options: InstallCommandOptions): Promise<ApplyResult> {
  const root = commandRoot(options.root);
  const adapter = getToolAdapter(options.tool);
  const existingLockfile = await readExistingLockfile(root, adapter);

  planInstall({
    desiredVariant: options.variant,
    replaceVariant: options.replaceVariant ?? false,
    existingLockfile,
  });

  const basePackageSet = await loadRuntimePackageSet({
    registry: options.registry,
    providerName: options.provider ?? existingLockfile?.provider?.name,
    variantName: options.variant,
    utilities: [],
  });
  const utilityClosure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: withoutRemovedUtilityRoots(
      runtimeUtilityRequests({
        provider: basePackageSet.provider.manifest,
        variant: basePackageSet.variant.manifest,
        existingUtilities: requestedExistingUtilities(existingLockfile?.utilities),
      }),
    ),
  });
  const packageSet = {
    ...basePackageSet,
    contracts: mergeContractPackages(basePackageSet.contracts, utilityClosure.contracts),
    utilities: utilityClosure.utilities.map((utility) => utility.package),
    utilityStates: utilityClosure.utilities.map((utility) => ({
      name: utility.package.manifest.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy,
    })),
  };
  const desired = await buildRuntimeDesiredState({ tool: options.tool, packageSet });

  return applyDesiredState({
    root,
    mode: overwriteMode(options),
    existingLockfile,
    desiredFiles: desired.files,
    desiredLockfilePath: adapter.lockfilePath,
    desiredLockfile: desired.lockfile,
    agentsBlock: renderRuntimeAgentsBlock(packageSet),
    ignoredExistingPackages: removedUtilityPackages(),
  });
}

function requestedExistingUtilities(utilities: Lockfile["utilities"] | undefined): Lockfile["utilities"] | undefined {
  return utilities
    ?.filter((utility) => utility.requested && !isRemovedUtilityName(utility.name))
    .map((utility) => ({ ...utility, requiredBy: [] }));
}
