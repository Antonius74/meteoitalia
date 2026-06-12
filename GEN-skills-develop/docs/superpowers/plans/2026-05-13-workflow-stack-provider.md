# Workflow Stack Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the old `feat/ark` workflow-stack as a selectable first-class provider in the current package architecture.

**Architecture:** Keep `superpowers` as the default provider and add `provider/workflow-stack` as an explicit install choice through `install --provider workflow-stack`. Provider and variant manifests declare required utilities, the installer resolves them into the normal utility lockfile state, and variant runtime glue becomes provider-neutral while preserving platform-specific guidance.

**Tech Stack:** TypeScript, Zod, YAML manifests, Vitest, Node 20, existing archive-based registry builder, old `feat/ark` git branch as source material.

---

## Files

- Modify: `src/schemas/manifests.ts`
- Modify: `src/cli/args.ts`
- Modify: `src/commands/install.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/commands/add-skill.ts`
- Modify: `src/commands/remove-skill.ts`
- Modify: `src/commands/install-support.ts`
- Modify: `src/commands/utility-dependencies.ts`
- Create: `src/commands/runtime-utility-requirements.ts`
- Modify: `src/installer/desired-state.ts`
- Modify: `src/installer/validate.ts`
- Modify: `scripts/build-registry.ts`
- Modify: `packages/variant/frontend-react/manifest.yaml`
- Modify: `packages/variant/backend-java/manifest.yaml`
- Modify: `packages/variant/mobile-ios/manifest.yaml`
- Modify: `packages/variant/mobile-android/manifest.yaml`
- Modify: `packages/variant/frontend-react/runtime/SKILL.md`
- Modify: `packages/variant/backend-java/runtime/SKILL.md`
- Modify: `packages/variant/mobile-ios/runtime/SKILL.md`
- Modify: `packages/variant/mobile-android/runtime/SKILL.md`
- Create: `packages/provider/workflow-stack/manifest.yaml`
- Create: `packages/provider/workflow-stack/skills/**`
- Create: `packages/utility/grill-me/manifest.yaml`
- Create: `packages/utility/grill-me/skill/SKILL.md`
- Create: `packages/utility/tdd/manifest.yaml`
- Create: `packages/utility/tdd/skill/**`
- Create: `packages/utility/figma-use/manifest.yaml`
- Create: `packages/utility/figma-use/skill/**`
- Modify: `tests/unit/manifest-schemas.test.ts`
- Modify: `tests/unit/cli-args.test.ts`
- Modify: `tests/unit/utility-dependencies.test.ts`
- Modify: `tests/unit/install-planner.test.ts`
- Modify: `tests/unit/package-content.test.ts`
- Modify: `tests/unit/build-registry.test.ts`
- Modify: `tests/integration/install-sync.test.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`
- Modify: `tests/integration/cli-e2e.test.ts`
- Regenerate: `dist-registry/index.yaml`
- Regenerate: `dist-registry/packages/*.tgz`

## Task 1: Manifest Schema And CLI Provider Argument

**Files:**
- Modify: `tests/unit/manifest-schemas.test.ts`
- Modify: `tests/unit/cli-args.test.ts`
- Modify: `src/schemas/manifests.ts`
- Modify: `src/cli/args.ts`

- [ ] **Step 1: Write failing schema tests for provider and variant utility requirements**

Add these tests after the current provider and variant parser tests in `tests/unit/manifest-schemas.test.ts`:

```ts
  it("parses provider required utilities", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "workflow-stack",
      version: "0.1.0",
      requiresUtilities: ["grill-me", "tdd"],
      capabilities: {
        planning: { skill: "workflow-architecture-kit" },
      },
      skills: [{ name: "workflow-architecture-kit", role: "workflow", source: "skills/workflow-architecture-kit" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual(["grill-me", "tdd"]);
  });

  it("defaults provider required utilities to an empty array", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "superpowers",
      version: "0.1.0",
      capabilities: {
        planning: { skill: "writing-plans" },
      },
      skills: [{ name: "writing-plans", role: "workflow", source: "skills/writing-plans" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual([]);
  });

  it("parses variant required utilities", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "frontend-react",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      requiresUtilities: ["figma-use"],
      runtime: {
        skillName: "nexi-frontend-react-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts", "figma-use"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.requiresUtilities).toEqual(["figma-use"]);
  });

  it("defaults variant required utilities to an empty array", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "backend-java",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      runtime: {
        skillName: "nexi-backend-java-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.requiresUtilities).toEqual([]);
  });
```

- [ ] **Step 2: Write failing CLI parser test for `--provider`**

Update the first install parser expectation in `tests/unit/cli-args.test.ts` so the expected object includes `provider: undefined`.

Then add this test:

```ts
  it("captures install provider when provided", () => {
    expect(parseArgs(["install", "--variant", "frontend-react", "--provider", "workflow-stack"], { env: {} })).toEqual({
      command: "install",
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      replaceVariant: false,
      force: false,
      ci: false,
      registry: undefined,
    });
  });
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/manifest-schemas.test.ts tests/unit/cli-args.test.ts
```

Expected: `requiresUtilities` assertions fail for provider/variant manifests, and the CLI provider expectation fails.

- [ ] **Step 4: Implement manifest schema support**

In `src/schemas/manifests.ts`, replace the provider and variant schema declarations with:

```ts
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
```

- [ ] **Step 5: Implement CLI provider parsing**

In `src/cli/args.ts`, add `provider?: string;` to the install variant of `ParsedArgs`, then add:

```ts
  const provider = requiredValueAfter(args, "--provider");
```

inside `parseArgs` near the existing `registry` parsing.

