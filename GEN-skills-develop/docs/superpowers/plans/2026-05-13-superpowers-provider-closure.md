# Superpowers Provider Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `superpowers` provider bundle self-contained by importing the missing upstream workflow skills unchanged and guarding future provider syncs with tests.

**Architecture:** Treat `packages/provider/superpowers/skills/` as a vendored snapshot of selected upstream Superpowers skills. Add a maintainer sync script that copies a fixed whitelist from an upstream Superpowers `skills/` directory, then update only Nexi-owned manifests, runtime files, and tests. Runtime variants reference the full workflow closure so install/validate catches missing orchestration skills.

**Tech Stack:** TypeScript, Vitest, YAML manifests, `tsx` maintainer script, existing `nd-gen-skills` package registry builder.

---

## Files

- Create: `scripts/sync-superpowers-provider.ts`
- Create: `tests/unit/sync-superpowers-provider.test.ts`
- Modify: `package.json`
- Modify: `packages/provider/superpowers/manifest.yaml`
- Create by sync: `packages/provider/superpowers/skills/subagent-driven-development/**`
- Create by sync: `packages/provider/superpowers/skills/using-git-worktrees/SKILL.md`
- Modify: `packages/variant/frontend-react/manifest.yaml`
- Modify: `packages/variant/backend-java/manifest.yaml`
- Modify: `packages/variant/mobile-ios/manifest.yaml`
- Modify: `packages/variant/mobile-android/manifest.yaml`
- Modify: `packages/variant/frontend-react/runtime/SKILL.md`
- Modify: `packages/variant/backend-java/runtime/SKILL.md`
- Modify: `packages/variant/mobile-ios/runtime/SKILL.md`
- Modify: `packages/variant/mobile-android/runtime/SKILL.md`
- Modify: `tests/unit/package-content.test.ts`
- Modify: `tests/unit/build-registry.test.ts`

## Task 1: Add Provider Closure Regression Tests

**Files:**
- Modify: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Write failing provider and runtime closure tests**

Update the expected provider and runtime lists near the top of `tests/unit/package-content.test.ts`:

```ts
const providerSkillNames = [
  "brainstorming",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "verification-before-completion",
  "writing-plans",
];
```

```ts
const expectedRuntimeReferences = [
  "nexi-workflow-contracts",
  "brainstorming",
  "writing-plans",
  "using-git-worktrees",
  "subagent-driven-development",
  "executing-plans",
  "test-driven-development",
  "systematic-debugging",
  "verification-before-completion",
  "requesting-code-review",
  "receiving-code-review",
  "finishing-a-development-branch",
];
```

Add this test after `keeps the Superpowers provider subset explicit and manifest-aligned`:

```ts
  it("keeps vendored Superpowers references resolved inside the provider bundle", async () => {
    const manifest = await readManifest("packages/provider/superpowers");
    if (manifest.kind !== "provider") {
      throw new Error("Expected provider manifest.");
    }

    const providerSkillNames = new Set(manifest.skills.map((skill) => skill.name));
    const markdownFiles = await collectMarkdownFiles("packages/provider/superpowers/skills");
    const unresolvedReferences: string[] = [];

    for (const markdownFile of markdownFiles) {
      const content = await readFile(markdownFile, "utf8");
      for (const match of content.matchAll(/\bsuperpowers:([A-Za-z0-9._-]+)/g)) {
        const skillName = match[1];
        if (!providerSkillNames.has(skillName)) {
          unresolvedReferences.push(`${markdownFile}: superpowers:${skillName}`);
        }
      }
    }

    expect(unresolvedReferences.sort()).toEqual([]);
  });
```

Add this helper at the bottom of the file:

```ts
async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: fail because:

- `subagent-driven-development` and `using-git-worktrees` are expected but not present.
- runtime manifests do not reference the full expected closure.
- vendored provider Markdown contains unresolved `superpowers:subagent-driven-development` and `superpowers:using-git-worktrees`.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/unit/package-content.test.ts
git commit -m "test: cover Superpowers provider closure"
```

