import { API_VERSION, type ManagedSkill, type ToolName } from "../domain/types.js";
import type {
  ContractManifest,
  ProviderManifest,
  UtilityManifest,
  VariantManifest,
} from "../schemas/manifests.js";
import type { Lockfile } from "../schemas/lockfile.js";

export interface DesiredStateInput {
  tool: ToolName;
  generatedBy: string;
  provider?: ProviderManifest;
  contracts?: ContractManifest[];
  variant?: VariantManifest;
  utilities?: UtilityManifest[];
  utilityStates?: UtilityStateInput[];
  files: Map<string, Buffer>;
}

export interface DesiredState {
  lockfile: Lockfile;
  managedSkills: ManagedSkill[];
  files: Map<string, Buffer>;
}

export interface UtilityStateInput {
  name: string;
  requested: boolean;
  requiredBy: string[];
}

export function buildDesiredState(input: DesiredStateInput): DesiredState {
  const contracts = input.contracts ?? [];
  const utilities = input.utilities ?? [];
  const utilityStates = new Map((input.utilityStates ?? []).map((state) => [state.name, state]));

  if (input.variant) {
    validateProviderCapabilities(input.variant, input.provider);
    validateRequiredContracts(input.variant, contracts);
  }

  const managedSkills = [
    ...providerManagedSkills(input.provider),
    ...contractManagedSkills(contracts),
    ...runtimeManagedSkills(input.variant),
    ...utilityManagedSkills(utilities),
  ];

  if (input.variant) {
    validateRuntimeReferences(input.variant, managedSkills);
  }

  const lockfile: Lockfile = {
    apiVersion: API_VERSION,
    tool: input.tool,
    generatedBy: input.generatedBy,
    ...(input.provider ? { provider: { name: input.provider.name, version: input.provider.version } } : {}),
    ...(input.variant
      ? {
          variant: {
            name: input.variant.name,
            version: input.variant.version,
            runtimeSkill: input.variant.runtime.skillName,
          },
        }
      : {}),
    contracts: contracts.map((contract) => ({ name: contract.name, version: contract.version })),
    utilities: utilities.map((utility) => {
      const state = utilityStates.get(utility.name);
      return {
        name: utility.name,
        version: utility.version,
        requested: state?.requested ?? true,
        requiredBy: state?.requiredBy ?? [],
      };
    }),
    managedSkills,
    managedFiles: [],
  };

  return {
    lockfile,
    managedSkills,
    files: input.files,
  };
}

function validateProviderCapabilities(variant: VariantManifest, provider: ProviderManifest | undefined): void {
  for (const capability of variant.requiresProviderCapabilities) {
    if (!provider || !Object.hasOwn(provider.capabilities, capability)) {
      const providerName = provider?.name ?? "none";
      throw new Error(
        `Variant ${variant.name} requires provider capability ${capability}, but provider ${providerName} does not declare it.`,
      );
    }
  }
}

function validateRequiredContracts(variant: VariantManifest, contracts: ContractManifest[]): void {
  const contractNames = new Set(contracts.map((contract) => contract.name));

  for (const requiredContract of variant.requiresContracts) {
    if (!contractNames.has(requiredContract)) {
      throw new Error(`Variant ${variant.name} requires contract ${requiredContract}, but it was not provided.`);
    }
  }
}

function validateRuntimeReferences(variant: VariantManifest, managedSkills: ManagedSkill[]): void {
  const managedSkillNames = new Set(managedSkills.map((skill) => skill.name));

  for (const reference of variant.runtime.references) {
    if (!managedSkillNames.has(reference)) {
      throw new Error(
        `Runtime ${variant.runtime.skillName} references ${reference}, but it is not in desired managed skills.`,
      );
    }
  }
}

function providerManagedSkills(provider: ProviderManifest | undefined): ManagedSkill[] {
  if (!provider) {
    return [];
  }

  return provider.skills.map((skill) => ({
    name: skill.name,
    role: "provider",
    package: `provider/${provider.name}`,
  }));
}

function contractManagedSkills(contracts: ContractManifest[]): ManagedSkill[] {
  return contracts.map((contract) => ({
    name: contract.skill.name,
    role: "contract",
    package: `contract/${contract.name}`,
  }));
}

function runtimeManagedSkills(variant: VariantManifest | undefined): ManagedSkill[] {
  if (!variant) {
    return [];
  }

  return [
    {
      name: variant.runtime.skillName,
      role: "runtime",
      package: `variant/${variant.name}`,
    },
  ];
}

function utilityManagedSkills(utilities: UtilityManifest[]): ManagedSkill[] {
  return utilities.map((utility) => ({
    name: utility.skill.name,
    role: "utility",
    package: `utility/${utility.name}`,
  }));
}