In the install return object, add:

```ts
      provider,
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/manifest-schemas.test.ts tests/unit/cli-args.test.ts
```

Expected: both test files pass.

- [ ] **Step 7: Commit schema and CLI parsing**

Run:

```bash
git add src/schemas/manifests.ts src/cli/args.ts tests/unit/manifest-schemas.test.ts tests/unit/cli-args.test.ts
git commit -m "feat: parse provider and variant utility requirements"
```

## Task 2: Utility Dependency Roots

**Files:**
- Modify: `tests/unit/utility-dependencies.test.ts`
- Modify: `src/commands/utility-dependencies.ts`

- [ ] **Step 1: Write failing tests for required utility roots**

Add this test to `tests/unit/utility-dependencies.test.ts`:

```ts
  it("resolves provider and variant required utilities as non-requested roots", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [
        { name: "grill-me" },
        { name: "tdd" },
        { name: "figma-use" },
      ],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      utilities: [
        { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
      ],
    });

    expect(
      closure.utilities.map((utility) => ({
        name: utility.package.manifest.name,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    ).toEqual([
      { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
    ]);
  });

  it("merges requested and required utility roots for the same package", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [{ name: "tdd" }],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      utilities: [
        { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", requested: true, requiredBy: [] },
      ],
    });

    expect(closure.utilities).toHaveLength(1);
    expect(closure.utilities[0].requested).toBe(true);
    expect(closure.utilities[0].requiredBy).toEqual(["provider/workflow-stack"]);
  });
```

If the local helper currently requires a different input shape, extend it with the optional `utilities` input rather than replacing existing `requestedUtilities` callers.

- [ ] **Step 2: Run utility dependency tests and verify RED**

Run:

```bash
npm test -- tests/unit/utility-dependencies.test.ts
```

Expected: TypeScript compilation fails because `utilities` is not accepted by `resolveUtilityDependencyClosure`.

- [ ] **Step 3: Implement root utility input support**

In `src/commands/utility-dependencies.ts`, add:

```ts
export interface UtilityRootRequest {
  name: string;
  requested: boolean;
  requiredBy?: string[];
}
```

Change the function input to:

```ts
export async function resolveUtilityDependencyClosure(input: {
  registry?: string;
  requestedUtilities?: string[];
  utilities?: UtilityRootRequest[];
}): Promise<UtilityDependencyClosure> {
  const utilities = new Map<string, ResolvedUtility>();
  const contractNames = new Set<string>();
  const visiting: string[] = [];
  const roots: UtilityRootRequest[] = [
    ...(input.requestedUtilities ?? []).map((utilityName) => ({
      name: utilityName,
      requested: true,
      requiredBy: [],
    })),
    ...(input.utilities ?? []),
  ];

  for (const utility of roots) {
    await visitUtility({
      registry: input.registry,
      utilityName: utility.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy ?? [],
      utilities,
      contractNames,
      visiting,
    });
  }

  const contracts = await Promise.all(
    [...contractNames]
      .sort()
      .map((contractName) => loadContractPackage({ registry: input.registry, name: contractName })),
  );

  return {
    utilities: [...utilities.values()],
    contracts,
  };
}
```

Update `visitUtility` so `requiredBy` is an array:

```ts
async function visitUtility(input: {
  registry?: string;
  utilityName: string;
  requested: boolean;
  requiredBy: string[];
  utilities: Map<string, ResolvedUtility>;
  contractNames: Set<string>;
  visiting: string[];
}): Promise<void> {
```

Replace the existing merge block with:

```ts
  const existing = input.utilities.get(input.utilityName);
  if (existing) {
    existing.requested = existing.requested || input.requested;
    existing.requiredBy = [...new Set([...existing.requiredBy, ...input.requiredBy])].sort();
    return;
  }
```

Replace the initial resolved object with:

```ts
    const resolved: ResolvedUtility = {
      package: utilityPackage,
      requested: input.requested,
      requiredBy: [...new Set(input.requiredBy)].sort(),
    };
```

Update recursive dependency calls to pass utility-origin requirements:

```ts
      await visitUtility({
        registry: input.registry,
        utilityName: dependencyName,
        requested: false,
        requiredBy: [`utility/${utilityPackage.manifest.name}`],
        utilities: input.utilities,
        contractNames: input.contractNames,
        visiting: input.visiting,
      });
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/utility-dependencies.test.ts
```

Expected: utility dependency tests pass.

- [ ] **Step 5: Commit utility root resolution**

Run:

```bash
git add src/commands/utility-dependencies.ts tests/unit/utility-dependencies.test.ts
git commit -m "feat: resolve required utility roots"
```

## Task 3: Provider And Variant Required Utility Planning

**Files:**
- Create: `src/commands/runtime-utility-requirements.ts`
- Modify: `tests/unit/install-planner.test.ts`
- Modify: `src/installer/desired-state.ts`

- [ ] **Step 1: Write failing tests for provider and variant utility root calculation**

Add this import in `tests/unit/install-planner.test.ts`:

```ts
import { runtimeUtilityRequests } from "../../src/commands/runtime-utility-requirements.js";
```

Add this test in the `describe("install planner", () => { ... })` block:

```ts
  it("derives provider, variant, and requested utility roots for runtime installs", () => {
    const requests = runtimeUtilityRequests({
      provider: {
        ...provider,
        name: "workflow-stack",
        requiresUtilities: ["grill-me", "tdd"],
      },
      variant: {
        ...variant,
        requiresUtilities: ["figma-use"],
      },
      existingUtilities: [
        { name: "nexi-jira-summary", version: "0.1.0", requested: true, requiredBy: [] },
      ],
    });

    expect(requests).toEqual([
      { name: "nexi-jira-summary", requested: true, requiredBy: [] },
      { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
    ]);
  });
```

