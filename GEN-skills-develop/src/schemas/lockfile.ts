import { z } from "zod";
import { API_VERSION } from "../domain/types.js";

const nonEmptyStringSchema = z.string().min(1);

const installedPackageSchema = z
  .object({
    name: nonEmptyStringSchema,
    version: nonEmptyStringSchema,
  })
  .strict();

const installedUtilitySchema = installedPackageSchema
  .extend({
    requested: z.boolean().default(true),
    requiredBy: z.array(nonEmptyStringSchema).default([]),
  })
  .strict();

const variantSchema = installedPackageSchema
  .extend({
    runtimeSkill: nonEmptyStringSchema,
  })
  .strict();

const managedSkillSchema = z
  .object({
    name: nonEmptyStringSchema,
    role: z.enum(["provider", "runtime", "contract", "utility"]),
    package: nonEmptyStringSchema,
  })
  .strict();

const managedFileSchema = z
  .object({
    path: nonEmptyStringSchema,
    package: nonEmptyStringSchema,
    sha256: nonEmptyStringSchema,
  })
  .strict();

export const lockfileSchema = z
  .object({
    apiVersion: z.literal(API_VERSION),
    tool: z.enum(["codex", "claude"]),
    generatedBy: nonEmptyStringSchema,
    provider: installedPackageSchema.optional(),
    variant: variantSchema.optional(),
    contracts: z.array(installedPackageSchema).default([]),
    utilities: z.array(installedUtilitySchema).default([]),
    managedSkills: z.array(managedSkillSchema).default([]),
    managedFiles: z.array(managedFileSchema).default([]),
  })
  .strict();

export type Lockfile = z.infer<typeof lockfileSchema>;

export function parseLockfile(input: unknown): Lockfile {
  return lockfileSchema.parse(input);
}
