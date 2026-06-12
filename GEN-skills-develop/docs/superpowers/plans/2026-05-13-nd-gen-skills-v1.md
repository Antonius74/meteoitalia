# ND Gen Skills V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 `@nexidigital/nd-gen-skills` TypeScript CLI that installs approved Nexi AI skills into Codex and Claude repository-local skill folders from a bundled archive registry.

**Architecture:** Use a contract-first modular CLI. Commands resolve registry packages, validate manifests, compute an install plan, run safety checks, apply file operations, then update lockfiles and the managed `AGENTS.md` block through shared modules.

**Tech Stack:** Node 20+, TypeScript, Vitest, `tsx`, `commander`, `yaml`, `zod`, `tar`, Node `fs/promises`, Node `crypto`.

---

## Scope Check

The approved spec is large but cohesive. It covers one CLI package and one bundled package registry, not independent products. Keep one implementation plan, but commit after each vertical task so the work remains reviewable.

The pre-existing staged `nd-gen-skills-requirements.md` is user work. Do not unstage, amend, or include it in commits unless the user explicitly asks.

## File Structure

Create this root package structure:

```text
package.json
package-lock.json
tsconfig.json
vitest.config.ts
README.md
src/bin/nd-gen-skills.ts
src/cli/args.ts
src/cli/main.ts
src/cli/output.ts
src/domain/types.ts
src/schemas/manifests.ts
src/schemas/lockfile.ts
src/adapters/tool-adapter.ts
src/adapters/codex.ts
src/adapters/claude.ts
src/adapters/index.ts
src/hashing/sha256.ts
src/fs/path-safety.ts
src/fs/file-tree.ts
src/registry/types.ts
src/registry/resolve-registry.ts
src/registry/archive.ts
src/registry/load-registry.ts
src/lockfile/read-write.ts
src/agents-md/block.ts
src/installer/desired-state.ts
src/installer/planner.ts
src/installer/apply.ts
src/installer/validate.ts
src/commands/install.ts
src/commands/sync.ts
src/commands/add-skill.ts
src/commands/remove-skill.ts
src/commands/list.ts
src/commands/validate.ts
scripts/build-registry.ts
packages/provider/superpowers/manifest.yaml
packages/provider/superpowers/skills/*/SKILL.md
packages/contract/nexi-workflow-contracts/manifest.yaml
packages/contract/nexi-workflow-contracts/skill/SKILL.md
packages/contract/nexi-workflow-contracts/skill/templates/test-design.md
packages/contract/nexi-workflow-contracts/skill/templates/traceability.md
packages/variant/frontend-react/manifest.yaml
packages/variant/frontend-react/runtime/SKILL.md
packages/variant/backend-java/manifest.yaml
packages/variant/backend-java/runtime/SKILL.md
packages/variant/mobile-ios/manifest.yaml
packages/variant/mobile-ios/runtime/SKILL.md
packages/variant/mobile-android/manifest.yaml
packages/variant/mobile-android/runtime/SKILL.md
packages/utility/nexi-jira-summary/manifest.yaml
packages/utility/nexi-jira-summary/skill/SKILL.md
tests/unit/*.test.ts
tests/integration/*.test.ts
tests/fixtures/
```

Responsibilities:

- `src/domain/types.ts`: shared domain enums and TypeScript types.
- `src/schemas/*`: zod schemas and parsing helpers for manifests and lockfiles.
- `src/adapters/*`: tool-specific install roots only.
- `src/registry/*`: registry path resolution, YAML index loading, package archive extraction.
- `src/installer/*`: desired-state calculation, plan generation, mutation, validation.
- `src/commands/*`: command orchestration only.
- `packages/*`: canonical package source.
- `dist-registry/*`: generated output from `scripts/build-registry.ts`; do not hand-edit.

---

### Task 1: Project Tooling And CLI Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/bin/nd-gen-skills.ts`
- Create: `src/cli/args.ts`
- Create: `src/cli/main.ts`
- Create: `src/cli/output.ts`
- Create: `tests/unit/cli-args.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing CLI argument tests**

Create `tests/unit/cli-args.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseArgs } from "../../src/cli/args.js";