Update the local `provider` and `variant` constants in the same test file to include `requiresUtilities: []` so they match the new inferred types.

- [ ] **Step 2: Run focused planner tests and verify RED**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts
```

Expected: import fails because `runtime-utility-requirements.ts` does not exist.

- [ ] **Step 3: Implement runtime utility request helper**

Create `src/commands/runtime-utility-requirements.ts`:

```ts
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
```

- [ ] **Step 4: Run focused planner tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts
```

Expected: planner tests pass.

- [ ] **Step 5: Commit runtime utility request helper**

Run:

```bash
git add src/commands/runtime-utility-requirements.ts tests/unit/install-planner.test.ts
git commit -m "feat: derive runtime utility requirements"
```

## Task 4: Install And Sync Provider Selection

**Files:**
- Modify: `src/commands/install.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/commands/install-support.ts`
- Modify: `tests/integration/install-sync.test.ts`

- [ ] **Step 1: Write failing integration tests for selected providers and required utilities**

In `tests/integration/install-sync.test.ts`, add assertions to the existing frontend install test that default install now includes variant-required `figma-use` after the package is added in Task 7:

```ts
    expect(lockfile.provider).toEqual({ name: "superpowers", version: "0.1.0" });
    expect(lockfile.utilities).toContainEqual({
      name: "figma-use",
      version: "0.1.0",
      requested: false,
      requiredBy: ["variant/frontend-react"],
    });
```

Add these tests after the default install test:

```ts
  it("installs workflow-stack provider with provider and variant required utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider).toEqual({ name: "workflow-stack", version: "0.1.0" });
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      ]),
    );
    await expect(readText(".agents/skills/workflow-orchestration-kit/SKILL.md")).resolves.toContain(
      "Workflow Coordinator",
    );
    await expect(readText(".agents/skills/grill-me/SKILL.md")).resolves.toContain("Interview me relentlessly");
    await expect(readText(".agents/skills/tdd/SKILL.md")).resolves.toContain("Test-Driven Development");
    await expect(readText(".agents/skills/figma-use/SKILL.md")).resolves.toContain("use_figma");
  });

  it("does not install figma-use for backend workflow-stack installs", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "backend-java",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider?.name).toBe("workflow-stack");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
      ]),
    );
    expect(lockfile.utilities.some((utility) => utility.name === "figma-use")).toBe(false);
  });

  it("sync preserves the selected workflow-stack provider and required utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    await syncCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider?.name).toBe("workflow-stack");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      ]),
    );
  });
```

- [ ] **Step 2: Run integration tests and verify RED**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts
```

Expected: workflow-stack package is missing, `provider` option is not accepted by `InstallCommandOptions`, and required utilities are not resolved.

- [ ] **Step 3: Expose package loaders for provider and variant**

In `src/commands/install-support.ts`, add:

```ts
export async function loadProviderPackage(input: {
  registry?: string;
  name?: string;
}): Promise<LoadedPackage<ProviderManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<ProviderManifest>(registry, "provider", input.name ?? registry.index.defaults.provider);
}

export async function loadVariantPackage(input: {
  registry?: string;
  name: string;
}): Promise<LoadedPackage<VariantManifest>> {
  const registry = await loadRegistry(input.registry);
  return loadPackageOfKind<VariantManifest>(registry, "variant", input.name);
}
```

Add optional preloaded values to `loadRuntimePackageSet` input:

```ts
  provider?: LoadedPackage<ProviderManifest>;
  variant?: LoadedPackage<VariantManifest>;
```

Then use:

```ts
  const provider =
    input.provider ??
    (await loadPackageOfKind<ProviderManifest>(registry, "provider", input.providerName ?? registry.index.defaults.provider));
  const variant = input.variant ?? (await loadPackageOfKind<VariantManifest>(registry, "variant", input.variantName));
```

- [ ] **Step 4: Update install command to select provider and resolve utility roots**

In `src/commands/install.ts`, update the interface:

```ts
  provider?: string;
```

Add imports:

```ts
import { runtimeUtilityRequests } from "./runtime-utility-requirements.js";
import { resolveUtilityDependencyClosure } from "./utility-dependencies.js";
```

Replace the package-set loading block with:

```ts
  const basePackageSet = await loadRuntimePackageSet({
    registry: options.registry,
    providerName: options.provider,
    variantName: options.variant,
    utilities: [],
  });
  const utilityClosure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: runtimeUtilityRequests({
      provider: basePackageSet.provider.manifest,
      variant: basePackageSet.variant.manifest,
      existingUtilities: existingLockfile?.utilities,
    }),
  });
  const packageSet = {
    ...basePackageSet,
    utilities: utilityClosure.utilities.map((utility) => utility.package),
    utilityStates: utilityClosure.utilities.map((utility) => ({
      name: utility.package.manifest.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy,
    })),
  };
