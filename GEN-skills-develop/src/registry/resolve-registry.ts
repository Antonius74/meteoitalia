import { join } from "node:path";

export interface ResolveRegistryOptions {
  flag?: string;
  env?: string;
  packageRoot: string;
}

export function resolveRegistryRoot(options: ResolveRegistryOptions): string {
  return options.flag ?? options.env ?? join(options.packageRoot, "dist-registry");
}