## Task 2: Add Upstream Superpowers Sync Script

**Files:**
- Create: `scripts/sync-superpowers-provider.ts`
- Create: `tests/unit/sync-superpowers-provider.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing sync script tests**

Create `tests/unit/sync-superpowers-provider.test.ts`:

```ts
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPERPOWERS_PROVIDER_SKILLS,
  syncSuperpowersProvider,
} from "../../scripts/sync-superpowers-provider.js";

describe("syncSuperpowersProvider", () => {
  it("copies the whitelisted Superpowers skills without editing content and removes stale destination files", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot);
    await mkdir(path.join(providerRoot, "brainstorming"), { recursive: true });
    await writeFile(path.join(providerRoot, "brainstorming", "stale.md"), "stale", "utf8");

    const result = await syncSuperpowersProvider({ sourceRoot, providerRoot });

    expect(result.copiedSkills).toEqual([...SUPERPOWERS_PROVIDER_SKILLS].sort());
    await expect(access(path.join(providerRoot, "brainstorming", "stale.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readFile(path.join(providerRoot, "using-git-worktrees", "SKILL.md"), "utf8")).resolves.toBe(
      "upstream using-git-worktrees\n",
    );
    await expect(
      readFile(path.join(providerRoot, "subagent-driven-development", "implementer-prompt.md"), "utf8"),
    ).resolves.toBe("upstream implementer prompt\n");
  });

  it("fails when a whitelisted upstream skill is missing", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot, { skip: "using-git-worktrees" });

    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Missing upstream Superpowers skill: using-git-worktrees",
    );
  });
});

async function seedSourceSkills(sourceRoot: string, options: { skip?: string } = {}): Promise<void> {
  for (const skillName of SUPERPOWERS_PROVIDER_SKILLS) {
    if (skillName === options.skip) {
      continue;
    }

    const skillRoot = path.join(sourceRoot, skillName);
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, "SKILL.md"), `upstream ${skillName}\n`, "utf8");

    if (skillName === "subagent-driven-development") {
      await writeFile(path.join(skillRoot, "implementer-prompt.md"), "upstream implementer prompt\n", "utf8");
      await writeFile(path.join(skillRoot, "spec-reviewer-prompt.md"), "upstream spec reviewer prompt\n", "utf8");
      await writeFile(
        path.join(skillRoot, "code-quality-reviewer-prompt.md"),
        "upstream code quality reviewer prompt\n",
        "utf8",
      );
    }
  }
}
```

- [ ] **Step 2: Run the focused script test and verify RED**

Run:

```bash
npm test -- tests/unit/sync-superpowers-provider.test.ts
```

Expected: fail because `scripts/sync-superpowers-provider.ts` does not exist.

- [ ] **Step 3: Add the sync script**

Create `scripts/sync-superpowers-provider.ts`:

```ts
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SUPERPOWERS_PROVIDER_SKILLS = [
  "brainstorming",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "verification-before-completion",
  "writing-plans",
] as const;

export interface SyncSuperpowersProviderOptions {
  sourceRoot: string;
  providerRoot?: string;
  skills?: readonly string[];
}

export interface SyncSuperpowersProviderResult {
  copiedSkills: string[];
}

export async function syncSuperpowersProvider(
  options: SyncSuperpowersProviderOptions,
): Promise<SyncSuperpowersProviderResult> {
  const sourceRoot = path.resolve(options.sourceRoot);
  const providerRoot = path.resolve(options.providerRoot ?? "packages/provider/superpowers/skills");
  const skills = [...(options.skills ?? SUPERPOWERS_PROVIDER_SKILLS)].sort();

  for (const skillName of skills) {
    const sourceSkillRoot = path.join(sourceRoot, skillName);
    await assertDirectory(sourceSkillRoot, `Missing upstream Superpowers skill: ${skillName}`);
    await assertFile(path.join(sourceSkillRoot, "SKILL.md"), `Upstream Superpowers skill lacks SKILL.md: ${skillName}`);

    const destinationSkillRoot = path.join(providerRoot, skillName);
    await rm(destinationSkillRoot, { force: true, recursive: true });
    await mkdir(path.dirname(destinationSkillRoot), { recursive: true });
    await cp(sourceSkillRoot, destinationSkillRoot, { force: true, recursive: true });
  }

  return { copiedSkills: skills };
}