```

- [ ] **Step 5: Update sync command to re-resolve provider and variant required utilities**

In `src/commands/sync.ts`, import `runtimeUtilityRequests`.

In the runtime branch, replace the `utilities` value with roots derived after the base package set is loaded:

```ts
  const basePackageSet = await loadRuntimePackageSet({
    registry: options.registry,
    providerName: existingLockfile.provider?.name,
    contractNames,
    variantName,
    utilities: [],
  });
  const runtimeUtilityClosure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: runtimeUtilityRequests({
      provider: basePackageSet.provider.manifest,
      variant: basePackageSet.variant.manifest,
      existingUtilities: utilityClosure.utilities.map((utility) => ({
        name: utility.package.manifest.name,
        version: utility.package.manifest.version,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    }),
  });
  const packageSet = {
    ...basePackageSet,
    utilities: runtimeUtilityClosure.utilities.map((utility) => utility.package),
    utilityStates: runtimeUtilityClosure.utilities.map((utility) => ({
      name: utility.package.manifest.name,
      requested: utility.requested,
      requiredBy: utility.requiredBy,
    })),
  };
```

Keep the existing utility-only branch unchanged except for compatibility with the new optional `requestedUtilities` argument.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts tests/unit/install-planner.test.ts
```

Expected: TypeScript compiles for provider selection. Tests that depend on missing packages still fail until package sources are added in Task 7.

- [ ] **Step 7: Commit provider selection plumbing**

Run after TypeScript errors unrelated to missing package content are resolved:

```bash
git add src/commands/install.ts src/commands/sync.ts src/commands/install-support.ts tests/integration/install-sync.test.ts
git commit -m "feat: select runtime provider during install"
```

## Task 5: Add And Remove Required Utilities Safely

**Files:**
- Modify: `src/commands/add-skill.ts`
- Modify: `src/commands/remove-skill.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Write failing tests for requested plus required utility state**

Add an integration test after the existing add/remove utility tests:

```ts
  it("add-skill marks a required utility as requested without dropping requiredBy", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toContainEqual({
      name: "tdd",
      version: "0.1.0",
      requested: true,
      requiredBy: ["provider/workflow-stack"],
    });
  });

  it("remove-skill keeps a utility installed when provider or variant still requires it", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    await removeSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toContainEqual({
      name: "tdd",
      version: "0.1.0",
      requested: false,
      requiredBy: ["provider/workflow-stack"],
    });
    await expect(readText(path.join(".agents", "skills", "tdd", "SKILL.md"))).resolves.toContain(
      "Test-Driven Development",
    );
  });
```

- [ ] **Step 2: Run focused test and verify RED**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: required utilities are dropped or removed because add/remove only reasons about requested utilities.

- [ ] **Step 3: Add a helper inside `add-skill.ts`**

Add this function near the bottom of `src/commands/add-skill.ts`:

```ts
function existingUtilityRoots(utilities: NonNullable<Awaited<ReturnType<typeof readExistingLockfile>>>["utilities"]) {
  return utilities.map((utility) => ({
    name: utility.name,
    requested: utility.requested,
    requiredBy: utility.requiredBy,
  }));
}
```

If TypeScript rejects the inferred type, replace the parameter type with `Lockfile["utilities"]` and import `type { Lockfile } from "../schemas/lockfile.js";`.

Change the closure call for existing lockfiles to:

```ts
  const closure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: [
      ...existingUtilityRoots(existingLockfile?.utilities ?? []),
      { name: options.skill, requested: true, requiredBy: [] },
    ],
  });
```

For utility-only installs without an existing lockfile, keep the requested root:

```ts
  const closure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: [{ name: options.skill, requested: true, requiredBy: [] }],
  });
```

- [ ] **Step 4: Update `remove-skill.ts` to clear requested state without removing required roots**

Replace `remainingRequestedUtilities` and the closure call with:

```ts
  const remainingUtilityRoots = existingLockfile.utilities
    .map((utility) => {
      if (utility.name !== options.skill) {
        return {
          name: utility.name,
          requested: utility.requested,
          requiredBy: utility.requiredBy,
        };
      }

      if (utility.requiredBy.length > 0) {
        return {
          name: utility.name,
          requested: false,
          requiredBy: utility.requiredBy,
        };
      }

      return undefined;
    })
    .filter((utility): utility is { name: string; requested: boolean; requiredBy: string[] } => utility !== undefined);

  const closure = await resolveUtilityDependencyClosure({
    registry: options.registry,
    utilities: remainingUtilityRoots,
  });
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: utility add/remove tests pass once package sources are available.

- [ ] **Step 6: Commit utility state preservation**

Run:

```bash
git add src/commands/add-skill.ts src/commands/remove-skill.ts tests/integration/utility-list-validate.test.ts
git commit -m "feat: preserve required utility installs"
```

## Task 6: Selected-Provider Validation

**Files:**
- Modify: `src/installer/desired-state.ts`
- Modify: `src/installer/validate.ts`
- Modify: `tests/unit/install-planner.test.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Write failing desired-state test for capability-resolved references**

In `tests/unit/install-planner.test.ts`, add:

```ts
  it("allows runtime references to omit concrete provider skill names when capabilities resolve through provider", () => {
    const workflowStackProvider: ProviderManifest = {
      ...provider,
      name: "workflow-stack",
      requiresUtilities: ["grill-me", "tdd"],
      capabilities: {
        planning: { skill: "workflow-architecture-kit" },
        tdd: { skill: "workflow-development-kit" },
      },
      skills: [
        { name: "workflow-architecture-kit", role: "workflow", source: "skills/workflow-architecture-kit" },
        { name: "workflow-development-kit", role: "workflow", source: "skills/workflow-development-kit" },
      ],
    };

    expect(() =>
      buildDesiredState({
        tool: "codex",
        generatedBy,
        provider: workflowStackProvider,
        contracts: [contract],
        variant: {
          ...variant,
          requiresProviderCapabilities: ["planning", "tdd"],
          runtime: { ...variant.runtime, references: ["nexi-workflow-contracts"] },
        },
        utilities: [],
        files: new Map(),
      }),
    ).not.toThrow();
  });
