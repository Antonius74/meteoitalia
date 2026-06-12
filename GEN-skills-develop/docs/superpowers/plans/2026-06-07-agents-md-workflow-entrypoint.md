# AGENTS.md Workflow Entry Point Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated `AGENTS.md` a compact operational entry point and add short CLI next-step guidance after installer commands without breaking repositories installed by a previous package version.

**Architecture:** Keep `src/agents-md/block.ts` as the only renderer for the managed block. Keep command handlers unchanged and centralize user-facing CLI next-step text in `src/cli/main.ts`, because only the CLI layer should print command output.

**Tech Stack:** Node 20, TypeScript, ESM/NodeNext, Vitest, existing installer and registry test helpers.

---

## File Structure

- Modify `src/agents-md/block.ts`: render the new compact operational `AGENTS.md` block.
- Modify `src/installer/validate.ts`: accept both the new compact runtime sentence and the previous runtime sentence for backward-compatible validation.
- Modify `src/cli/main.ts`: append short next-step guidance after install, sync, add-skill, and remove-skill success output.
- Modify `tests/unit/lockfile-agents.test.ts`: pin runtime and utility-only block behavior.
- Modify `tests/integration/install-sync.test.ts`: verify install and reinstall refresh behavior.
- Modify `tests/integration/utility-list-validate.test.ts`: verify utility-only block behavior and CLI output.
- Do not modify `packages/provider/**`.

This plan intentionally has review checkpoints instead of commit steps. The repository Human VCS Gate requires explicit user approval before staging or committing.

---

### Task 1: Pin The New AGENTS.md Rendering Contract

**Files:**
- Modify: `tests/unit/lockfile-agents.test.ts`

- [ ] **Step 1: Update the runtime block test**

Replace the assertions inside `it("renders runtime, utilities, and the Human VCS Gate", ...)` with assertions for the compact operational structure:

```ts
expect(block).toContain("Runtime entry point:");
expect(block).toContain(
  "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
);
expect(block).toContain("Skill composition:");
expect(block).toContain("- The runtime skill is the repository-level entry point.");
expect(block).toContain("- Provider skills guide workflow phases.");
expect(block).toContain("- Utility skills add focused capabilities.");
expect(block).toContain(
  "- Repository instructions and this managed block override provider instructions when they conflict.",
);
expect(block).toContain("Human VCS Gate:");
expect(block).toContain(
  "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
);
expect(block).toContain("- Read-only Git inspection is allowed.");
expect(block).toContain(
  "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
);
expect(block).toContain("- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.");
expect(block).not.toContain("installed for the `frontend-react` variant");
expect(block).not.toContain("Tool:");
expect(block).not.toContain("Provider:");
expect(block).not.toContain("Variant:");
```

- [ ] **Step 2: Update the utility-only block test**

Keep the existing utility-only setup, then assert that runtime-only guidance is absent while utility guidance remains present:

```ts
expect(block).toContain("This repository uses Nexi AI Skills utility packages.");
expect(block).toContain("Skill composition:");
expect(block).toContain("- Utility skills add focused capabilities.");
expect(block).toContain(
  "- Repository instructions and this managed block override installed skill instructions when they conflict.",
);
expect(block).not.toContain("Runtime entry point:");
expect(block).not.toContain("Start with");
expect(block).not.toContain("The runtime skill is the repository-level entry point.");
expect(block).not.toContain("Provider skills guide workflow phases.");
expect(block).toContain("- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.");
expect(block).toContain("Human VCS Gate");
```

