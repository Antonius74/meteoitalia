import type { ContractManifest, UtilityManifest } from "../schemas/manifests.js";
import { loadContractPackage, loadUtilityPackage, type LoadedPackage } from "./install-support.js";

export interface ResolvedUtility {
  package: LoadedPackage<UtilityManifest>;
  requested: boolean;
  requiredBy: string[];
}

export interface UtilityDependencyClosure {
  utilities: ResolvedUtility[];
  contracts: Array<LoadedPackage<ContractManifest>>;
}

export interface UtilityRootRequest {
  name: string;
  requested: boolean;
  requiredBy?: string[];
}

export async function resolveUtilityDependencyClosure(input: {
  registry?: string;
  requestedUtilities?: string[];
  utilities?: UtilityRootRequest[];
}): Promise<UtilityDependencyClosure> {
  const utilities = new Map<string, ResolvedUtility>();
  const contractNames = new Set<string>();
  const visiting: string[] = [];
  const roots: UtilityRootRequest[] = [
    ...(input.requestedUtilities ?? []).map((utilityName) => ({
      name: utilityName,
      requested: true,
      requiredBy: [],
    })),
    ...(input.utilities ?? []),
  ];

  for (const utility of roots) {
    await visitUtility({
      registry: input.registry,
      utilityName: utility.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy ?? [],
      utilities,
      contractNames,
      visiting,
    });
  }

  const contracts = await Promise.all(
    [...contractNames]
      .sort()
      .map((contractName) => loadContractPackage({ registry: input.registry, name: contractName })),
  );

  return {
    utilities: [...utilities.values()],
    contracts,
  };
}

async function visitUtility(input: {
  registry?: string;
  utilityName: string;
  requested: boolean;
  requiredBy: string[];
  utilities: Map<string, ResolvedUtility>;
  contractNames: Set<string>;
  visiting: string[];
}): Promise<void> {
  if (input.visiting.includes(input.utilityName)) {
    const cycleStart = input.visiting.indexOf(input.utilityName);
    const cycle = [...input.visiting.slice(cycleStart), input.utilityName];
    throw new Error(`Circular utility dependency detected: ${cycle.join(" -> ")}`);
  }

  const existing = input.utilities.get(input.utilityName);
  if (existing) {
    existing.requested = existing.requested || input.requested;
    existing.requiredBy = [...new Set([...existing.requiredBy, ...input.requiredBy])].sort();
    return;
  }

  input.visiting.push(input.utilityName);
  try {
    const utilityPackage = await loadUtilityPackage({ registry: input.registry, name: input.utilityName });
    const resolved: ResolvedUtility = {
      package: utilityPackage,
      requested: input.requested,
      requiredBy: [...new Set(input.requiredBy)].sort(),
    };
    input.utilities.set(input.utilityName, resolved);

    for (const contractName of utilityPackage.manifest.requiresContracts) {
      input.contractNames.add(contractName);
    }

    for (const dependencyName of utilityPackage.manifest.requiresUtilities) {
      await visitUtility({
        registry: input.registry,
        utilityName: dependencyName,
        requested: false,
        requiredBy: [`utility/${utilityPackage.manifest.name}`],
        utilities: input.utilities,
        contractNames: input.contractNames,
        visiting: input.visiting,
      });
    }
  } finally {
    input.visiting.pop();
  }
}