```

- [ ] **Step 2: Write failing validation tests for missing required utilities**

In `tests/integration/utility-list-validate.test.ts`, add a test that installs workflow-stack, edits the lockfile to remove `tdd`, and expects validation to fail:

```ts
  it("validate reports missing provider and variant required utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });
    const lockfilePath = path.join(root, ".agents", "nd-gen-skills.lock.yaml");
    const lockfile = YAML.parse(await readFile(lockfilePath, "utf8"));
    lockfile.utilities = lockfile.utilities.filter((utility: { name: string }) => utility.name !== "tdd" && utility.name !== "figma-use");
    await writeFile(lockfilePath, YAML.stringify(lockfile), "utf8");

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      "Provider workflow-stack requires utility tdd, but it is not installed.",
    );
  });
```

Use existing imports in the test file; add `readFile`, `writeFile`, and `YAML` only if not already imported.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts tests/integration/utility-list-validate.test.ts
```

Expected: validation does not yet check provider and variant required utilities.

- [ ] **Step 4: Keep desired-state reference validation static-only**

In `src/installer/desired-state.ts`, leave `validateProviderCapabilities` as the provider capability guard. Update `validateRuntimeReferences` only if it still assumes provider workflow skills must appear in `runtime.references`. It should check only the explicit references present in the variant manifest against the desired managed skill list.

The function body remains valid with provider-neutral references:

```ts
function validateRuntimeReferences(variant: VariantManifest, managedSkills: ManagedSkill[]): void {
  const managedSkillNames = new Set(managedSkills.map((skill) => skill.name));

  for (const reference of variant.runtime.references) {
    if (!managedSkillNames.has(reference)) {
      throw new Error(
        `Runtime ${variant.runtime.skillName} references ${reference}, but it is not in desired managed skills.`,
      );
    }
  }
}
```

- [ ] **Step 5: Add required utility validation**

In `src/installer/validate.ts`, after loading `packageSet`, add checks:

```ts
  for (const utilityName of packageSet.provider.manifest.requiresUtilities) {
    if (!installedUtilities.has(utilityName)) {
      errors.push(`Provider ${packageSet.provider.manifest.name} requires utility ${utilityName}, but it is not installed.`);
    }
  }

  for (const utilityName of packageSet.variant.manifest.requiresUtilities) {
    if (!installedUtilities.has(utilityName)) {
      errors.push(`Variant ${packageSet.variant.manifest.name} requires utility ${utilityName}, but it is not installed.`);
    }
  }
```

