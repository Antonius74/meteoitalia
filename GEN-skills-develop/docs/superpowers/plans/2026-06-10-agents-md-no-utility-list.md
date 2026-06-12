# AGENTS.md Utility Inventory Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove generated installed utility inventory from `AGENTS.md` while keeping runtime entry guidance, skill composition guidance, and the Human VCS Gate.

**Architecture:** Keep `src/agents-md/block.ts` as the only renderer for the managed `AGENTS.md` block. Update validation so `AGENTS.md` is checked for stable generated anchors, while utility installation correctness remains validated through lockfile and managed file state. Update CLI utility next-step text so it no longer promises an `AGENTS.md` utility list.

**Tech Stack:** Node 20, TypeScript, ESM/NodeNext, Vitest, existing installer and registry helpers.

---

## File Structure

- Modify `tests/unit/lockfile-agents.test.ts`: pin the new renderer contract and assert utility inventory is absent.
- Modify `src/agents-md/block.ts`: remove `Installed utility skills:` rendering and ignore utility names/descriptions.
- Modify `src/installer/validate.ts`: remove `AGENTS.md` utility bullet validation.
- Modify `tests/integration/utility-list-validate.test.ts`: update utility-related `AGENTS.md`, validation, and CLI assertions.
- Modify `tests/integration/install-sync.test.ts`: update runtime install and reinstall assertions.
- Modify `src/cli/main.ts`: update utility add/remove next-step wording.
- Do not modify `packages/provider/**`.

This plan intentionally omits commit steps. Repository instructions require explicit user approval before staging or committing.

---

### Task 1: Pin Renderer Behavior In Unit Tests

**Files:**
- Modify: `tests/unit/lockfile-agents.test.ts`
- Test: `tests/unit/lockfile-agents.test.ts`

- [ ] **Step 1: Update the runtime renderer test name**

Change:

```ts
it("renders runtime, utilities, and the Human VCS Gate", () => {
```

to:

```ts
it("renders runtime guidance, skill composition, and the Human VCS Gate without utility inventory", () => {
```

- [ ] **Step 2: Replace the utility bullet assertion in the runtime renderer test**

Remove this assertion:

```ts
expect(block).toContain("- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.");
```

Add these assertions in its place:

```ts
expect(block).not.toContain("Installed utility skills:");
expect(block).not.toContain("- None");
expect(block).not.toContain("- `read-jira-issue`:");
expect(block).not.toContain("Read Jira issue evidence for workflow skills in read-only mode.");
```

- [ ] **Step 3: Replace the utility bullet assertion in the utility-only renderer test**

In `it("renders a utility-only block when no runtime is present", ...)`, remove this assertion:

```ts
expect(block).toContain("- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.");
```

Add these assertions in its place:

```ts
expect(block).not.toContain("Installed utility skills:");
expect(block).not.toContain("- None");
expect(block).not.toContain("- `read-jira-issue`:");
expect(block).not.toContain("Read Jira issue evidence for workflow skills in read-only mode.");
```

- [ ] **Step 4: Run the focused unit test and verify it fails**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
```

Expected: FAIL because `src/agents-md/block.ts` still renders `Installed utility skills:` and utility bullets.

---

### Task 2: Remove Utility Inventory From The Renderer

**Files:**
- Modify: `src/agents-md/block.ts`
- Test: `tests/unit/lockfile-agents.test.ts`

- [ ] **Step 1: Remove utility inventory rendering**

In `src/agents-md/block.ts`, delete this block from `renderAgentsBlock`:

```ts
  lines.push("Installed utility skills:");

  if (input.utilities.length === 0) {
    lines.push("- None");
  } else {
    for (const utility of input.utilities) {
      lines.push(`- \`${utility.name}\`: ${utility.description}`);
    }
  }
```

Leave `AgentsBlockInput.utilities` in the interface and leave existing callers unchanged.

- [ ] **Step 2: Run the focused unit test and verify it passes**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts
```