async function assertDirectory(directoryPath: string, message: string): Promise<void> {
  try {
    if (!(await stat(directoryPath)).isDirectory()) {
      throw new Error(message);
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(message);
    }
    throw error;
  }
}

async function assertFile(filePath: string, message: string): Promise<void> {
  try {
    if (!(await stat(filePath)).isFile()) {
      throw new Error(message);
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(message);
    }
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function requiredValueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

async function main(): Promise<void> {
  const sourceRoot = requiredValueAfter(process.argv.slice(2), "--source") ?? process.env.SUPERPOWERS_SKILLS_SOURCE;
  if (!sourceRoot) {
    throw new Error("Missing --source. Pass the upstream Superpowers skills directory.");
  }

  const result = await syncSuperpowersProvider({ sourceRoot });
  console.log(`Synced ${result.copiedSkills.length} Superpowers provider skills: ${result.copiedSkills.join(", ")}`);
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFilePath) {
  await main();
}
```

- [ ] **Step 4: Add the package script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "build:registry": "tsx scripts/build-registry.ts",
    "sync:superpowers-provider": "tsx scripts/sync-superpowers-provider.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build && npm run build:registry"
  }
}
```

- [ ] **Step 5: Run the focused script test and verify GREEN**

Run:

```bash
npm test -- tests/unit/sync-superpowers-provider.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit the sync script**

```bash
git add package.json scripts/sync-superpowers-provider.ts tests/unit/sync-superpowers-provider.test.ts
git commit -m "feat: add Superpowers provider sync script"
```

## Task 3: Import Missing Skills And Update Runtime Orchestration

**Files:**
- Modify: `packages/provider/superpowers/manifest.yaml`
- Create by sync: `packages/provider/superpowers/skills/subagent-driven-development/**`
- Create by sync: `packages/provider/superpowers/skills/using-git-worktrees/SKILL.md`
- Modify: `packages/variant/frontend-react/manifest.yaml`
- Modify: `packages/variant/backend-java/manifest.yaml`
- Modify: `packages/variant/mobile-ios/manifest.yaml`
- Modify: `packages/variant/mobile-android/manifest.yaml`
- Modify: `packages/variant/frontend-react/runtime/SKILL.md`
- Modify: `packages/variant/backend-java/runtime/SKILL.md`
- Modify: `packages/variant/mobile-ios/runtime/SKILL.md`
- Modify: `packages/variant/mobile-android/runtime/SKILL.md`
- Modify: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Sync the upstream Superpowers provider skills**

Run:

```bash
npm run sync:superpowers-provider -- --source /Users/marcofasanella/.agents/vendor/superpowers/skills
```

Expected output includes:

```text
Synced 11 Superpowers provider skills:
```

Confirm the missing skill files now exist:

```bash
test -f packages/provider/superpowers/skills/subagent-driven-development/SKILL.md
test -f packages/provider/superpowers/skills/subagent-driven-development/implementer-prompt.md
test -f packages/provider/superpowers/skills/subagent-driven-development/spec-reviewer-prompt.md
test -f packages/provider/superpowers/skills/subagent-driven-development/code-quality-reviewer-prompt.md
test -f packages/provider/superpowers/skills/using-git-worktrees/SKILL.md
```

- [ ] **Step 2: Update the provider manifest**

Modify `packages/provider/superpowers/manifest.yaml` so the `skills` section is:

```yaml
skills:
  - name: brainstorming
    role: workflow
    source: skills/brainstorming
  - name: executing-plans
    role: workflow
    source: skills/executing-plans
  - name: finishing-a-development-branch
    role: workflow
    source: skills/finishing-a-development-branch
  - name: receiving-code-review
    role: workflow
    source: skills/receiving-code-review
  - name: requesting-code-review
    role: workflow
    source: skills/requesting-code-review
  - name: subagent-driven-development
    role: workflow
    source: skills/subagent-driven-development
  - name: systematic-debugging
    role: workflow
    source: skills/systematic-debugging
  - name: test-driven-development
    role: workflow
    source: skills/test-driven-development
  - name: using-git-worktrees
    role: workflow
    source: skills/using-git-worktrees
  - name: verification-before-completion
    role: workflow
    source: skills/verification-before-completion
  - name: writing-plans
    role: workflow
    source: skills/writing-plans
```

Leave `capabilities` unchanged for this implementation. Runtime references, not new capabilities, install the added
workflow skills.

- [ ] **Step 3: Update all variant manifest runtime references**

In each of these files:

- `packages/variant/frontend-react/manifest.yaml`
- `packages/variant/backend-java/manifest.yaml`
- `packages/variant/mobile-ios/manifest.yaml`
- `packages/variant/mobile-android/manifest.yaml`

replace the `runtime.references` list with:

```yaml
  references:
    - nexi-workflow-contracts
    - brainstorming
    - writing-plans
    - using-git-worktrees
    - subagent-driven-development
    - executing-plans
    - test-driven-development
    - systematic-debugging
    - verification-before-completion
    - requesting-code-review
    - receiving-code-review
    - finishing-a-development-branch
```

- [ ] **Step 4: Update runtime Required Skill Order sections**

In each runtime `SKILL.md`, replace only the `## Required Skill Order` numbered list with this order, keeping each
file's platform-specific command discovery and testing guidance intact:

```markdown
## Required Skill Order

1. Use `nexi-workflow-contracts` for command discovery, test design, traceability, manual tester output, and residual risk reporting.
2. Use Superpowers brainstorming for behavior-changing, UX, or architectural work.
3. Use Superpowers writing-plans when a multi-step implementation plan is needed.
4. Use Superpowers using-git-worktrees before executing implementation plans when workspace isolation is needed.
5. Prefer Superpowers subagent-driven-development when subagents are available and the plan can be decomposed into independent tasks.
6. Use Superpowers executing-plans for inline or fallback plan execution.
7. Use Superpowers test-driven-development before implementation code for behavior changes.
8. Use Superpowers systematic-debugging for failing tests, build errors, runtime defects, and unexpected behavior.
9. Use Superpowers verification-before-completion before claiming completion.
10. Use Superpowers requesting-code-review or receiving-code-review for review workflows.
11. Use Superpowers finishing-a-development-branch when implementation is complete and integration choices are needed.
```

- [ ] **Step 5: Run focused content tests and verify GREEN**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit provider closure implementation**

```bash
git add \
  packages/provider/superpowers/manifest.yaml \
  packages/provider/superpowers/skills \
  packages/variant/frontend-react/manifest.yaml \
  packages/variant/backend-java/manifest.yaml \
  packages/variant/mobile-ios/manifest.yaml \
  packages/variant/mobile-android/manifest.yaml \
  packages/variant/frontend-react/runtime/SKILL.md \
  packages/variant/backend-java/runtime/SKILL.md \
  packages/variant/mobile-ios/runtime/SKILL.md \
  packages/variant/mobile-android/runtime/SKILL.md \
  tests/unit/package-content.test.ts
git commit -m "feat: complete Superpowers provider workflow closure"
```

## Task 4: Verify Packaging And Portal PaaS Install

**Files:**
- Modify: `tests/unit/build-registry.test.ts`
- Local target validation: `/Users/marcofasanella/Projects/portal-paas`

- [ ] **Step 1: Add archive assertions for imported provider prompt files**

In `tests/unit/build-registry.test.ts`, extend `creates archives that extract to manifests and declared source content`:

```ts
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/implementer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/spec-reviewer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/code-quality-reviewer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/using-git-worktrees/SKILL.md")),
    ).resolves.toBeUndefined();
```

- [ ] **Step 2: Run focused registry tests**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: pass.

- [ ] **Step 3: Run broader local verification**

Run:

```bash
npm test -- tests/unit/package-content.test.ts tests/unit/sync-superpowers-provider.test.ts tests/unit/build-registry.test.ts tests/integration/install-sync.test.ts tests/integration/utility-list-validate.test.ts
npm run build
npm test
```

Expected:

- all listed focused tests pass
- TypeScript build passes
- full test suite passes

- [ ] **Step 4: Build a local package tarball**

Run:

```bash
tmpdir=$(mktemp -d)
npm pack --pack-destination "$tmpdir"
tarball="$tmpdir/nexidigital-nd-gen-skills-0.1.0.tgz"
printf '%s\n' "$tarball"
```

Keep the `tarball` shell variable available for the next step in the same terminal.

- [ ] **Step 5: Reinstall frontend runtime into portal-paas**

Run from `/Users/marcofasanella/Projects/portal-paas` in the same shell where `tarball` was set:

```bash
npm exec --yes --package "$tarball" -- nd-gen-skills install --variant frontend-react --ci
npm exec --yes --package "$tarball" -- nd-gen-skills validate --ci
npm exec --yes --package "$tarball" -- nd-gen-skills list
```

Expected:

- install succeeds
- validation prints `Validation passed.`
- list output shows `frontend-react@0.1.0`
- managed skill count includes the two added workflow skills

- [ ] **Step 6: Re-run the portal content audit**

Run from `/Users/marcofasanella/Projects/portal-paas`:

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');
const root = '.agents/skills';
const installed = new Set(fs.readdirSync(root).filter((name) => fs.statSync(path.join(root, name)).isDirectory()));
const unresolved = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) walk(filePath);
    else if (filePath.endsWith('.md')) scan(filePath);
  }
}
function scan(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(/\bsuperpowers:([A-Za-z0-9._-]+)/g)) {
    if (!installed.has(match[1])) unresolved.push(`${filePath}: superpowers:${match[1]}`);
  }
}
walk(root);
if (unresolved.length > 0) {
  console.error(unresolved.sort().join('\n'));
  process.exit(1);
}
console.log('All superpowers references resolve.');
NODE
```

Expected:

```text
All superpowers references resolve.
```

- [ ] **Step 7: Commit registry test and final verification adjustments**

If Task 4 changed only `tests/unit/build-registry.test.ts`, commit:

```bash
git add tests/unit/build-registry.test.ts
git commit -m "test: verify Superpowers provider archive closure"
```

If no additional tracked files changed after earlier commits, skip this commit and record the successful verification in
the final response.

## Final Verification Checklist

Run before reporting completion:

```bash
git status --short
npm test
npm run build
npm run build:registry
```

Then verify `/Users/marcofasanella/Projects/portal-paas` with the locally packed tarball:

```bash
nd-gen-skills validate --ci
nd-gen-skills list
```

Report:

- commits created
- local package tarball path
- `portal-paas` validation result
- whether `portal-paas/.agents/` remains ignored
- any residual risk

## Self-Review

- Spec coverage: covers missing skill import, unchanged upstream content, sync script, runtime references, tests, packaging, and portal validation.
- Placeholder scan: no deferred content remains.
- Type consistency: script exports and test imports use the same names: `SUPERPOWERS_PROVIDER_SKILLS` and `syncSuperpowersProvider`.
- Scope check: focused on Superpowers provider closure, not generic provider dependency modeling.
