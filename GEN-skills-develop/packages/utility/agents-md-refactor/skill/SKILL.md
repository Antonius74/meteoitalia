---
name: agents-md-refactor
description: Use when refactoring AGENTS.md files, shrinking root agent instructions, splitting repository guidance into linked markdown files, or auditing agent instructions for contradictions, vague rules, redundancy, and progressive disclosure.
---

# AGENTS.md Refactor

Refactor `AGENTS.md` files to follow progressive disclosure: keep the root file short, universal, and navigational, then move task-specific guidance into linked markdown files.

When the target repository uses another root agent instruction file, such as `CLAUDE.md`, apply the same workflow to that file and name linked instruction files according to the repository's existing convention.

## Workflow

1. **Find contradictions**
   - Read the target `AGENTS.md`, or equivalent root instruction file such as `CLAUDE.md`, and any existing linked instruction files.
   - Identify instructions that conflict in scope, priority, command usage, test expectations, allowed edits, or workflow behavior.
   - For each contradiction, ask the user which version to keep before rewriting files.
   - Do not silently merge conflicting instructions unless one version is clearly obsolete from repository evidence.

2. **Identify the essentials**
   Keep only these items in the minimal root `AGENTS.md`:
   - One-sentence project description.
   - Package manager, only when it is not `npm`.
   - Non-standard build, typecheck, test, install, or generated-artifact commands.
   - Instructions truly relevant to every single task in the repository.
   - Markdown links to the detailed instruction files.

3. **Group the rest**
   Move remaining actionable instructions into logical markdown files. Common groups:
   - Language or framework conventions.
   - Testing patterns and required commands.
   - Architecture or API design boundaries.
   - Git, commit, pull request, and review workflow.
   - Tooling, generated files, dependency boundaries, or deployment notes.

4. **Create the file structure**
   Produce:
   - A minimal root `AGENTS.md` with markdown links to the separate files.
   - Each separate file with only its relevant instructions.
   - A suggested `docs/` folder structure when the repository does not already have a better place for agent guidance.

5. **Flag for deletion**
   Report instructions that should be removed because they are:
   - Redundant with normal agent behavior.
   - Too vague to be actionable.
   - Overly obvious, such as "write clean code."
   - Duplicated across files without adding useful local context.

## Root AGENTS.md Rules

- Prefer fewer than 15 lines when possible.
- Use links instead of embedding full standards.
- Keep repository-wide constraints above links.
- Make linked paths relative to the root `AGENTS.md`.
- Do not include task-specific examples unless every task needs them.

## Detailed File Rules

- Use `docs/agents/` for new instruction files unless the repository already has a clear local convention.
- Name files by durable topic, such as `docs/agents/typescript.md`, `docs/agents/testing.md`, or `docs/agents/git-workflow.md`.
- Keep each file focused on one category.
- Preserve actionable local details, exact commands, forbidden paths, ownership boundaries, and workflow exceptions.
- Remove general software-engineering advice that does not change agent behavior.

## Editing Guardrails

- Do not delete instructions immediately when flagging them for deletion; list them in the final report unless the user explicitly asked for deletion.
- Do not edit provider-managed, generated, or upstream instruction files unless the repository explicitly owns them.
- If existing `AGENTS.md` links to nested agent instruction files, preserve useful nesting and update links instead of flattening everything.
- If a contradiction blocks the rewrite, ask the required question and stop before editing affected files.

## Final Report

After the rewrite, summarize:
- Root `AGENTS.md` essentials kept.
- New or updated instruction files.
- Contradictions resolved by user choice or repository evidence.
- Instructions flagged for deletion and why.