- [ ] **Step 3: Run the focused unit test and confirm it fails**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
```

Expected: FAIL because `src/agents-md/block.ts` still renders the old sentence and old Human VCS Gate bullet.

---

### Task 2: Implement The Compact AGENTS.md Renderer

**Files:**
- Modify: `src/agents-md/block.ts`
- Modify: `src/installer/validate.ts`
- Test: `tests/unit/lockfile-agents.test.ts`

- [ ] **Step 1: Update `renderAgentsBlock` runtime output**

In `src/agents-md/block.ts`, replace the current runtime branch with this structure:

```ts
if (input.runtimeSkill && input.variant) {
  lines.push(
    "Runtime entry point:",
    `- Start with \`${input.runtimeSkill}\` for implementation, debugging, testing, review, and maintenance.`,
    "",
    "Skill composition:",
    "- The runtime skill is the repository-level entry point.",
    "- Provider skills guide workflow phases.",
    "- Utility skills add focused capabilities.",
    "- Repository instructions and this managed block override provider instructions when they conflict.",
    "",
  );
} else {
  lines.push(
    "This repository uses Nexi AI Skills utility packages.",
    "",
    "Skill composition:",
    "- Utility skills add focused capabilities.",
    "- Repository instructions and this managed block override installed skill instructions when they conflict.",
    "",
  );
}
```

Leave `variant?: string` in `AgentsBlockInput` for compatibility with existing callers, but do not render the variant value.

- [ ] **Step 2: Update the Human VCS Gate bullets**

In the same renderer, replace the existing gate block with:

```ts
lines.push(
  "Human VCS Gate:",
  "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
  "- Read-only Git inspection is allowed.",
  "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
  "",
);
```

- [ ] **Step 3: Make installer validation backward-compatible**

In `src/installer/validate.ts`, replace the single runtime sentence check:

```ts
if (lockfile.variant && !block.includes(runtimeSentence(lockfile.variant.runtimeSkill))) {
  errors.push("AGENTS.md managed block is invalid.");
  return;
}
```

with a check that accepts both the new compact sentence and the previous generated sentence:

```ts
if (
  lockfile.variant &&
  !runtimeSentences(lockfile.variant.runtimeSkill).some((sentence) => block.includes(sentence))
) {
  errors.push("AGENTS.md managed block is invalid.");
  return;
}
```

Replace `runtimeSentence` with:

```ts
function runtimeSentences(runtimeSkill: string): string[] {
  return [
    `- Start with \`${runtimeSkill}\` for implementation, debugging, testing, review, and maintenance.`,
    `For implementation, debugging, testing, review, and maintenance work in this repository, start with \`${runtimeSkill}\`.`,
  ];
}
```

- [ ] **Step 4: Run the focused unit test**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run validate-related integration tests**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: tests may still fail only where they assert old `AGENTS.md` text or old CLI output. Fix those in later tasks.

---

### Task 3: Update Installer Integration Coverage

**Files:**
- Modify: `tests/integration/install-sync.test.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Strengthen runtime install assertions**

In `tests/integration/install-sync.test.ts`, inside `it("installs the frontend React runtime, provider skills, contracts, lockfile, and AGENTS.md for Codex", ...)`, add:

```ts
expect(agents).toContain("Runtime entry point:");
expect(agents).toContain(
  "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
);
expect(agents).toContain("Skill composition:");
expect(agents).toContain("- Provider skills guide workflow phases.");
expect(agents).toContain("- Utility skills add focused capabilities.");
expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
```

- [ ] **Step 2: Update the legacy reinstall fixture**

In `tests/integration/install-sync.test.ts`, keep the old fixture text in the reinstall test so the test proves an older managed block refreshes. After reinstall, add:

```ts
expect(agents).toContain("Runtime entry point:");
expect(agents).toContain("Skill composition:");
expect(agents).toContain("- Provider skills guide workflow phases.");
expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
```

- [ ] **Step 3: Update utility-only install assertions**

In `tests/integration/utility-list-validate.test.ts`, inside `it("add-skill installs a utility without a runtime", ...)`, replace the single `AGENTS.md` assertion with:

```ts
const agents = await readText("AGENTS.md");
expect(agents).toContain("This repository uses Nexi AI Skills utility packages.");
expect(agents).toContain("Skill composition:");
expect(agents).toContain("- Utility skills add focused capabilities.");
expect(agents).not.toContain("Runtime entry point:");
expect(agents).not.toContain("Provider skills guide workflow phases.");
```

- [ ] **Step 4: Add validation coverage for the previous AGENTS.md block shape**

In `tests/integration/utility-list-validate.test.ts`, add a test near the existing validate tests that proves `validate --ci`
accepts a repository with the previous runtime sentence:

```ts
it("validate accepts the previous runtime AGENTS.md sentence for backward compatibility", async () => {
  await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
  await writeTreeFile(
    root,
    "AGENTS.md",
    [
      "<!-- nd-gen-skills:start -->",
      "## Nexi AI Skills",
      "",
      "For implementation, debugging, testing, review, and maintenance work in this repository, start with `nexi-frontend-react-runtime`.",
      "",
      "This repository uses Nexi AI Skills installed for the `frontend-react` variant.",
      "",
      "Human VCS Gate:",
      "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
      "",
      "Installed utility skills:",
      "- `grill-me`: Installed utility skill.",
      "- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.",
      "- `figma-use`: Installed utility skill.",
      "- `frontend-react-e2e-test-implementation`: Installed utility skill.",
      "<!-- nd-gen-skills:end -->",
      "",
    ].join("\n"),
  );

  const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });

  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
});
```