Place those checks before the final `buildRuntimeDesiredState` call.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/install-planner.test.ts tests/integration/utility-list-validate.test.ts
```

Expected: tests pass once package sources exist.

- [ ] **Step 7: Commit selected-provider validation**

Run:

```bash
git add src/installer/desired-state.ts src/installer/validate.ts tests/unit/install-planner.test.ts tests/integration/utility-list-validate.test.ts
git commit -m "feat: validate selected provider utility requirements"
```

## Task 7: Import Workflow-Stack Provider And Utility Packages

**Files:**
- Create: `packages/provider/workflow-stack/manifest.yaml`
- Create: `packages/provider/workflow-stack/skills/**`
- Create: `packages/utility/grill-me/manifest.yaml`
- Create: `packages/utility/grill-me/skill/SKILL.md`
- Create: `packages/utility/tdd/manifest.yaml`
- Create: `packages/utility/tdd/skill/**`
- Create: `packages/utility/figma-use/manifest.yaml`
- Create: `packages/utility/figma-use/skill/**`

- [ ] **Step 1: Export old branch source to a temporary directory**

Run:

```bash
rm -rf /tmp/gen-skills-feat-ark
mkdir -p /tmp/gen-skills-feat-ark
git archive feat/ark | tar -x -C /tmp/gen-skills-feat-ark
```

Expected: `/tmp/gen-skills-feat-ark/skills/workflow-planning-kit/src/body.md` exists.

- [ ] **Step 2: Create utility package manifests**

Create `packages/utility/grill-me/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: grill-me
version: 0.1.0
description: Interview the user relentlessly about plans or designs until shared understanding is reached.
requiresContracts: []
requiresUtilities: []
skill:
  name: grill-me
  source: skill
```

Create `packages/utility/tdd/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: tdd
version: 0.1.0
description: Apply test-driven development with behavior-focused red-green-refactor cycles.
requiresContracts: []
requiresUtilities: []
skill:
  name: tdd
  source: skill
```

Create `packages/utility/figma-use/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: figma-use
version: 0.1.0
description: Use Figma Plugin API safely for read or write operations when runtime guidance allows it.
requiresContracts: []
requiresUtilities: []
skill:
  name: figma-use
  source: skill
```

- [ ] **Step 3: Copy utility content from the old branch**

Run:

```bash
mkdir -p packages/utility/grill-me/skill
cp /tmp/gen-skills-feat-ark/skills/grill-me/SKILL.md packages/utility/grill-me/skill/SKILL.md

mkdir -p packages/utility/tdd/skill
cp -R /tmp/gen-skills-feat-ark/skills/tdd/. packages/utility/tdd/skill/
rm -f packages/utility/tdd/skill/package.toml

mkdir -p packages/utility/figma-use/skill
cp -R /tmp/gen-skills-feat-ark/skills/figma-use/. packages/utility/figma-use/skill/
rm -f packages/utility/figma-use/skill/package.toml
```

Expected: each utility package has `skill/SKILL.md`.

- [ ] **Step 4: Create workflow-stack provider manifest**

Create `packages/provider/workflow-stack/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: provider
name: workflow-stack
version: 0.1.0

requiresUtilities:
  - grill-me
  - tdd

capabilities:
  requirements-design:
    skill: workflow-planning-kit
  planning:
    skill: workflow-architecture-kit
  execution:
    skill: workflow-development-kit
  tdd:
    skill: workflow-development-kit
  debugging:
    skill: workflow-development-kit
  verification:
    skill: workflow-test-design-kit
  code-review:
    skill: workflow-orchestration-kit
  finishing:
    skill: workflow-orchestration-kit
  orchestration:
    skill: workflow-orchestration-kit
  functional-quality:
    skill: workflow-us-quality-assessment-kit

skills:
  - name: workflow-core-kit
    role: support
    source: skills/workflow-core-kit
  - name: workflow-planning-kit
    role: workflow
    source: skills/workflow-planning-kit
  - name: workflow-architecture-kit
    role: workflow
    source: skills/workflow-architecture-kit
  - name: workflow-development-kit
    role: workflow
    source: skills/workflow-development-kit
  - name: workflow-test-design-kit
    role: workflow
    source: skills/workflow-test-design-kit
  - name: workflow-orchestration-kit
    role: workflow
    source: skills/workflow-orchestration-kit
  - name: workflow-us-quality-assessment-kit
    role: workflow
    source: skills/workflow-us-quality-assessment-kit
```

- [ ] **Step 5: Copy workflow-core support content**

Run:

```bash
mkdir -p packages/provider/workflow-stack/skills/workflow-core-kit
cp -R /tmp/gen-skills-feat-ark/references/workflow-core/. packages/provider/workflow-stack/skills/workflow-core-kit/
cp /tmp/gen-skills-feat-ark/skills/workflow-core-kit/src/body.md packages/provider/workflow-stack/skills/workflow-core-kit/SKILL.md
```

Then edit `packages/provider/workflow-stack/skills/workflow-core-kit/SKILL.md`:

- Replace every `{{shared_root}}` with `.`
- Ensure the frontmatter is:

```markdown
---
name: workflow-core-kit
description: Shared workflow-stack templates, schemas, references, and role contracts.
---
```

- [ ] **Step 6: Copy workflow skill directories**

Run:

```bash
for skill in workflow-planning-kit workflow-architecture-kit workflow-development-kit workflow-test-design-kit workflow-orchestration-kit workflow-us-quality-assessment-kit; do
  mkdir -p "packages/provider/workflow-stack/skills/$skill"
  cp -R "/tmp/gen-skills-feat-ark/skills/$skill/." "packages/provider/workflow-stack/skills/$skill/"
  rm -f "packages/provider/workflow-stack/skills/$skill/package.toml"
  if [ -d "packages/provider/workflow-stack/skills/$skill/src" ]; then
    mv "packages/provider/workflow-stack/skills/$skill/src/body.md" "packages/provider/workflow-stack/skills/$skill/SKILL.md"
    rmdir "packages/provider/workflow-stack/skills/$skill/src"
  fi
done
```

Expected: each workflow skill directory has a root `SKILL.md`, and no copied provider skill directory contains `package.toml`.

- [ ] **Step 7: Adapt workflow skill placeholder paths**

For every `packages/provider/workflow-stack/skills/*/SKILL.md` file:

- Replace every `{{shared_root}}` with `../workflow-core-kit`.
- Replace every `{{package_root}}` with `.`.
- Replace wording that says `Use the installed figma-use skill` with `Use the runtime-provided figma-use utility when it is installed; otherwise record Figma access as unavailable and continue with explicit source gaps.`

Run:

```bash
rg -n "\\{\\{shared_root\\}\\}|\\{\\{package_root\\}\\}|package.toml" packages/provider/workflow-stack packages/utility/grill-me packages/utility/tdd packages/utility/figma-use
```

Expected: no output.

- [ ] **Step 8: Adapt init script template resolution**

In these files:

- `packages/provider/workflow-stack/skills/workflow-planning-kit/scripts/init_planning.py`
- `packages/provider/workflow-stack/skills/workflow-architecture-kit/scripts/init_architecture.py`
- `packages/provider/workflow-stack/skills/workflow-test-design-kit/scripts/init_test_design.py`
- `packages/provider/workflow-stack/skills/workflow-orchestration-kit/scripts/init_orchestration.py`

Replace old candidate resolution that looks for `references/workflow-core` or `.skills-npm` with sibling resolution:

```py
def workflow_core_root() -> Path:
    candidate = SKILL_DIR.parent / "workflow-core-kit"
    if candidate.exists():
        return candidate
    raise FileNotFoundError(
        "Unable to locate workflow-core-kit next to this workflow-stack skill. "
        f"Expected: {candidate}"
    )
```

For scripts that currently use `workflow_core_roots()`, replace it with:

```py
def workflow_core_roots() -> list[Path]:
    return [workflow_core_root()]
