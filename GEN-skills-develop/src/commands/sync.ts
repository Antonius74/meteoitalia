import { getToolAdapter } from "../adapters/index.js";
import type { ToolName } from "../domain/types.js";
import { applyDesiredState, type ApplyResult } from "../installer/apply.js";
import {
  buildRuntimeDesiredState,
  buildUtilityDesiredState,
  commandRoot,
  loadContractPackage,
  loadRuntimePackageSet,
  mergeContractPackages,
  overwriteMode,
  readExistingLockfile,
  renderRuntimeAgentsBlock,
  renderUtilityAgentsBlock,
} from "./install-support.js";
import { isRemovedUtilityName, removedUtilityPackages, withoutRemovedUtilityRoots } from "./removed-utilities.js";
import { runtimeUtilityRequests } from "./runtime-utility-requirements.js";
import { resolveUtilityDependencyClosure } from "./utility-dependencies.js";

export interface SyncCommandOptions {
  root?: string;
  tool: ToolName;
  force?: boolean;
  ci?: boolean;
  registry?: string;
}

export async function syncCommand(options: SyncCommandOptions): Promise<ApplyResult> {
  const root = commandRoot(options.root);
  const adapter = getToolAdapter(options.tool);
  const existingLockfile = await readExistingLockfile(root, adapter);

  if (!existingLockfile) {
    throw new Error("No nd-gen-skills lockfile found. Run install first.");
  }
  const ignoredExistingPackages = removedUtilityPackages();

  const utilityClosure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    requestedUtilities: existingLockfile.utilities
      .filter((utility) => utility.requested && !isRemovedUtilityName(utility.name))
      .map((utility) => utility.name),
  });
  const utilities = utilityClosure.utilities.map((utility) => ({
    name: utility.package.manifest.name,
    requested: utility.requested,
    requiredBy: utility.requiredBy,
  }));
  const contractNames = uniqueNames([
    ...existingLockfile.contracts.map((contract) => contract.name),
    ...utilityClosure.contracts.map((contract) => contract.manifest.name),
  ]);

  const variantName = existingLockfile.variant?.name;
  if (!variantName) {
    const contracts = await Promise.all(
      contractNames.map((contractName) => loadContractPackage({ registry: options.registry, name: contractName })),
    );
    const utilityPackages = utilityClosure.utilities.map((utility) => utility.package);
    const desired = await buildUtilityDesiredState({
      tool: options.tool,
      contracts,
      utilities: utilityPackages,
      utilityStates: utilities,
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

  const basePackageSet = await loadRuntimePackageSet({
    registry: options.registry,
    providerName: existingLockfile.provider?.name,
    contractNames,
    variantName,
    utilities: [],
  });
  const runtimeUtilityClosure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: withoutRemovedUtilityRoots(
      runtimeUtilityRequests({
        provider: basePackageSet.provider.manifest,
        variant: basePackageSet.variant.manifest,
        existingUtilities: utilityClosure.utilities.map((utility) => ({
          name: utility.package.manifest.name,
          version: utility.package.manifest.version,
          requested: utility.requested,
          requiredBy: utility.requiredBy,
        })),
      }),
    ),
  });
  const packageSet = {
    ...basePackageSet,
    contracts: mergeContractPackages(basePackageSet.contracts, runtimeUtilityClosure.contracts),
    utilities: runtimeUtilityClosure.utilities.map((utility) => utility.package),
    utilityStates: runtimeUtilityClosure.utilities.map((utility) => ({
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
    ignoredExistingPackages,
  });
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names) {
    if (seen.has(name)) {
      continue;
    }

    seen.add(name);
    unique.push(name);
  }

  return unique;
}