- [ ] **Step 5: Run focused integration tests**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts tests/integration/utility-list-validate.test.ts
```

Expected: tests may still fail only for CLI output expectations, fixed in Task 4.

---

### Task 4: Add CLI Next-Step Guidance

**Files:**
- Modify: `src/cli/main.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Add CLI output helpers**

In `src/cli/main.ts`, below `main`, add helpers:

```ts
function runtimeNextSteps(): string {
  return [
    "Next:",
    "- Read AGENTS.md for the managed workflow entry point.",
    "- Start from the runtime skill listed there.",
    "- VCS write actions require explicit user approval.",
  ].join("\n");
}

function utilityNextSteps(): string {
  return [
    "Next:",
    "- Read AGENTS.md for the managed utility skill list.",
    "- Use installed utility skills only when the current workflow calls for them.",
    "- VCS write actions require explicit user approval.",
  ].join("\n");
}
```

- [ ] **Step 2: Print runtime guidance after install and sync**

In `src/cli/main.ts`, after the existing install and sync success lines, add:

```ts
output.info(runtimeNextSteps());
```

The install branch should become:

```ts
await installCommand({ ...parsed, root: process.cwd() });
output.info(`Installed Nexi AI Skills variant ${parsed.variant} for ${parsed.tool}.`);
output.info(runtimeNextSteps());
return 0;
```

The sync branch should become:

```ts
await syncCommand({ ...parsed, root: process.cwd() });
output.info(`Synced Nexi AI Skills for ${parsed.tool}.`);
output.info(runtimeNextSteps());
return 0;
```

- [ ] **Step 3: Print utility guidance after add-skill and remove-skill**

In `src/cli/main.ts`, after the existing add/remove success lines, add:

```ts
output.info(utilityNextSteps());
```

- [ ] **Step 4: Add CLI install and sync output coverage**

In `tests/integration/utility-list-validate.test.ts`, add a new test near the existing CLI tests:

```ts
it("CLI prints workflow next steps for install and sync", async () => {
  const messages: string[] = [];
  const output = {
    info: (message: string) => messages.push(message),
    warn: (message: string) => messages.push(message),
    error: (message: string) => messages.push(message),
  };

  const installExit = await inRoot(() =>
    main(["install", "frontend-react", "--registry", registryRoot, "--ci"], output),
  );
  const syncExit = await inRoot(() => main(["sync", "--registry", registryRoot, "--ci"], output));

  expect(installExit).toBe(0);
  expect(syncExit).toBe(0);
  expect(messages.join("\n")).toContain("Installed Nexi AI Skills variant frontend-react for codex.");
  expect(messages.join("\n")).toContain("Synced Nexi AI Skills for codex.");
  expect(messages.join("\n")).toContain("Read AGENTS.md for the managed workflow entry point.");
  expect(messages.join("\n")).toContain("Start from the runtime skill listed there.");
  expect(messages.join("\n")).toContain("VCS write actions require explicit user approval.");
});
```

- [ ] **Step 5: Strengthen add/remove CLI output coverage**

In `it("CLI routes add-skill and remove-skill", ...)`, add:

```ts
expect(messages.join("\n")).toContain("Read AGENTS.md for the managed utility skill list.");
expect(messages.join("\n")).toContain("Use installed utility skills only when the current workflow calls for them.");
expect(messages.join("\n")).toContain("VCS write actions require explicit user approval.");
```

- [ ] **Step 6: Run focused CLI integration tests**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: PASS.

---

### Task 5: Full Verification And Package Safety Checks

**Files:**
- Inspect only: `packages/provider/**`

- [ ] **Step 1: Confirm no provider files changed**

Run:

```bash
git diff --name-only -- packages/provider
```

Expected: no output.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Check whether registry artifacts changed**

Run:

```bash
git diff --name-only -- dist-registry packages src tests docs
```

Expected: source, tests, and docs changes are present. `dist-registry` should not change unless package content changed.

- [ ] **Step 5: Final review checkpoint**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the implementation, tests, and plan/spec files for this work are changed. Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.

---

## Self-Review

- Spec coverage: the plan updates compact `AGENTS.md` rendering, utility-only behavior, CLI next-step guidance, backward-compatible validation, upgrade refresh behavior, and provider safety checks.
- Placeholder scan: no placeholder markers or vague implementation steps remain.
- Type consistency: the plan keeps existing `AgentsBlockInput` fields, updates only rendering text, and keeps CLI output in the existing `Output.info(message: string)` shape.