```

Then update template candidate construction to use `workflow_core_root() / relative_path` or `workflow_core_roots()`.

- [ ] **Step 9: Add frontmatter to workflow skill docs**

Each workflow provider skill `SKILL.md` must start with exact frontmatter:

```markdown
---
name: workflow-planning-kit
description: Generate requirements artifacts for delivery workflows from Jira, requirement text, and supporting evidence.
---
```

Use this description mapping:

```text
workflow-architecture-kit: Produce implementation plans and API handoff artifacts from approved requirements.
workflow-development-kit: Implement workflow-stack plans through test-driven development and fix loops.
workflow-test-design-kit: Produce requirement-traceable unit, end-to-end, and manual test backlogs.
workflow-orchestration-kit: Coordinate multi-phase workflow-stack delivery with gates, state, progress, and fix loops.
workflow-us-quality-assessment-kit: Evaluate Jira, requirement, and Figma evidence for functional plan-readiness.
```

- [ ] **Step 10: Commit imported packages**

Run:

```bash
git add packages/provider/workflow-stack packages/utility/grill-me packages/utility/tdd packages/utility/figma-use
git commit -m "feat: add workflow-stack provider package"
```

## Task 8: Provider-Neutral Variant Runtime Glue

**Files:**
- Modify: `packages/variant/frontend-react/manifest.yaml`
- Modify: `packages/variant/backend-java/manifest.yaml`
- Modify: `packages/variant/mobile-ios/manifest.yaml`
- Modify: `packages/variant/mobile-android/manifest.yaml`
- Modify: `packages/variant/frontend-react/runtime/SKILL.md`
- Modify: `packages/variant/backend-java/runtime/SKILL.md`
- Modify: `packages/variant/mobile-ios/runtime/SKILL.md`
- Modify: `packages/variant/mobile-android/runtime/SKILL.md`
- Modify: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Update expected runtime references tests**

In `tests/unit/package-content.test.ts`, replace the single `expectedRuntimeReferences` array with:

```ts
const expectedRuntimeReferencesByVariant = new Map([
  ["frontend-react", ["nexi-workflow-contracts", "figma-use"]],
  ["backend-java", ["nexi-workflow-contracts"]],
  ["mobile-ios", ["nexi-workflow-contracts", "figma-use"]],
  ["mobile-android", ["nexi-workflow-contracts", "figma-use"]],
]);
```

In the variant loop, replace:

```ts
      expect(manifest.runtime.references).toEqual(expectedRuntimeReferences);
```

with:

```ts
      expect(manifest.runtime.references).toEqual(expectedRuntimeReferencesByVariant.get(variant));
```

Add assertions for required utilities:

```ts
      expect(manifest.requiresUtilities).toEqual(
        variant === "backend-java" ? [] : ["figma-use"],
      );
```

- [ ] **Step 2: Run package-content tests and verify RED**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: variant manifests still contain Superpowers references and no `requiresUtilities`.

- [ ] **Step 3: Update variant manifests**

For frontend, iOS, and Android manifests:

```yaml
requiresUtilities:
  - figma-use
```

Use these runtime references:

```yaml
runtime:
  references:
    - nexi-workflow-contracts
    - figma-use
```

For backend:

```yaml
requiresUtilities: []
runtime:
  references:
    - nexi-workflow-contracts
```

- [ ] **Step 4: Update runtime skill provider workflow sections**

In each runtime `SKILL.md`, replace the Superpowers-only `## Required Skill Order` and `## Provider Workflow` sections with provider-neutral sections.

Use this section text for all four runtimes, adjusting the first sentence to keep the platform name already used in the file:

```markdown
## Provider Workflow

Use the provider recorded in `.agents/nd-gen-skills.lock.yaml` or `.claude/nd-gen-skills.lock.yaml`.

If the installed provider is `superpowers`, use the installed Superpowers skills for requirements design, planning, execution, TDD, debugging, verification, review, and finishing. Keep provider artifacts in their native locations and do not rewrite provider guidance.

If the installed provider is `workflow-stack`, use `workflow-orchestration-kit` for full multi-phase delivery coordination. For individual phases, use `workflow-planning-kit` for requirements, `workflow-architecture-kit` for implementation planning, `workflow-test-design-kit` for test backlog design, and `workflow-development-kit` for implementation and fix loops. Use `workflow-us-quality-assessment-kit` before planning when functional readiness is uncertain.

Provider workflow skills define their own gates and artifacts. This runtime adds platform-specific command discovery, testing, manual tester output, traceability, and residual-risk expectations.
```

For frontend, iOS, and Android only, add this section after provider workflow:

```markdown
## Runtime Utilities

`figma-use` is installed with this runtime for Figma inspection workflows. Use it only when Figma evidence is part of the task and keep Figma access read-only unless the user explicitly asks for Figma write operations.
```

Backend must not mention `figma-use`.

- [ ] **Step 5: Run package content tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: package content tests pass.

- [ ] **Step 6: Commit variant runtime glue**

Run:

```bash
git add packages/variant tests/unit/package-content.test.ts
git commit -m "feat: make variant runtimes provider neutral"
```

## Task 9: Registry Build And Package Content Coverage

**Files:**
- Modify: `scripts/build-registry.ts`
- Modify: `tests/unit/build-registry.test.ts`
- Modify: `tests/unit/package-content.test.ts`
- Modify: `tests/integration/cli-e2e.test.ts`
- Regenerate: `dist-registry/index.yaml`
- Regenerate: `dist-registry/packages/*.tgz`

- [ ] **Step 1: Update expected package lists**

In `tests/unit/package-content.test.ts`, add these roots to `packageRoots` and `expectedPackages`:

```ts
"packages/provider/workflow-stack",
"packages/utility/grill-me",
"packages/utility/tdd",
"packages/utility/figma-use",
```

Add provider expectations:

```ts
  it("declares the workflow-stack provider manifest contract", async () => {
    const manifest = await readManifest("packages/provider/workflow-stack");
    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual(["grill-me", "tdd"]);
    expect(manifest.skills.map((skill) => skill.name)).toEqual([
      "workflow-core-kit",
      "workflow-planning-kit",
      "workflow-architecture-kit",
      "workflow-development-kit",
      "workflow-test-design-kit",
      "workflow-orchestration-kit",
      "workflow-us-quality-assessment-kit",
    ]);
  });

  it("keeps workflow-stack provider free of unresolved legacy placeholders", async () => {
    const markdownFiles = await collectMarkdownFiles("packages/provider/workflow-stack/skills");
    const unresolved: string[] = [];

    for (const markdownFile of markdownFiles) {
      const content = await readFile(markdownFile, "utf8");
      if (content.includes("{{shared_root}}") || content.includes("{{package_root}}")) {
        unresolved.push(markdownFile);
      }
    }

    expect(unresolved).toEqual([]);
  });
```

