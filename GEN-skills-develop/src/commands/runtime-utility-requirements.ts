import type { Lockfile } from "../schemas/lockfile.js";
import type { ProviderManifest, VariantManifest } from "../schemas/manifests.js";
import type { UtilityRootRequest } from "./utility-dependencies.js";

export function runtimeUtilityRequests(input: {
  provider: ProviderManifest;
  variant: VariantManifest;
  existingUtilities?: Lockfile["utilities"];
}): UtilityRootRequest[] {
  const requests = new Map<string, UtilityRootRequest>();

  for (const utility of input.existingUtilities ?? []) {
    mergeUtilityRequest(requests, {
      name: utility.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy,
    });
  }

  for (const utilityName of input.provider.requiresUtilities) {
    mergeUtilityRequest(requests, {
      name: utilityName,
      requested: false,
      requiredBy: [`provider/${input.provider.name}`],
    });
  }

  for (const utilityName of input.variant.requiresUtilities) {
    mergeUtilityRequest(requests, {
      name: utilityName,
      requested: false,
      requiredBy: [`variant/${input.variant.name}`],
    });
  }

  return [...requests.values()];
}

function mergeUtilityRequest(requests: Map<string, UtilityRootRequest>, next: UtilityRootRequest): void {
  const existing = requests.get(next.name);
  if (!existing) {
    requests.set(next.name, {
      name: next.name,
      requested: next.requested,
      requiredBy: [...new Set(next.requiredBy ?? [])].sort(),
    });
    return;
  }

  existing.requested = existing.requested || next.requested;
  existing.requiredBy = [...new Set([...(existing.requiredBy ?? []), ...(next.requiredBy ?? [])])].sort();
}
