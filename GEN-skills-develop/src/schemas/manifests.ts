import { z } from "zod";
import { API_VERSION } from "../domain/types.js";

const nonEmptyStringSchema = z.string().min(1);
const safeSkillNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  .refine((value) => !value.includes(".."));
const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);

const capabilitySchema = z.union([
  z.object({ skill: safeSkillNameSchema }).strict(),
  z.object({ skills: z.array(safeSkillNameSchema).min(1) }).strict(),
]);

const packageSkillSchema = z
  .object({
    name: safeSkillNameSchema,
    source: nonEmptyStringSchema,
  })
  .strict();

const baseSchema = z
  .object({
    apiVersion: z.literal(API_VERSION),
    name: nonEmptyStringSchema,
    version: versionSchema,
  })
  .strict();

export const providerManifestSchema = baseSchema.extend({
  kind: z.literal("provider"),
  requiresUtilities: z.array(safeSkillNameSchema).default([]),
  capabilities: z.record(capabilitySchema),
  skills: z
    .array(
      z
        .object({
          name: safeSkillNameSchema,
          role: nonEmptyStringSchema,
          source: nonEmptyStringSchema,
        })
        .strict(),
    )
    .min(1),
});

export const variantManifestSchema = baseSchema.extend({
  kind: z.literal("variant"),
  requiresProviderCapabilities: z.array(nonEmptyStringSchema).min(1),
  requiresContracts: z.array(nonEmptyStringSchema).min(1),
  requiresUtilities: z.array(safeSkillNameSchema).default([]),
  runtime: z
    .object({
      skillName: safeSkillNameSchema,
      source: nonEmptyStringSchema,
      references: z.array(safeSkillNameSchema).min(1),
    })
    .strict(),
});

export const contractManifestSchema = baseSchema.extend({
  kind: z.literal("contract"),
  skill: packageSkillSchema,
});

export const utilityManifestSchema = baseSchema.extend({
  kind: z.literal("utility"),
  description: nonEmptyStringSchema,
  userInstallable: z.boolean().default(true),
  requiresContracts: z.array(safeSkillNameSchema).default([]),
  requiresUtilities: z.array(safeSkillNameSchema).default([]),
  skill: packageSkillSchema,
});

export const packageManifestSchema = z.discriminatedUnion("kind", [
  providerManifestSchema,
  variantManifestSchema,
  contractManifestSchema,
  utilityManifestSchema,
]);

export type PackageManifest = z.infer<typeof packageManifestSchema>;
export type ProviderManifest = z.infer<typeof providerManifestSchema>;
export type VariantManifest = z.infer<typeof variantManifestSchema>;
export type ContractManifest = z.infer<typeof contractManifestSchema>;
export type UtilityManifest = z.infer<typeof utilityManifestSchema>;

export function parsePackageManifest(input: unknown): PackageManifest {
  return packageManifestSchema.parse(input);
}