Expected: PASS.

---

### Task 3: Stop Validating Utility Bullets In AGENTS.md

**Files:**
- Modify: `src/installer/validate.ts`
- Test: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Remove utility bullet validation**

In `src/installer/validate.ts`, delete this loop from `validateAgentsBlock`:

```ts
  for (const utility of lockfile.utilities) {
    if (!block.includes(utilityBulletPrefix(utility.name))) {
      errors.push("AGENTS.md managed block is invalid.");
      return;
    }
  }
```

- [ ] **Step 2: Remove the unused helper**

Delete this helper from `src/installer/validate.ts`:

```ts
function utilityBulletPrefix(utilityName: string): string {
  return `- \`${utilityName}\`:`;
}
```

- [ ] **Step 3: Add validation coverage for utilities without AGENTS.md inventory**

In `tests/integration/utility-list-validate.test.ts`, after the existing test `validate accepts the previous runtime AGENTS.md sentence for backward compatibility`, add:

```ts
  it("validate accepts installed utilities without AGENTS.md utility inventory", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeTreeFile(
      root,
      "AGENTS.md",
      [
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "Runtime entry point:",
        "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
        "",
        "Skill composition:",
        "- The runtime skill is the repository-level entry point.",
        "- Provider skills guide workflow phases.",
        "- Utility skills add focused capabilities.",
        "- Repository instructions and this managed block override provider instructions when they conflict.",
        "",
        "Human VCS Gate:",
        "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
        "- Read-only Git inspection is allowed.",
        "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
        "<!-- nd-gen-skills:end -->",
        "",
      ].join("\n"),
    );

    const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
```

- [ ] **Step 4: Run the focused integration validation test file**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: FAIL only in assertions that still expect utility inventory or the old CLI utility-list wording. Fix those in later tasks.

---

### Task 4: Update Runtime And Utility AGENTS.md Integration Assertions

**Files:**
- Modify: `tests/integration/install-sync.test.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`
- Test: `tests/integration/install-sync.test.ts`
- Test: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Strengthen runtime install assertions**

In `tests/integration/install-sync.test.ts`, inside `it("installs the frontend React runtime, provider skills, contracts, lockfile, and AGENTS.md for Codex", ...)`, after the existing assertion:

```ts
expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
```

add:

```ts
expect(agents).not.toContain("Installed utility skills:");
expect(agents).not.toContain("- `grill-me`:");
expect(agents).not.toContain("- `read-jira-issue`:");
expect(agents).not.toContain("- `figma-use`:");
```

- [ ] **Step 2: Update reinstall refresh assertions**

In `tests/integration/install-sync.test.ts`, inside `it("runtime reinstall refreshes the managed AGENTS.md block with the Human VCS Gate and preserves user text", ...)`, after:

```ts
expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
```

replace:

```ts
expect(agents).not.toContain("- None");
```

with:

```ts
expect(agents).not.toContain("Installed utility skills:");
expect(agents).not.toContain("- None");
expect(agents).not.toContain("- `read-jira-issue`:");
```

- [ ] **Step 3: Update runtime plus added utility assertion**

In `tests/integration/utility-list-validate.test.ts`, rename:

```ts
it("install runtime then add utility lists both runtime and utility in AGENTS.md", async () => {
```

to:

```ts
it("install runtime then add utility keeps runtime guidance without listing utilities in AGENTS.md", async () => {
```

Replace the assertions:

```ts
expect(agents).toContain("nexi-frontend-react-runtime");
expect(agents).toContain("tdd");
expect(agents).toContain("- `tdd`: Installed utility skill.");
```

with:

```ts
expect(agents).toContain("nexi-frontend-react-runtime");
expect(agents).toContain("Skill composition:");
expect(agents).toContain("- Utility skills add focused capabilities.");
expect(agents).not.toContain("Installed utility skills:");
expect(agents).not.toContain("tdd");
expect(agents).not.toContain("- `tdd`: Installed utility skill.");
```

- [ ] **Step 4: Update utility-only AGENTS.md assertions**

In `tests/integration/utility-list-validate.test.ts`, find the existing assertions around the utility-only `AGENTS.md` read near the first add-skill integration test. Keep the assertions for `Skill composition:` and Human VCS Gate, but ensure the test asserts:

```ts
expect(agents).toContain("Skill composition:");
expect(agents).toContain("- Utility skills add focused capabilities.");
expect(agents).toContain(
  "- Repository instructions and this managed block override installed skill instructions when they conflict.",
);
expect(agents).toContain("Human VCS Gate");
expect(agents).not.toContain("Runtime entry point:");
expect(agents).not.toContain("Installed utility skills:");
expect(agents).not.toContain("- `tdd`:");
expect(agents).not.toContain("- None");
```

- [ ] **Step 5: Run both integration test files**

Run:

```bash
npm test -- tests/integration/install-sync.test.ts tests/integration/utility-list-validate.test.ts
```

Expected: FAIL only where production code still renders utility inventory or CLI wording still says `managed utility skill list`.

---

### Task 5: Update CLI Utility Next-Step Wording

**Files:**
- Modify: `src/cli/main.ts`
- Modify: `tests/integration/utility-list-validate.test.ts`
- Test: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Update utility next-step text**

In `src/cli/main.ts`, replace `utilityNextSteps` with:

```ts
function utilityNextSteps(): string {
  return [
    "Next:",
    "- Read AGENTS.md for repository-level managed instructions.",
    "- Use installed utility skills only when the current workflow calls for them.",
    "- VCS write actions require explicit user approval.",
  ].join("\n");
}
```

- [ ] **Step 2: Update CLI assertions**

In `tests/integration/utility-list-validate.test.ts`, inside `it("CLI routes add-skill and remove-skill", ...)`, replace:

```ts
expect(messages.join("\n")).toContain("Read AGENTS.md for the managed utility skill list.");
```

with:

```ts
expect(messages.join("\n")).toContain("Read AGENTS.md for repository-level managed instructions.");
expect(messages.join("\n")).not.toContain("Read AGENTS.md for the managed utility skill list.");
```

- [ ] **Step 3: Run the focused CLI integration test**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts -t "CLI routes add-skill and remove-skill"
```

Expected: PASS.

---

### Task 6: Verify The Full Change

**Files:**
- Test: package test and build outputs

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts tests/integration/install-sync.test.ts tests/integration/utility-list-validate.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run the TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Check provider files were not modified**

Run:

```bash
git status --short -- packages/provider
```

Expected: no output.

- [ ] **Step 5: Check final worktree scope**

Run:

```bash
git status --short
```

Expected: modified files are limited to:

```text
 M src/agents-md/block.ts
 M src/cli/main.ts
 M src/installer/validate.ts
 M tests/integration/install-sync.test.ts
 M tests/integration/utility-list-validate.test.ts
 M tests/unit/lockfile-agents.test.ts
?? docs/superpowers/plans/2026-06-10-agents-md-no-utility-list.md
```

The plan file may already be committed or staged depending on the execution session. Do not stage or commit implementation changes unless the user explicitly approves a VCS write action.

---

## Self-Review

Spec coverage:

- Utility inventory removal is covered by Tasks 1, 2, and 4.
- Keeping `Skill composition:` is covered by Tasks 1 and 4.
- Keeping Human VCS Gate is covered by Tasks 1 and 4.
- Validation no longer depending on utility bullets is covered by Task 3.
- CLI utility wording is covered by Task 5.
- Provider file protection is covered by Task 6.

Deferred-detail scan: none remain.

Type consistency: the plan keeps the existing `AgentsBlockInput` shape, uses existing `renderAgentsBlock`, `validateCommand`, `installCommand`, `addSkillCommand`, and `writeTreeFile` names, and does not introduce new public APIs.
