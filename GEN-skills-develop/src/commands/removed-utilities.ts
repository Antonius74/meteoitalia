import type { Lockfile } from "../schemas/lockfile.js";
import type { UtilityRootRequest } from "./utility-dependencies.js";

const REMOVED_UTILITY_NAMES = new Set([["nexi", "jira", "summary"].join("-")]);

export function isRemovedUtilityName(name: string): boolean {
  return REMOVED_UTILITY_NAMES.has(name);
}

export function withoutRemovedUtilityRoots(utilities: UtilityRootRequest[]): UtilityRootRequest[] {
  return utilities.filter((utility) => !isRemovedUtilityName(utility.name));
}

export function removedUtilityPackages(): Set<string> {
  return new Set([...REMOVED_UTILITY_NAMES].map((name) => `utility/${name}`));
}

export function lockfileWithoutRemovedUtilities(lockfile: Lockfile): Lockfile {
  const removedPackages = removedUtilityPackages();

  return {
    ...lockfile,
    utilities: lockfile.utilities.filter((utility) => !isRemovedUtilityName(utility.name)),
    managedSkills: lockfile.managedSkills.filter((skill) => !removedPackages.has(skill.package)),
    managedFiles: lockfile.managedFiles.filter((file) => !removedPackages.has(file.package)),
  };
}
