# Human VCS Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a provider-neutral Human VCS Gate so Nexi-installed skills leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.

**Architecture:** Put the authoritative rule in `nexi-workflow-contracts`, reinforce it in every runtime, and surface it in the generated `AGENTS.md` block. Keep provider skill bodies unchanged so upstream Superpowers and Workflow Stack packages remain updateable.

**Tech Stack:** Node 20, TypeScript, Vitest, YAML package manifests, managed Markdown skills.

**VCS Rule For This Plan:** Do not run `git add`, `git commit`, `git push`, merge commands, PR creation commands, branch deletion, or worktree cleanup while executing this plan unless the user explicitly requests that VCS write action. Use review checkpoints instead of commit steps.

---

## File Structure

- Modify `src/agents-md/block.ts`: render the generated Human VCS Gate reminder inside every managed `AGENTS.md` block.
- Modify `packages/contract/nexi-workflow-contracts/skill/SKILL.md`: define the authoritative provider-neutral policy.
- Modify `packages/variant/backend-java/runtime/SKILL.md`: apply the policy to backend Java runtime workflows.
- Modify `packages/variant/frontend-react/runtime/SKILL.md`: apply the policy to frontend React runtime workflows.
- Modify `packages/variant/mobile-android/runtime/SKILL.md`: apply the policy to Android runtime workflows.
- Modify `packages/variant/mobile-ios/runtime/SKILL.md`: apply the policy to iOS runtime workflows.
- Modify `tests/unit/lockfile-agents.test.ts`: assert generated `AGENTS.md` blocks include the VCS reminder.
- Modify `tests/unit/package-content.test.ts`: assert contract and runtime skill content includes the VCS policy and provider skills remain unmodified.
- Modify `tests/integration/install-sync.test.ts`: assert installed and upgraded `AGENTS.md` content includes the VCS reminder while preserving user-authored text.
- Refresh `dist-registry/index.yaml` and affected package archives after content changes.

## Task 1: Add Failing Coverage For Generated AGENTS.md Guidance

**Files:**
- Modify: `tests/unit/lockfile-agents.test.ts`
- Modify: `tests/integration/install-sync.test.ts`

- [ ] **Step 1: Update the runtime AGENTS block unit test**

In `tests/unit/lockfile-agents.test.ts`, change the `renders runtime and utilities` test to store the rendered block and assert the VCS reminder:

```ts
  it("renders runtime, utilities, and the Human VCS Gate", () => {
    const block = renderAgentsBlock({
      variant: "frontend-react",
      runtimeSkill: "nexi-frontend-react-runtime",
      utilities: [{ name: "read-jira-issue", description: "Read Jira issue evidence for workflow skills in read-only mode." }],
    });

    expect(block).toContain("start with `nexi-frontend-react-runtime`");
    expect(block).toContain("Human VCS Gate");
    expect(block).toContain("Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.");
    expect(block).toContain("Do not push, merge, create pull requests, delete branches, or clean up worktrees without explicit user approval.");
  });
```

- [ ] **Step 2: Update the utility-only AGENTS block unit test**

In the `renders a utility-only block when no runtime is present` test, keep the existing assertions and add:

```ts
    expect(block).toContain("Human VCS Gate");
    expect(block).toContain("Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.");
```

- [ ] **Step 3: Add install-time AGENTS assertions**

In `tests/integration/install-sync.test.ts`, update the first install test after the existing `AGENTS.md` assertion:

```ts
    const agents = await readText("AGENTS.md");
    expect(agents).toContain("nexi-frontend-react-runtime");
    expect(agents).toContain("Human VCS Gate");
    expect(agents).toContain("Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.");
```

Replace the existing single-line `await expect(readText("AGENTS.md")).resolves.toContain("nexi-frontend-react-runtime");` in that test with the snippet above.

- [ ] **Step 4: Add upgrade preservation integration coverage**

Add this test near the existing same-variant reinstall and sync tests in `tests/integration/install-sync.test.ts`:

```ts
  it("runtime reinstall refreshes the managed AGENTS.md block with the Human VCS Gate and preserves user text", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(
      path.join(root, "AGENTS.md"),
      [
        "# Repo",
        "",
        "Keep before.",
        "",
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "For implementation, debugging, testing, review, and maintenance work in this repository, start with `nexi-frontend-react-runtime`.",
        "",
        "This repository uses Nexi AI Skills installed for the `frontend-react` variant.",
        "",
        "Installed utility skills:",
        "- None",
        "<!-- nd-gen-skills:end -->",
        "",
        "Keep after.",
        "",
      ].join("\n"),
      "utf8",
    );

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const agents = await readText("AGENTS.md");
    expect(agents).toContain("Keep before.");
    expect(agents).toContain("Keep after.");
    expect(agents).toContain("Human VCS Gate");
    expect(agents).toContain("Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.");
    expect(agents).not.toContain("- None");
  });
```

- [ ] **Step 5: Run focused tests and confirm they fail**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts tests/integration/install-sync.test.ts
```

Expected: failures because `renderAgentsBlock` does not yet emit `Human VCS Gate`.

## Task 2: Add Failing Coverage For Contract And Runtime Skill Content

**Files:**
- Modify: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Extend shared contract content assertions**

In the `defines shared Nexi workflow contracts` test, add these terms to the `for (const term of [...])` list:

```ts
      "Human VCS Gate",
      "git add",
      "git commit",
      "git push",
      "explicitly asks for that VCS write action",
```

- [ ] **Step 2: Add runtime content assertions**

Add this test near `tells every runtime to use grill-me for planning and brainstorming`:

```ts
  it("tells every runtime to apply the provider-neutral Human VCS Gate", async () => {
    for (const variant of ["frontend-react", "backend-java", "mobile-ios", "mobile-android"]) {
      const content = await readFile(`packages/variant/${variant}/runtime/SKILL.md`, "utf8");

      expect(content).toContain("Human VCS Gate");
      expect(content).toContain("applies regardless of provider");
      expect(content).toContain("Do not run `git add`, `git commit`, `git push`");
      expect(content).toContain("Leave changes unstaged and uncommitted in final delivery");
      expect(content).toContain("reinterpret that instruction as verify, summarize the diff, and stop for developer review");
    }
  });
```

- [ ] **Step 3: Strengthen provider no-overlay assertions**

In the `keeps Nexi overlays out of provider Superpowers skills` test, add these strings to `forbiddenOverlayMarkers`:

```ts
      "Human VCS Gate",
      "Leave changes unstaged and uncommitted",
      "reinterpret that instruction as verify, summarize the diff, and stop for developer review",
```

- [ ] **Step 4: Run focused tests and confirm they fail**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: failures because contract and runtime files do not yet contain the Human VCS Gate text.

## Task 3: Implement Generated AGENTS.md Reminder

**Files:**
- Modify: `src/agents-md/block.ts`

- [ ] **Step 1: Add Human VCS Gate lines to `renderAgentsBlock`**

In `src/agents-md/block.ts`, insert these lines after the runtime-or-utility intro block and before `Installed utility skills:`:

```ts
  lines.push(
    "Human VCS Gate:",
    "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    "- Read-only Git inspection is allowed. Do not push, merge, create pull requests, delete branches, or clean up worktrees without explicit user approval.",
    "",
  );
```

- [ ] **Step 2: Run focused AGENTS tests**

Run:

```bash
npm test -- tests/unit/lockfile-agents.test.ts tests/integration/install-sync.test.ts
```

Expected: the AGENTS-related tests pass. If unrelated integration tests fail, inspect the failure before changing behavior.

## Task 4: Implement Contract And Runtime Policy Text

**Files:**
- Modify: `packages/contract/nexi-workflow-contracts/skill/SKILL.md`
- Modify: `packages/variant/backend-java/runtime/SKILL.md`
- Modify: `packages/variant/frontend-react/runtime/SKILL.md`
- Modify: `packages/variant/mobile-android/runtime/SKILL.md`
- Modify: `packages/variant/mobile-ios/runtime/SKILL.md`

- [ ] **Step 1: Add the authoritative contract section**

In `packages/contract/nexi-workflow-contracts/skill/SKILL.md`, add this section after `## Command Discovery` and before `## Test Design Before TDD`:

```md
## Human VCS Gate

Apply this gate to every provider workflow, runtime skill, contract, and utility installed by `nd-gen-skills`.

Do not automatically run `git add`, `git commit`, `git push`, merge commands, pull request creation commands, branch deletion commands, or worktree cleanup commands. A VCS write action is allowed only after the user explicitly asks for that VCS write action.

Read-only Git inspection is allowed. You may run commands such as `git status`, `git diff`, `git log`, and `git branch` to understand repository state and report changes.

Implementation, verification, review, and file edits may proceed normally. Final delivery must leave changes unstaged and uncommitted, and must report changed files, verification results, skipped checks, residual risk, and any suggested commit message.
```

- [ ] **Step 2: Add runtime reinforcement text to all four runtimes**

In each runtime file, add this section after `## Provider Workflow` and before `## Runtime Utilities`:

```md
## Human VCS Gate

The `nexi-workflow-contracts` Human VCS Gate applies regardless of provider. Do not run `git add`, `git commit`, `git push`, merge commands, pull request creation commands, branch deletion commands, or worktree cleanup commands unless the user explicitly asks for that VCS write action after reviewing changes.

Read-only Git inspection such as `git status`, `git diff`, `git log`, and `git branch` is allowed. Leave changes unstaged and uncommitted in final delivery, and report changed files, verification results, skipped checks, residual risk, and any suggested commit message.

When the installed provider is `superpowers`, this runtime constrains upstream VCS instructions without editing provider skills. If `subagent-driven-development`, implementer subagents, `executing-plans`, or `finishing-a-development-branch` ask to commit, push, merge, create a pull request, delete a branch, or clean up a worktree, reinterpret that instruction as verify, summarize the diff, and stop for developer review. If a finishing menu is reached, keep the branch as-is unless the user explicitly requests another option.
```

- [ ] **Step 3: Run focused content tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: contract, runtime, and provider no-overlay tests pass.

## Task 5: Refresh Registry Artifacts

**Files:**
- Modify: `dist-registry/index.yaml`
- Modify: affected `dist-registry/packages/*.tgz` archives for changed contract and variant packages.

- [ ] **Step 1: Rebuild registry output**

Run:

```bash
npm run build:registry
```

Expected: registry build completes and refreshes package artifacts for changed managed skill content.

- [ ] **Step 2: Inspect artifact scope**

Run:

```bash
git status --short dist-registry
```

Expected: changes should include `dist-registry/index.yaml` and archives for `contract-nexi-workflow-contracts`, `variant-backend-java`, `variant-frontend-react`, `variant-mobile-android`, and `variant-mobile-ios`. If unrelated package archives change, inspect why before proceeding.

## Task 6: Full Verification And Review Handoff

**Files:**
- No new files beyond prior tasks.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation succeeds.

- [ ] **Step 3: Final diff review**

Run read-only Git inspection:

```bash
git status --short
git diff -- src/agents-md/block.ts packages/contract/nexi-workflow-contracts/skill/SKILL.md packages/variant/backend-java/runtime/SKILL.md packages/variant/frontend-react/runtime/SKILL.md packages/variant/mobile-android/runtime/SKILL.md packages/variant/mobile-ios/runtime/SKILL.md tests/unit/lockfile-agents.test.ts tests/unit/package-content.test.ts tests/integration/install-sync.test.ts
```

Expected: no provider files under `packages/provider/` are modified. The diff contains only the policy, tests, generated registry artifacts, and the design/plan documents.

- [ ] **Step 4: Review checkpoint**

Report the changed files, tests run, skipped checks, registry artifacts refreshed, and any residual risk. Leave all changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.
