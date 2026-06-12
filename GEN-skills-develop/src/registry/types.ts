export interface RegistryIndex {
  apiVersion: "nd-gen-skills.nexidigital.com/v1";
  defaults: {
    provider: string;
    contracts: string[];
  };
  packages: Record<string, RegistryPackageEntry>;
}

export interface RegistryPackageEntry {
  latest: string;
  artifact: string;
  userInstallable?: boolean;
}
