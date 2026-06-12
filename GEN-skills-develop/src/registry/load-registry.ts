import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { API_VERSION } from "../domain/types.js";
import { assertInsideRoot } from "../fs/path-safety.js";
import type { RegistryIndex } from "./types.js";

const registryIndexSchema = z
  .object({
    apiVersion: z.literal(API_VERSION),
    defaults: z
      .object({
        provider: z.string().min(1),
        contracts: z.array(z.string().min(1)),
      })
      .strict(),
    packages: z.record(
      z
        .object({
          latest: z.string().min(1),
          artifact: z.string().min(1),
          userInstallable: z.boolean().optional(),
        })
        .strict(),
    ),
  })
  .strict();

export async function loadRegistryIndex(registryRoot: string): Promise<RegistryIndex> {
  const content = await readFile(join(registryRoot, "index.yaml"), "utf8");
  const index = registryIndexSchema.parse(YAML.parse(content));

  for (const entry of Object.values(index.packages)) {
    assertInsideRoot(registryRoot, entry.artifact);
  }

  return index;
}