- [ ] **Step 2: Update registry expected order**

In `scripts/build-registry.ts`, update `PACKAGE_ORDER` to include:

```ts
    "provider/workflow-stack",
    "utility/grill-me",
    "utility/tdd",
    "utility/figma-use",
```

Place `provider/workflow-stack` directly after `provider/superpowers`. Place the utility entries after existing utility entries unless tests require lexical order.

- [ ] **Step 3: Update `build-registry` tests**

In `tests/unit/build-registry.test.ts`, update `Object.keys(index.packages)` and `index` expected object with:

```ts
        "provider/workflow-stack": {
          latest: "0.1.0",
          artifact: "packages/provider-workflow-stack-0.1.0.tgz",
        },
        "utility/grill-me": {
          latest: "0.1.0",
          artifact: "packages/utility-grill-me-0.1.0.tgz",
        },
        "utility/tdd": {
          latest: "0.1.0",
          artifact: "packages/utility-tdd-0.1.0.tgz",
        },
        "utility/figma-use": {
          latest: "0.1.0",
          artifact: "packages/utility-figma-use-0.1.0.tgz",
        },
```

Add archive assertions:

```ts
    const workflowArchivePath = path.join(outputRoot, "packages/provider-workflow-stack-0.1.0.tgz");
    const workflowExtractedRoot = await extractPackageArchive(workflowArchivePath);
    await expect(
      access(path.join(workflowExtractedRoot, "skills/workflow-orchestration-kit/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(workflowExtractedRoot, "skills/workflow-core-kit/templates/skills/shared/workflow-state-template.yml")),
    ).resolves.toBeUndefined();
```

- [ ] **Step 4: Update packaged CLI test expectations**

In `tests/integration/cli-e2e.test.ts`, add expected packed files:

```ts
          "dist-registry/packages/provider-workflow-stack-0.1.0.tgz",
          "dist-registry/packages/utility-grill-me-0.1.0.tgz",
          "dist-registry/packages/utility-tdd-0.1.0.tgz",
          "dist-registry/packages/utility-figma-use-0.1.0.tgz",
```

Also add:

```ts
      await runNodeCli(["install", "--variant", "frontend-react", "--provider", "workflow-stack"], codexRepo);
      await runNodeCli(["validate", "--ci"], codexRepo);
```

Use a fresh temp repo for this workflow-stack smoke if the existing `codexRepo` already has a default provider install.

- [ ] **Step 5: Run focused registry and package tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts tests/unit/build-registry.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Rebuild generated registry**

Run:

```bash
npm run build:registry
```

Expected: `dist-registry/index.yaml` includes `provider/workflow-stack`, `utility/grill-me`, `utility/tdd`, and `utility/figma-use`.

- [ ] **Step 7: Commit registry/package coverage**

Run:

```bash
git add scripts/build-registry.ts tests/unit/package-content.test.ts tests/unit/build-registry.test.ts tests/integration/cli-e2e.test.ts dist-registry
git commit -m "build: include workflow-stack provider registry artifacts"
```

## Task 10: Full Verification

**Files:**
- No source files expected beyond previous tasks.

- [ ] **Step 1: Run full unit and integration test suite**

Run:

```bash
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 2: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: TypeScript build succeeds with no errors.

- [ ] **Step 3: Run registry build**

Run:

```bash
npm run build:registry
```

Expected: registry artifacts are regenerated deterministically.

- [ ] **Step 4: Smoke install workflow-stack in a temporary repo**

Run:

```bash
tmp_repo="$(mktemp -d)"
node dist/bin/nd-gen-skills.js install --variant frontend-react --provider workflow-stack --ci --registry dist-registry "$tmp_repo"
```

If the CLI does not support a positional root argument, run from the temp repo:

```bash
tmp_repo="$(mktemp -d)"
(cd "$tmp_repo" && node /Users/marcofasanella/Projects/GEN-skills/dist/bin/nd-gen-skills.js install --variant frontend-react --provider workflow-stack --ci --registry /Users/marcofasanella/Projects/GEN-skills/dist-registry)
```

Expected installed files:

```text
.agents/skills/workflow-orchestration-kit/SKILL.md
.agents/skills/workflow-planning-kit/SKILL.md
.agents/skills/workflow-architecture-kit/SKILL.md
.agents/skills/workflow-development-kit/SKILL.md
.agents/skills/workflow-test-design-kit/SKILL.md
.agents/skills/workflow-us-quality-assessment-kit/SKILL.md
.agents/skills/workflow-core-kit/SKILL.md
.agents/skills/grill-me/SKILL.md
.agents/skills/tdd/SKILL.md
.agents/skills/figma-use/SKILL.md
```

- [ ] **Step 5: Validate smoke repo**

Run from the smoke repo:

```bash
node /Users/marcofasanella/Projects/GEN-skills/dist/bin/nd-gen-skills.js validate --ci --registry /Users/marcofasanella/Projects/GEN-skills/dist-registry
```

Expected: `Validation passed.`

- [ ] **Step 6: Final commit if verification changed generated files**

Run:

```bash
git status --short
```

If `dist-registry` changed after verification, run:

```bash
git add dist-registry
git commit -m "build: refresh workflow-stack registry artifacts"
```

If there are no changes, do not create an empty commit.
