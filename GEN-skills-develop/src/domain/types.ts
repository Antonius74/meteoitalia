export const API_VERSION = "nd-gen-skills.nexidigital.com/v1" as const;

export type ToolName = "codex" | "claude";
export type PackageKind = "provider" | "variant" | "contract" | "utility";
export type ManagedSkillRole = "provider" | "runtime" | "contract" | "utility";

export interface ManagedFile {
  path: string;
  package: string;
  sha256: string;
}

export interface ManagedSkill {
  name: string;
  role: ManagedSkillRole;
  package: string;
}