describe("parseArgs", () => {
  it("defaults install to codex and captures variant", () => {
    expect(parseArgs(["install", "--variant", "frontend-react"])).toEqual({
      command: "install",
      tool: "codex",
      variant: "frontend-react",
      replaceVariant: false,
      force: false,
      ci: false,
      registry: undefined,
    });
  });

  it("fails bare install with the required example", () => {
    expect(() => parseArgs(["install"])).toThrow(
      "Missing required --variant.\nExample: npx -y @nexidigital/nd-gen-skills install --variant frontend-react",
    );
  });

  it("rejects unsupported tools clearly", () => {
    expect(() => parseArgs(["install", "--tool", "cursor", "--variant", "frontend-react"])).toThrow(
      "Unsupported tool: cursor. Supported tools: codex, claude",
    );
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/unit/cli-args.test.ts
```

Expected: command fails because `package.json` and `src/cli/args.ts` do not exist yet.

- [ ] **Step 3: Add project tooling**

Create `package.json`:

```json
{
  "name": "@nexidigital/nd-gen-skills",
  "version": "0.1.0",
  "description": "Nexi Digital AI skills installer for Codex and Claude repositories.",
  "type": "module",
  "bin": {
    "nd-gen-skills": "./dist/bin/nd-gen-skills.js"
  },
  "files": [
    "dist",
    "dist-registry",
    "README.md"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "build:registry": "tsx scripts/build-registry.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build && npm run build:registry"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "tar": "^7.4.3",
    "yaml": "^2.6.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "license": "UNLICENSED"
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
```

- [ ] **Step 4: Implement the argument parser and CLI shell**

Create `src/cli/args.ts`:

```ts
export type ToolName = "codex" | "claude";

export type CommandName = "install" | "sync" | "add-skill" | "remove-skill" | "list" | "validate";

export type ParsedArgs =
  | {
      command: "install";
      tool: ToolName;
      variant: string;
      replaceVariant: boolean;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "sync" | "validate";
      tool: ToolName;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "add-skill" | "remove-skill";
      tool: ToolName;
      skill: string;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "list";
      tool: ToolName;
      available: boolean;
      registry?: string;
    };

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function has(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function parseTool(args: string[]): ToolName {
  const tool = valueAfter(args, "--tool") ?? "codex";
  if (tool !== "codex" && tool !== "claude") {
    throw new Error(`Unsupported tool: ${tool}. Supported tools: codex, claude`);
  }
  return tool;
}

export function parseArgs(args: string[]): ParsedArgs {
  const command = args[0] as CommandName | undefined;
  const tool = parseTool(args);
  const registry = valueAfter(args, "--registry");
  const force = has(args, "--force");
  const ci = has(args, "--ci") || process.env.CI === "true";

  if (command === "install") {
    const variant = valueAfter(args, "--variant");
    if (!variant) {
      throw new Error(
        "Missing required --variant.\nExample: npx -y @nexidigital/nd-gen-skills install --variant frontend-react",
      );
    }
    return {
      command,
      tool,
      variant,
      replaceVariant: has(args, "--replace-variant"),
      force,
      ci,
      registry,
    };
  }

  if (command === "sync" || command === "validate") {
    return { command, tool, force, ci, registry };
  }

  if (command === "add-skill" || command === "remove-skill") {
    const skill = args[1];
    if (!skill || skill.startsWith("-")) {
      throw new Error(`Missing required utility skill name for ${command}.`);
    }
    return { command, tool, skill, force, ci, registry };
  }

  if (command === "list") {
    return { command, tool, available: has(args, "--available"), registry };
  }

  throw new Error("Unknown command. Supported commands: install, sync, add-skill, remove-skill, list, validate");
}
```

Create `src/cli/output.ts`:

```ts
export interface Output {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export const consoleOutput: Output = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
};
```

Create `src/cli/main.ts`:

```ts
import { parseArgs } from "./args.js";
import { consoleOutput, type Output } from "./output.js";

export async function main(argv: string[], output: Output = consoleOutput): Promise<number> {
  try {
    const parsed = parseArgs(argv);
    output.info(JSON.stringify(parsed, null, 2));
    return 0;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
```

Create `src/bin/nd-gen-skills.ts`:

```ts
#!/usr/bin/env node
import { main } from "../cli/main.js";

const code = await main(process.argv.slice(2));
process.exit(code);
```

- [ ] **Step 5: Update README with initial CLI contract**

Replace `README.md` with:

```md
# ND Gen Skills

`@nexidigital/nd-gen-skills` installs approved Nexi AI workflow skills into Codex and Claude repositories.

Primary usage:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

The default tool is Codex. Use `--tool claude` to target Claude repository-local skills.
```

- [ ] **Step 6: Install dependencies and verify tests pass**

Run:

```bash
npm install
npm test -- tests/unit/cli-args.test.ts
npm run build
```

Expected: tests pass and `tsc` completes.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts README.md src/bin/nd-gen-skills.ts src/cli/args.ts src/cli/main.ts src/cli/output.ts tests/unit/cli-args.test.ts
git commit -m "feat: scaffold nd-gen-skills cli"
```

---

### Task 2: Domain Types And Manifest Schemas

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/schemas/manifests.ts`
- Create: `tests/unit/manifest-schemas.test.ts`

- [ ] **Step 1: Write failing manifest schema tests**

Create `tests/unit/manifest-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePackageManifest } from "../../src/schemas/manifests.js";

const apiVersion = "nd-gen-skills.nexidigital.com/v1";

describe("parsePackageManifest", () => {
  it("parses a provider manifest with declared capabilities and skills", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "superpowers",
      version: "0.1.0",
      capabilities: {
        planning: { skill: "writing-plans" },
        "code-review": { skills: ["requesting-code-review", "receiving-code-review"] },
      },
      skills: [{ name: "writing-plans", role: "workflow", source: "skills/writing-plans" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.name).toBe("superpowers");
    expect(manifest.skills[0].source).toBe("skills/writing-plans");
  });

  it("parses a variant manifest and runtime references", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "frontend-react",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      runtime: {
        skillName: "nexi-frontend-react-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts", "writing-plans"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.runtime.skillName).toBe("nexi-frontend-react-runtime");
  });

  it("rejects invalid api versions", () => {
    expect(() =>
      parsePackageManifest({
        apiVersion: "v0",
        kind: "utility",
        name: "nexi-jira-summary",
        version: "0.1.0",
        description: "Summarize Jira issues.",
        skill: { name: "nexi-jira-summary", source: "skill" },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/unit/manifest-schemas.test.ts
```

Expected: fails because `src/schemas/manifests.ts` does not exist.

- [ ] **Step 3: Implement domain types**

Create `src/domain/types.ts`:

```ts
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
```

- [ ] **Step 4: Implement manifest schemas**

Create `src/schemas/manifests.ts` with discriminated zod schemas for provider, variant, contract, and utility manifests. Export `PackageManifest` and `parsePackageManifest`.

Required public API:

```ts
import { z } from "zod";
import { API_VERSION } from "../domain/types.js";

const capabilitySchema = z.union([
  z.object({ skill: z.string().min(1) }),
  z.object({ skills: z.array(z.string().min(1)).min(1) }),
]);

const baseSchema = z.object({
  apiVersion: z.literal(API_VERSION),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export const providerManifestSchema = baseSchema.extend({
  kind: z.literal("provider"),
  capabilities: z.record(capabilitySchema),
  skills: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      source: z.string().min(1),
    }),
  ).min(1),
});

export const variantManifestSchema = baseSchema.extend({
  kind: z.literal("variant"),
  requiresProviderCapabilities: z.array(z.string().min(1)).min(1),
  requiresContracts: z.array(z.string().min(1)).min(1),
  runtime: z.object({
    skillName: z.string().min(1),
    source: z.string().min(1),
    references: z.array(z.string().min(1)).min(1),
  }),
});

export const contractManifestSchema = baseSchema.extend({
  kind: z.literal("contract"),
  skill: z.object({
    name: z.string().min(1),
    source: z.string().min(1),
  }),
});

export const utilityManifestSchema = baseSchema.extend({
  kind: z.literal("utility"),
  description: z.string().min(1),
  skill: z.object({
    name: z.string().min(1),
    source: z.string().min(1),
  }),
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
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/manifest-schemas.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/types.ts src/schemas/manifests.ts tests/unit/manifest-schemas.test.ts
git commit -m "feat: add package manifest schemas"
```

---

### Task 3: Tool Adapters, Hashing, And Path-Safe File Helpers

**Files:**
- Create: `src/adapters/tool-adapter.ts`
- Create: `src/adapters/codex.ts`
- Create: `src/adapters/claude.ts`
- Create: `src/adapters/index.ts`
- Create: `src/hashing/sha256.ts`
- Create: `src/fs/path-safety.ts`
- Create: `src/fs/file-tree.ts`
- Create: `tests/unit/adapters-and-files.test.ts`

- [ ] **Step 1: Write failing adapter and file helper tests**

Create `tests/unit/adapters-and-files.test.ts`:

```ts
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getToolAdapter } from "../../src/adapters/index.js";
import { assertInsideRoot } from "../../src/fs/path-safety.js";
import { sha256Text } from "../../src/hashing/sha256.js";

describe("tool adapters", () => {
  it("maps codex paths", () => {
    const adapter = getToolAdapter("codex");
    expect(adapter.skillDir("brainstorming")).toBe(".agents/skills/brainstorming");
    expect(adapter.lockfilePath).toBe(".agents/nd-gen-skills.lock.yaml");
  });

  it("maps claude paths", () => {
    const adapter = getToolAdapter("claude");
    expect(adapter.skillDir("brainstorming")).toBe(".claude/skills/brainstorming");
    expect(adapter.lockfilePath).toBe(".claude/nd-gen-skills.lock.yaml");
  });
});

describe("path safety and hashing", () => {
  it("rejects traversal outside root", () => {
    expect(() => assertInsideRoot("/repo", "../outside")).toThrow("Refusing to access path outside root");
  });

  it("hashes text deterministically", () => {
    expect(sha256Text("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("uses normal fs APIs in temporary roots", async () => {
    const root = await mkdtemp(join(tmpdir(), "nd-gen-skills-"));
    try {
      const file = join(root, "sample.txt");
      await writeFile(file, "ok", "utf8");
      await expect(readFile(file, "utf8")).resolves.toBe("ok");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- tests/unit/adapters-and-files.test.ts
```

Expected: fails because modules do not exist.

- [ ] **Step 3: Implement adapters**

Create `src/adapters/tool-adapter.ts`:

```ts
import type { ToolName } from "../domain/types.js";

export interface ToolAdapter {
  tool: ToolName;
  skillsRoot: string;
  lockfilePath: string;
  skillDir(skillName: string): string;
}
```

Create `src/adapters/codex.ts`:

```ts
import type { ToolAdapter } from "./tool-adapter.js";

export const codexAdapter: ToolAdapter = {
  tool: "codex",
  skillsRoot: ".agents/skills",
  lockfilePath: ".agents/nd-gen-skills.lock.yaml",
  skillDir: (skillName) => `.agents/skills/${skillName}`,
};
```

Create `src/adapters/claude.ts`:

```ts
import type { ToolAdapter } from "./tool-adapter.js";

export const claudeAdapter: ToolAdapter = {
  tool: "claude",
  skillsRoot: ".claude/skills",
  lockfilePath: ".claude/nd-gen-skills.lock.yaml",
  skillDir: (skillName) => `.claude/skills/${skillName}`,
};
```

Create `src/adapters/index.ts`:

```ts
import type { ToolName } from "../domain/types.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import type { ToolAdapter } from "./tool-adapter.js";

export function getToolAdapter(tool: ToolName): ToolAdapter {
  return tool === "claude" ? claudeAdapter : codexAdapter;
}
```

- [ ] **Step 4: Implement hashing and path helpers**

Create `src/hashing/sha256.ts`:

```ts
import { createHash } from "node:crypto";

export function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sha256Text(text: string): string {
  return sha256Buffer(Buffer.from(text, "utf8"));
}
```

Create `src/fs/path-safety.ts`:

```ts
import { resolve, sep } from "node:path";

export function assertInsideRoot(root: string, relativePath: string): string {
  const absoluteRoot = resolve(root);
  const absoluteTarget = resolve(root, relativePath);
  if (absoluteTarget !== absoluteRoot && !absoluteTarget.startsWith(`${absoluteRoot}${sep}`)) {
    throw new Error(`Refusing to access path outside root: ${relativePath}`);
  }
  return absoluteTarget;
}
```

Create `src/fs/file-tree.ts`:

```ts
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { assertInsideRoot } from "./path-safety.js";

export interface TreeFile {
  path: string;
  content: Buffer;
}

export async function readTree(root: string, relativeDir = "."): Promise<TreeFile[]> {
  const absoluteDir = assertInsideRoot(root, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files: TreeFile[] = [];
  for (const entry of entries) {
    const childRelative = relative(root, join(absoluteDir, entry.name));
    if (entry.isDirectory()) {
      files.push(...(await readTree(root, childRelative)));
    } else if (entry.isFile()) {
      files.push({ path: childRelative, content: await readFile(join(root, childRelative)) });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function writeTreeFile(root: string, relativePath: string, content: Buffer | string): Promise<void> {
  const absolute = assertInsideRoot(root, relativePath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content);
}

export async function removePath(root: string, relativePath: string): Promise<void> {
  await rm(assertInsideRoot(root, relativePath), { recursive: true, force: true });
}

export async function exists(root: string, relativePath: string): Promise<boolean> {
  try {
    await stat(assertInsideRoot(root, relativePath));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/adapters-and-files.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/adapters src/hashing src/fs tests/unit/adapters-and-files.test.ts
git commit -m "feat: add adapters and file helpers"
```

---

### Task 4: Lockfile Schema And Managed AGENTS Block

**Files:**
- Create: `src/schemas/lockfile.ts`
- Create: `src/lockfile/read-write.ts`
- Create: `src/agents-md/block.ts`
- Create: `tests/unit/lockfile-agents.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/lockfile-agents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderAgentsBlock, upsertAgentsBlock } from "../../src/agents-md/block.js";
import { parseLockfile } from "../../src/schemas/lockfile.js";

describe("lockfile schema", () => {
  it("parses a valid lockfile", () => {
    const lockfile = parseLockfile({
      apiVersion: "nd-gen-skills.nexidigital.com/v1",
      tool: "codex",
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
      provider: { name: "superpowers", version: "0.1.0" },
      variant: { name: "frontend-react", version: "0.1.0", runtimeSkill: "nexi-frontend-react-runtime" },
      contracts: [{ name: "nexi-workflow-contracts", version: "0.1.0" }],
      utilities: [],
      managedSkills: [{ name: "brainstorming", role: "provider", package: "provider/superpowers" }],
      managedFiles: [{ path: ".agents/skills/brainstorming/SKILL.md", package: "provider/superpowers", sha256: "abc" }],
    });

    expect(lockfile.tool).toBe("codex");
  });
});

describe("AGENTS.md block", () => {
  it("renders runtime and utilities", () => {
    expect(
      renderAgentsBlock({
        variant: "frontend-react",
        runtimeSkill: "nexi-frontend-react-runtime",
        utilities: [{ name: "nexi-jira-summary", description: "summarize Jira issues into actionable briefs" }],
      }),
    ).toContain("start with `nexi-frontend-react-runtime`");
  });

  it("preserves content outside the managed block", () => {
    const existing = "# Repo\n\nKeep this.\n\n<!-- nd-gen-skills:start -->\nold\n<!-- nd-gen-skills:end -->\n";
    const next = upsertAgentsBlock(existing, "<!-- nd-gen-skills:start -->\nnew\n<!-- nd-gen-skills:end -->");
    expect(next).toContain("Keep this.");
    expect(next).toContain("new");
    expect(next).not.toContain("old");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
```

Expected: fails because modules do not exist.

- [ ] **Step 3: Implement lockfile schema and IO**

Create `src/schemas/lockfile.ts` with zod schema matching the requirements. Export `Lockfile`, `parseLockfile`, and `lockfileSchema`.

Create `src/lockfile/read-write.ts` with:

```ts
import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { writeTreeFile } from "../fs/file-tree.js";
import { parseLockfile, type Lockfile } from "../schemas/lockfile.js";

export async function readLockfile(root: string, path: string): Promise<Lockfile | undefined> {
  try {
    const content = await readFile(`${root}/${path}`, "utf8");
    return parseLockfile(YAML.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function writeLockfile(root: string, path: string, lockfile: Lockfile): Promise<void> {
  await writeTreeFile(root, path, YAML.stringify(lockfile));
}
```

- [ ] **Step 4: Implement AGENTS block rendering**

Create `src/agents-md/block.ts`:

```ts
const START = "<!-- nd-gen-skills:start -->";
const END = "<!-- nd-gen-skills:end -->";

export interface AgentsBlockInput {
  variant?: string;
  runtimeSkill?: string;
  utilities: Array<{ name: string; description: string }>;
}

export function renderAgentsBlock(input: AgentsBlockInput): string {
  const lines = [
    START,
    "## Nexi AI Skills",
    "",
  ];

  if (input.runtimeSkill && input.variant) {
    lines.push(
      `For implementation, debugging, testing, review, and maintenance work in this repository, start with \`${input.runtimeSkill}\`.`,
      "",
      `This repository uses Nexi AI Skills installed for the \`${input.variant}\` variant.`,
      "",
    );
  } else {
    lines.push("This repository uses Nexi AI Skills utility packages.", "");
  }

  lines.push("Installed utility skills:");
  if (input.utilities.length === 0) {
    lines.push("- None");
  } else {
    for (const utility of input.utilities) {
      lines.push(`- \`${utility.name}\`: ${utility.description}`);
    }
  }

  lines.push(END);
  return `${lines.join("\n")}\n`;
}

export function upsertAgentsBlock(existing: string | undefined, block: string): string {
  if (!existing || existing.trim().length === 0) {
    return block;
  }
  const startIndex = existing.indexOf(START);
  const endIndex = existing.indexOf(END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return `${existing.replace(/\s*$/, "")}\n\n${block}`;
  }
  return `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + END.length).replace(/^\n?/, "")}`;
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/schemas/lockfile.ts src/lockfile/read-write.ts src/agents-md/block.ts tests/unit/lockfile-agents.test.ts
git commit -m "feat: add lockfile and agents block support"
```

---

### Task 5: Registry Index Loading And Archive Extraction

**Files:**
- Create: `src/registry/types.ts`
- Create: `src/registry/resolve-registry.ts`
- Create: `src/registry/archive.ts`
- Create: `src/registry/load-registry.ts`
- Create: `tests/unit/registry.test.ts`

- [ ] **Step 1: Write failing registry tests**

Create `tests/unit/registry.test.ts`:

```ts
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistryIndex } from "../../src/registry/load-registry.js";
import { resolveRegistryRoot } from "../../src/registry/resolve-registry.js";

describe("resolveRegistryRoot", () => {
  it("prefers flag over env and bundled", () => {
    expect(resolveRegistryRoot({ flag: "/tmp/custom", env: "/tmp/env", packageRoot: "/pkg" })).toBe("/tmp/custom");
  });

  it("uses env before bundled", () => {
    expect(resolveRegistryRoot({ env: "/tmp/env", packageRoot: "/pkg" })).toBe("/tmp/env");
  });

  it("falls back to bundled dist-registry", () => {
    expect(resolveRegistryRoot({ packageRoot: "/pkg" })).toBe("/pkg/dist-registry");
  });
});

describe("loadRegistryIndex", () => {
  it("loads a flat registry index", async () => {
    const root = await mkdtemp(join(tmpdir(), "nd-registry-"));
    await mkdir(join(root, "packages"));
    await writeFile(
      join(root, "index.yaml"),
      `apiVersion: nd-gen-skills.nexidigital.com/v1
defaults:
  provider: superpowers
  contracts:
    - nexi-workflow-contracts
packages:
  provider/superpowers:
    latest: 0.1.0
    artifact: packages/provider-superpowers-0.1.0.tgz
`,
    );

    const index = await loadRegistryIndex(root);
    expect(index.defaults.provider).toBe("superpowers");
    expect(index.packages["provider/superpowers"].latest).toBe("0.1.0");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/unit/registry.test.ts
```

Expected: fails because registry modules do not exist.

- [ ] **Step 3: Implement registry types and resolver**

Create `src/registry/types.ts`:

```ts
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
}
```

Create `src/registry/resolve-registry.ts`:

```ts
import { join } from "node:path";

export interface ResolveRegistryOptions {
  flag?: string;
  env?: string;
  packageRoot: string;
}

export function resolveRegistryRoot(options: ResolveRegistryOptions): string {
  return options.flag ?? options.env ?? join(options.packageRoot, "dist-registry");
}
```

- [ ] **Step 4: Implement registry loading and archive extraction**

Create `src/registry/load-registry.ts`:

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { API_VERSION } from "../domain/types.js";
import type { RegistryIndex } from "./types.js";

const registryIndexSchema = z.object({
  apiVersion: z.literal(API_VERSION),
  defaults: z.object({
    provider: z.string().min(1),
    contracts: z.array(z.string().min(1)),
  }),
  packages: z.record(
    z.object({
      latest: z.string().min(1),
      artifact: z.string().min(1),
    }),
  ),
});

export async function loadRegistryIndex(registryRoot: string): Promise<RegistryIndex> {
  const content = await readFile(join(registryRoot, "index.yaml"), "utf8");
  return registryIndexSchema.parse(YAML.parse(content));
}
```

Create `src/registry/archive.ts`:

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { x as extractTar } from "tar";

export async function extractPackageArchive(archivePath: string): Promise<string> {
  const destination = await mkdtemp(join(tmpdir(), "nd-gen-skills-package-"));
  await extractTar({ file: archivePath, cwd: destination });
  return destination;
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/registry.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/registry tests/unit/registry.test.ts
git commit -m "feat: add registry loading"
```

---

### Task 6: Canonical Package Source And Content Tests

**Files:**
- Create: `packages/provider/superpowers/manifest.yaml`
- Create: `packages/provider/superpowers/skills/*/SKILL.md`
- Create: `packages/contract/nexi-workflow-contracts/manifest.yaml`
- Create: `packages/contract/nexi-workflow-contracts/skill/SKILL.md`
- Create: `packages/contract/nexi-workflow-contracts/skill/templates/test-design.md`
- Create: `packages/contract/nexi-workflow-contracts/skill/templates/traceability.md`
- Create: `packages/variant/*/manifest.yaml`
- Create: `packages/variant/*/runtime/SKILL.md`
- Create: `packages/utility/nexi-jira-summary/manifest.yaml`
- Create: `packages/utility/nexi-jira-summary/skill/SKILL.md`
- Create: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Write failing content tests**

Create `tests/unit/package-content.test.ts` that:

- reads every `packages/**/manifest.yaml`;
- parses it with `parsePackageManifest`;
- asserts every manifest source path exists;
- asserts provider skill names include `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`;
- asserts each runtime `SKILL.md` contains `nexi-workflow-contracts`, `command discovery`, `test design`, `traceability`, and variant-specific tool terms;
- asserts `nexi-jira-summary` contains `Jira MCP` and `stop`.

Use this test skeleton:

```ts
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { parsePackageManifest } from "../../src/schemas/manifests.js";

const packageRoots = [
  "packages/provider/superpowers",
  "packages/contract/nexi-workflow-contracts",
  "packages/variant/frontend-react",
  "packages/variant/backend-java",
  "packages/variant/mobile-ios",
  "packages/variant/mobile-android",
  "packages/utility/nexi-jira-summary",
];

describe("package source content", () => {
  it("contains valid manifests and declared source paths", async () => {
    for (const root of packageRoots) {
      const manifest = parsePackageManifest(YAML.parse(await readFile(join(root, "manifest.yaml"), "utf8")));
      const sourcePaths =
        manifest.kind === "provider"
          ? manifest.skills.map((skill) => skill.source)
          : manifest.kind === "variant"
            ? [manifest.runtime.source]
            : [manifest.skill.source];

      for (const source of sourcePaths) {
        await expect(access(join(root, source))).resolves.toBeUndefined();
      }
    }
  });

  it("keeps the Superpowers provider subset explicit", async () => {
    const skills = await readdir("packages/provider/superpowers/skills");
    expect(skills.sort()).toEqual([
      "brainstorming",
      "executing-plans",
      "finishing-a-development-branch",
      "receiving-code-review",
      "requesting-code-review",
      "systematic-debugging",
      "test-driven-development",
      "verification-before-completion",
      "writing-plans",
    ]);
  });

  it("contains substantive runtime guidance for all variants", async () => {
    const checks: Array<[string, string[]]> = [
      ["frontend-react", ["React", "Playwright", "browser"]],
      ["backend-java", ["Gradle", "Maven", "API contract"]],
      ["mobile-ios", ["Xcode", "XCTest", "simulator"]],
      ["mobile-android", ["Gradle", "Espresso", "emulator"]],
    ];

    for (const [variant, terms] of checks) {
      const content = await readFile(`packages/variant/${variant}/runtime/SKILL.md`, "utf8");
      for (const term of ["nexi-workflow-contracts", "command discovery", "test design", "traceability", ...terms]) {
        expect(content).toContain(term);
      }
    }
  });

  it("requires Jira MCP for the Jira utility", async () => {
    const content = await readFile("packages/utility/nexi-jira-summary/skill/SKILL.md", "utf8");
    expect(content).toContain("Jira MCP");
    expect(content).toContain("stop");
    expect(content).toContain("ask the user to set up Jira MCP");
  });
});
```

- [ ] **Step 2: Run failing content tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: fails because package source does not exist yet.

- [ ] **Step 3: Add provider package**

Create `packages/provider/superpowers/manifest.yaml` with the provider manifest from `nd-gen-skills-requirements.md`, including all nine workflow skills.

Copy approved Superpowers source files unchanged from:

```text
/Users/marcofasanella/.agents/vendor/superpowers/skills/
```

Only copy these directories:

```text
brainstorming
writing-plans
executing-plans
test-driven-development
systematic-debugging
verification-before-completion
requesting-code-review
receiving-code-review
finishing-a-development-branch
```

After copy, run:

```bash
diff -qr /Users/marcofasanella/.agents/vendor/superpowers/skills/brainstorming packages/provider/superpowers/skills/brainstorming
```

Expected: no output. Repeat for each copied skill directory.

- [ ] **Step 4: Add contract package**

Create `packages/contract/nexi-workflow-contracts/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: contract
name: nexi-workflow-contracts
version: 0.1.0

skill:
  name: nexi-workflow-contracts
  source: skill
```

Create `packages/contract/nexi-workflow-contracts/skill/SKILL.md` with sections for:

- command discovery artifact;
- test design before TDD;
- automated test levels;
- e2e applicability;
- manual tester scenarios;
- traceability table;
- final delivery contract;
- skipped verification blocker and residual risk.

Create `skill/templates/test-design.md` and `skill/templates/traceability.md` with concrete markdown tables matching the requirements.

- [ ] **Step 5: Add all four runtime packages**

For each variant, create its `manifest.yaml` with `kind: variant`, `requiresProviderCapabilities`, `requiresContracts`, and `runtime` fields matching the design.

Create each `runtime/SKILL.md` with these required sections:

```md
---
name: nexi-<variant>-runtime
description: Nexi runtime workflow for <variant> repositories.
---

# Nexi <Variant> Runtime

## Entry Point
## Required Skill Order
## Command Discovery
## Test Design Before TDD
## Provider Workflow
## Variant Testing Guidance
## Manual Tester Output
## Traceability And Final Delivery
## Blockers And Residual Risk
```

Include variant-specific terms required by the package content test.

- [ ] **Step 6: Add Jira utility package**

Create `packages/utility/nexi-jira-summary/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: nexi-jira-summary
version: 0.1.0
description: Summarize Jira issues into actionable briefs.

skill:
  name: nexi-jira-summary
  source: skill
```

Create `packages/utility/nexi-jira-summary/skill/SKILL.md` with explicit behavior:

- check that Jira MCP tools are available;
- if not available, stop and ask the user to set up Jira MCP;
- fetch the issue;
- summarize status, requirements, blockers, risks, decisions, and next steps;
- do not invent missing fields.

- [ ] **Step 7: Verify content tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages tests/unit/package-content.test.ts
git commit -m "feat: add bundled skill package source"
```

---

### Task 7: Registry Build Script

**Files:**
- Create: `scripts/build-registry.ts`
- Create: `tests/unit/build-registry.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing build-registry tests**

Create `tests/unit/build-registry.test.ts`:

```ts
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { buildRegistry } from "../../scripts/build-registry.js";

describe("buildRegistry", () => {
  it("generates index.yaml and package archives", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "nd-dist-registry-"));
    try {
      await buildRegistry({ packagesRoot: "packages", outputRoot });
      const index = YAML.parse(await readFile(join(outputRoot, "index.yaml"), "utf8"));
      expect(index.defaults.provider).toBe("superpowers");
      expect(index.packages["variant/frontend-react"].artifact).toBe("packages/variant-frontend-react-0.1.0.tgz");
      await expect(access(join(outputRoot, "packages/provider-superpowers-0.1.0.tgz"))).resolves.toBeUndefined();
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: fails because `scripts/build-registry.ts` does not exist.

- [ ] **Step 3: Implement `buildRegistry`**

Create `scripts/build-registry.ts` exporting `buildRegistry({ packagesRoot, outputRoot })`. The script must:

- remove and recreate `outputRoot`;
- discover package roots under `provider`, `contract`, `variant`, and `utility`;
- parse each `manifest.yaml`;
- create a `.tgz` archive per package containing `manifest.yaml` and source content;
- write flat `index.yaml`;
- include defaults `provider: superpowers` and `contracts: [nexi-workflow-contracts]`;
- be runnable directly with default `{ packagesRoot: "packages", outputRoot: "dist-registry" }`.

- [ ] **Step 4: Adjust `.gitignore`**

Keep generated package archives ignored only if the npm package still includes them during packing. If generated registry output should be committed, add:

```gitignore
!dist-registry/
!dist-registry/index.yaml
!dist-registry/packages/
!dist-registry/packages/*.tgz
```

Use the repository policy chosen during implementation. The design requires `dist-registry/` to be included in npm package output; it does not require committing generated artifacts if CI builds them before packing.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
npm run build:registry
test -f dist-registry/index.yaml
npm run build
```

Expected: registry output exists and build passes.

- [ ] **Step 6: Commit**

Run:

```bash
git add scripts/build-registry.ts tests/unit/build-registry.test.ts .gitignore dist-registry
git commit -m "feat: generate bundled registry archives"
```

---

### Task 8: Desired State And Install Planner

**Files:**
- Create: `src/installer/desired-state.ts`
- Create: `src/installer/planner.ts`
- Create: `tests/unit/install-planner.test.ts`

- [ ] **Step 1: Write failing planner tests**

Create `tests/unit/install-planner.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDesiredState } from "../../src/installer/desired-state.js";
import { planInstall } from "../../src/installer/planner.js";

describe("install planner", () => {
  it("includes provider, contracts, and selected variant runtime", () => {
    const desired = buildDesiredState({
      tool: "codex",
      provider: {
        kind: "provider",
        name: "superpowers",
        version: "0.1.0",
        skills: [{ name: "brainstorming", role: "workflow", source: "skills/brainstorming" }],
        capabilities: { planning: { skill: "brainstorming" } },
      },
      contracts: [
        {
          kind: "contract",
          name: "nexi-workflow-contracts",
          version: "0.1.0",
          skill: { name: "nexi-workflow-contracts", source: "skill" },
        },
      ],
      variant: {
        kind: "variant",
        name: "frontend-react",
        version: "0.1.0",
        requiresProviderCapabilities: ["planning"],
        requiresContracts: ["nexi-workflow-contracts"],
        runtime: {
          skillName: "nexi-frontend-react-runtime",
          source: "runtime",
          references: ["nexi-workflow-contracts", "brainstorming"],
        },
      },
      utilities: [],
      files: new Map(),
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
    });

    expect(desired.lockfile.variant?.runtimeSkill).toBe("nexi-frontend-react-runtime");
    expect(desired.managedSkills.map((skill) => skill.name)).toContain("brainstorming");
  });

  it("rejects variant replacement without the flag", () => {
    expect(() =>
      planInstall({
        desiredVariant: "backend-java",
        replaceVariant: false,
        existingLockfile: {
          apiVersion: "nd-gen-skills.nexidigital.com/v1",
          tool: "codex",
          generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
          provider: { name: "superpowers", version: "0.1.0" },
          variant: { name: "frontend-react", version: "0.1.0", runtimeSkill: "nexi-frontend-react-runtime" },
          contracts: [],
          utilities: [],
          managedSkills: [],
          managedFiles: [],
        },
      }),
    ).toThrow("A different variant is already installed: frontend-react. Use --replace-variant to install backend-java.");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts
```

Expected: fails because installer modules do not exist.

- [ ] **Step 3: Implement desired state builder**

Create `src/installer/desired-state.ts`. It must:

- validate provider capabilities required by the variant;
- validate required contracts are present;
- convert provider skills, contract skills, runtime skill, and utilities into managed skill records;
- build a lockfile object;
- keep file content in memory for apply.

Expose:

```ts
export interface DesiredStateInput { /* provider, contracts, variant, utilities, files, tool, generatedBy */ }
export interface DesiredState { lockfile: Lockfile; managedSkills: ManagedSkill[]; files: Map<string, Buffer>; }
export function buildDesiredState(input: DesiredStateInput): DesiredState;
```

- [ ] **Step 4: Implement planner guard**

Create `src/installer/planner.ts` with:

```ts
import type { Lockfile } from "../schemas/lockfile.js";

export function planInstall(input: {
  desiredVariant: string;
  replaceVariant: boolean;
  existingLockfile?: Lockfile;
}): void {
  const installed = input.existingLockfile?.variant?.name;
  if (installed && installed !== input.desiredVariant && !input.replaceVariant) {
    throw new Error(
      `A different variant is already installed: ${installed}. Use --replace-variant to install ${input.desiredVariant}.`,
    );
  }
}
```

Expand this module during later tasks with concrete file operations after apply behavior exists.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/installer/desired-state.ts src/installer/planner.ts tests/unit/install-planner.test.ts
git commit -m "feat: add install desired state planning"
```

---

### Task 9: Apply Engine And File Safety

**Files:**
- Create: `src/installer/apply.ts`
- Create: `tests/integration/apply-safety.test.ts`

- [ ] **Step 1: Write failing apply safety tests**

Create `tests/integration/apply-safety.test.ts`:

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyDesiredState } from "../../src/installer/apply.js";

describe("applyDesiredState", () => {
  it("refuses unmanaged skill folder collisions", async () => {
    const root = await mkdtemp(join(tmpdir(), "nd-apply-"));
    try {
      await mkdir(join(root, ".agents/skills/brainstorming"), { recursive: true });
      await writeFile(join(root, ".agents/skills/brainstorming/SKILL.md"), "local", "utf8");

      await expect(
        applyDesiredState({
          root,
          mode: "fail",
          existingLockfile: undefined,
          desiredFiles: new Map([[".agents/skills/brainstorming/SKILL.md", Buffer.from("managed")]]),
          desiredLockfilePath: ".agents/nd-gen-skills.lock.yaml",
          desiredLockfile: {
            apiVersion: "nd-gen-skills.nexidigital.com/v1",
            tool: "codex",
            generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
            provider: { name: "superpowers", version: "0.1.0" },
            contracts: [],
            utilities: [],
            managedSkills: [{ name: "brainstorming", role: "provider", package: "provider/superpowers" }],
            managedFiles: [],
          },
          agentsBlock: undefined,
        }),
      ).rejects.toThrow("Refusing to overwrite unmanaged skill folder");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("writes managed files and lockfile", async () => {
    const root = await mkdtemp(join(tmpdir(), "nd-apply-"));
    try {
      await applyDesiredState({
        root,
        mode: "fail",
        existingLockfile: undefined,
        desiredFiles: new Map([[".agents/skills/brainstorming/SKILL.md", Buffer.from("managed")]]),
        desiredLockfilePath: ".agents/nd-gen-skills.lock.yaml",
        desiredLockfile: {
          apiVersion: "nd-gen-skills.nexidigital.com/v1",
          tool: "codex",
          generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
          provider: { name: "superpowers", version: "0.1.0" },
          contracts: [],
          utilities: [],
          managedSkills: [{ name: "brainstorming", role: "provider", package: "provider/superpowers" }],
          managedFiles: [],
        },
        agentsBlock: "<!-- nd-gen-skills:start -->\nblock\n<!-- nd-gen-skills:end -->\n",
      });

      await expect(readFile(join(root, ".agents/skills/brainstorming/SKILL.md"), "utf8")).resolves.toBe("managed");
      await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toContain("block");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/integration/apply-safety.test.ts
```

Expected: fails because `apply.ts` does not exist.

- [ ] **Step 3: Implement apply engine**

Create `src/installer/apply.ts`. It must:

- accept overwrite mode `prompt | force | fail`;
- detect unmanaged target skill folders before writing;
- compare existing managed files to lockfile hashes;
- fail changed managed files in `fail` mode;
- overwrite changed managed files in `force` mode;
- write desired files;
- compute final SHA-256 hashes and write them into lockfile `managedFiles`;
- write lockfile YAML;
- upsert the managed `AGENTS.md` block when supplied.

Interactive prompt support can be added in the same file as a function `confirmOverwrite(path: string): Promise<boolean>` using Node `readline/promises`.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- tests/integration/apply-safety.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/installer/apply.ts tests/integration/apply-safety.test.ts
git commit -m "feat: add safe apply engine"
```

---

### Task 10: Install And Sync Commands

**Files:**
- Create: `src/commands/install.ts`
- Create: `src/commands/sync.ts`
- Modify: `src/cli/main.ts`
- Create: `tests/integration/install-sync.test.ts`

- [ ] **Step 1: Write failing install/sync integration tests**

Create `tests/integration/install-sync.test.ts` that:

- builds the registry with `buildRegistry`;
- creates a temporary repo;
- runs command functions directly;
- verifies Codex install writes `.agents/skills/`, lockfile, and `AGENTS.md`;
- verifies same-variant install succeeds;
- verifies different variant install fails without `replaceVariant`;
- verifies `replaceVariant` updates runtime.

Expected assertions:

```ts
expect(await readFile(join(root, ".agents/skills/nexi-frontend-react-runtime/SKILL.md"), "utf8")).toContain("Nexi");
expect(await readFile(join(root, ".agents/nd-gen-skills.lock.yaml"), "utf8")).toContain("frontend-react");
expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain("nexi-frontend-react-runtime");
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts
```

Expected: fails because command handlers do not exist.

- [ ] **Step 3: Implement install command**

Create `src/commands/install.ts`. It must:

- get the tool adapter;
- resolve and load registry;
- load provider, required contracts, and selected variant packages from archives;
- build desired state;
- read existing lockfile;
- enforce variant replacement guard;
- choose overwrite mode: `force` if `--force`, `fail` if `--ci` or non-interactive, otherwise `prompt`;
- call `applyDesiredState`.

- [ ] **Step 4: Implement sync command**

Create `src/commands/sync.ts`. It must:

- read existing lockfile;
- fail clearly if no lockfile exists;
- resolve installed provider, variant, contracts, and utilities from latest registry entries;
- build desired state;
- call `applyDesiredState` with the same overwrite mode policy.

- [ ] **Step 5: Wire CLI main**

Modify `src/cli/main.ts` to call `installCommand` and `syncCommand`. Keep parse errors returning exit code `1`.

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/commands/install.ts src/commands/sync.ts src/cli/main.ts tests/integration/install-sync.test.ts
git commit -m "feat: implement install and sync"
```

---

### Task 11: Utility Commands, List, And Validate

**Files:**
- Create: `src/commands/add-skill.ts`
- Create: `src/commands/remove-skill.ts`
- Create: `src/commands/list.ts`
- Create: `src/commands/validate.ts`
- Create: `src/installer/validate.ts`
- Modify: `src/cli/main.ts`
- Create: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Write failing integration tests**

Create `tests/integration/utility-list-validate.test.ts` covering:

- `add-skill nexi-jira-summary` installs utility without a runtime;
- installing runtime then adding utility lists it in `AGENTS.md`;
- `remove-skill nexi-jira-summary` removes the utility and block entry;
- `list` reports local lockfile packages;
- `list --available` reports registry packages;
- `validate` passes after install;
- `validate --ci` fails after editing a managed file.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: fails because commands do not exist.

- [ ] **Step 3: Implement utility commands**

Create `src/commands/add-skill.ts` and `src/commands/remove-skill.ts`.

`add-skill` must:

- resolve `utility/<name>` from registry;
- preserve installed runtime/provider/contracts from lockfile if present;
- install the utility files;
- update lockfile `utilities`;
- update `AGENTS.md` block if runtime is present, and create a utility-only block if not.

`remove-skill` must:

- require an existing lockfile;
- fail clearly if the utility is not installed;
- remove only managed utility files after hash checks;
- preserve runtime/provider/contracts;
- update lockfile and `AGENTS.md`.

- [ ] **Step 4: Implement list commands**

Create `src/commands/list.ts`.

`list` output must include tool, provider, variant/runtime if present, contracts, utilities, and managed skill count.

`list --available` output must include registry package IDs and latest versions.

- [ ] **Step 5: Implement validation**

Create `src/installer/validate.ts` and `src/commands/validate.ts`.

Validation must check:

- lockfile exists and parses;
- selected tool folder exists;
- all managed files exist;
- managed hashes match;
- managed `AGENTS.md` block exists when runtime is installed;
- `AGENTS.md` references runtime;
- provider capabilities required by variant are present;
- runtime references resolve to installed skills;
- contracts required by variant are installed;
- utility skills in lockfile exist.

Local mode warns on modified managed files. CI mode fails.

- [ ] **Step 6: Wire CLI main**

Modify `src/cli/main.ts` to route `add-skill`, `remove-skill`, `list`, and `validate`.

- [ ] **Step 7: Verify**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/commands/add-skill.ts src/commands/remove-skill.ts src/commands/list.ts src/commands/validate.ts src/installer/validate.ts src/cli/main.ts tests/integration/utility-list-validate.test.ts
git commit -m "feat: add utility list and validate commands"
```

---

### Task 12: End-To-End CLI And Packaging Verification

**Files:**
- Create: `tests/integration/cli-e2e.test.ts`
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write failing packaged CLI test**

Create `tests/integration/cli-e2e.test.ts`. It must:

- run `npm run build`;
- run `npm run build:registry`;
- execute `node dist/bin/nd-gen-skills.js install --variant frontend-react` in a temporary repo;
- execute `node dist/bin/nd-gen-skills.js validate --ci` in the same repo;
- execute `node dist/bin/nd-gen-skills.js install --tool claude --variant frontend-react` in another temp repo;
- verify `.claude/skills/nexi-frontend-react-runtime/SKILL.md` exists.

- [ ] **Step 2: Run failing e2e test**

Run:

```bash
npm test -- tests/integration/cli-e2e.test.ts
```

Expected: fails until CLI routing, build output, and registry path resolution are complete.

- [ ] **Step 3: Fix package build output**

Set the package build output to one explicit layout:

- `tsconfig.json` uses `"rootDir": "src"` and `"outDir": "dist"`;
- `scripts/build-registry.ts` stays outside `tsc` and runs through `tsx`;
- `npm run build` emits executable JS under `dist/bin/nd-gen-skills.js`;
- the `bin.nd-gen-skills` path is `"./dist/bin/nd-gen-skills.js"`;
- `files` includes built JS and `dist-registry`;
- no generated test files are included in npm output.

- [ ] **Step 4: Expand README**

Document:

- primary install command;
- `--tool claude`;
- `sync`;
- utility add/remove;
- `list` and `list --available`;
- `validate --ci`;
- file ownership safety;
- generated registry workflow.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm test
npm run build
npm run build:registry
npm pack --dry-run
```

Expected:

- all tests pass;
- build succeeds;
- `dist-registry/index.yaml` exists;
- `npm pack --dry-run` includes `dist/`, `dist-registry/`, and `README.md`.

- [ ] **Step 6: Commit**

Run:

```bash
git add tests/integration/cli-e2e.test.ts README.md package.json package-lock.json
git commit -m "test: verify packaged cli workflows"
```

---

## Final Review Checklist

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run build:registry` generates all expected artifacts.
- [ ] `npm pack --dry-run` includes build output and bundled registry.
- [ ] Basic Codex install creates `.agents/skills`, `.agents/nd-gen-skills.lock.yaml`, and root `AGENTS.md`.
- [ ] Claude install creates `.claude/skills` and `.claude/nd-gen-skills.lock.yaml`.
- [ ] Managed file modification fails in `validate --ci`.
- [ ] Unmanaged skill folder collision fails before overwrite.
- [ ] `nexi-jira-summary` tells the agent to stop and ask for Jira MCP setup if Jira MCP is unavailable.
- [ ] The staged `nd-gen-skills-requirements.md` remains under user control unless explicitly included by the user.
