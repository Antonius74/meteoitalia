import { getToolAdapter } from "../adapters/index.js";
import type { ToolName } from "../domain/types.js";
import { commandRoot, loadRegistry, readExistingLockfile } from "./install-support.js";

export interface ListCommandOptions {
  root?: string;
  tool: ToolName;
  available?: boolean;
  registry?: string;
}

export interface ListCommandResult {
  available: boolean;
  lines: string[];
}

export async function listCommand(options: ListCommandOptions): Promise<ListCommandResult> {
  if (options.available) {
    const registry = await loadRegistry(options.registry);
    return {
      available: true,
      lines: Object.entries(registry.index.packages)
        .filter(([packageId, entry]) => !isHiddenUtility(packageId, entry))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([packageId, entry]) => `${packageId}@${entry.latest}`),
    };
  }

  const root = commandRoot(options.root);
  const adapter = getToolAdapter(options.tool);
  const lockfile = await readExistingLockfile(root, adapter);

  if (!lockfile) {
    throw new Error("No nd-gen-skills lockfile found.");
  }

  const lines = [
    `Tool: ${lockfile.tool}`,
    `Provider: ${lockfile.provider ? formatInstalled(lockfile.provider) : "None"}`,
    `Variant: ${
      lockfile.variant
        ? `${lockfile.variant.name}@${lockfile.variant.version} (runtime: ${lockfile.variant.runtimeSkill})`
        : "None"
    }`,
    `Contracts: ${formatInstalledList(lockfile.contracts)}`,
    `Utilities: ${formatInstalledList(lockfile.utilities)}`,
    `Managed skills: ${lockfile.managedSkills.length}`,
  ];

  return { available: false, lines };
}

function formatInstalled(installed: { name: string; version: string }): string {
  return `${installed.name}@${installed.version}`;
}

function formatInstalledList(installed: Array<{ name: string; version: string }>): string {
  return installed.length === 0 ? "None" : installed.map(formatInstalled).join(", ");
}

function isHiddenUtility(packageId: string, entry: { userInstallable?: boolean }): boolean {
  return packageId.startsWith("utility/") && entry.userInstallable === false;
}
