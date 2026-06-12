---
name: nexi-frontend-react-runtime
description: Nexi runtime workflow for frontend React repositories.
---

# Nexi Frontend React Runtime

## Entry Point

Use this runtime for React implementation, debugging, testing, review, and maintenance work. Begin by loading `nexi-workflow-contracts` and preserve any existing repository workflow conventions unless they conflict with explicit user instructions.

## Provider Workflow

Use the provider recorded in `.agents/nd-gen-skills.lock.yaml` or `.claude/nd-gen-skills.lock.yaml`.

If the installed provider is `superpowers`, use the installed Superpowers skills for requirements design, planning, execution, TDD, debugging, verification, review, and finishing. Keep provider artifacts in their native locations and do not rewrite provider guidance.

If the installed provider is `workflow-stack`, use `workflow-orchestration-kit` for full multi-phase delivery coordination. For individual phases, use `workflow-planning-kit` for requirements, `workflow-architecture-kit` for implementation planning, `workflow-test-design-kit` for test backlog design, and `workflow-development-kit` for implementation and fix loops. Use `workflow-us-quality-assessment-kit` before planning when functional readiness is uncertain.

Provider workflow skills define their own gates and artifacts. This runtime adds platform-specific command discovery, testing, manual tester output, traceability, and residual-risk expectations.

## Human VCS Gate

The `nexi-workflow-contracts` Human VCS Gate applies regardless of provider. Do not run `git add`, `git commit`, `git push`, VCS write operations such as `git merge`, `git rebase`, or `git cherry-pick`, pull request creation commands, branch deletion commands, or worktree cleanup commands unless the user explicitly asks for that VCS write action after reviewing changes.

Read-only Git inspection such as `git status`, `git diff`, `git log`, `git branch`, and `git merge-base` is allowed. Leave changes unstaged and uncommitted in final delivery by default, and report changed files, verification results, skipped checks, residual risk, and any suggested commit message. If the user explicitly requested a VCS write action, report the VCS action taken and the resulting repository state.

When the installed provider is `superpowers`, this runtime constrains upstream VCS instructions without editing provider skills. If any Superpowers skill, including `brainstorming`, `writing-plans`, `using-git-worktrees`, `subagent-driven-development`, implementer subagents, `executing-plans`, or `finishing-a-development-branch`, asks to stage, commit, push, merge, rebase, cherry-pick, create a pull request, delete a branch, or clean up a worktree, reinterpret that instruction as verify, summarize the diff, and stop for developer review. If a finishing menu is reached, keep the branch as-is unless the user explicitly requests another option.

## Runtime Utilities

`grill-me` is installed with this runtime as the planning support stream. Use it whenever provider guidance or user intent calls for planning or brainstorming: stress-test the plan, ask the user one question at a time when the answer cannot be discovered from the codebase, and include your recommended answer.

`read-jira-issue` is installed with this runtime for Jira evidence collection. Use it whenever Jira issue keys, stories, epics, bugs, subtasks, or linked delivery tickets are part of the task. Jira access through this utility is read-only: do not comment, edit fields, transition issues, create links, update worklogs, or mutate Jira in any way.

For Jira-driven brainstorming or planning, requested Jira issue keys define the default functional scope. Linked issues are dependency context, not delivery scope. Do not let linked issue requirements enter provider designs, plans, test cases, or implementation tasks unless the user explicitly includes those keys or approves scope expansion.

## Superpowers Artifact Naming

When the installed provider is `superpowers`, this runtime overrides the default date-based Superpowers artifact filename only for Jira-backed work. If a provided Jira story has a parent Epic, use the Epic issue key as the artifact filename prefix while keeping a short topic slug:

- Specs: `docs/superpowers/specs/<EPIC-KEY>-<topic>-design.md`
- Plans: `docs/superpowers/plans/<EPIC-KEY>-<topic>.md`

If multiple provided Jira stories share one Epic, use that Epic key. If provided stories belong to different Epics, use the explicit story keys or another user-approved scope slug instead of choosing one Epic. If no Epic is provided or discoverable, keep the Superpowers default date-based filename.

`figma-use` is installed with this runtime for Figma inspection workflows. Use it only when Figma evidence is part of the task and keep Figma access read-only unless the user explicitly asks for Figma write operations.

`frontend-react-e2e-test-implementation` is installed with this runtime for implementing one Playwright scenario from selected `TC-E2E-*` cases. Use it when the task is to convert approved browser test cases into executable React E2E coverage, especially when basename-safe routing, deterministic OTP completion, accessibility checks, and requirement traceability matter.

## Command Discovery

Perform command discovery from `package.json`, lockfiles, framework config, test config, Storybook config, Playwright config, CI files, and README files. Record package manager, install command, dev server command, lint, typecheck, unit test, component test, browser e2e, and production build commands.

If the repository has multiple apps or workspaces, identify the affected package and run commands from the correct workspace. Do not assume `npm` when the lockfile indicates another package manager.

## Test Design Before TDD

Write test design before automated TDD. Map each changed React behavior to a unit, component, integration, or Playwright e2e test. Include accessibility, state transitions, loading/error/empty states, responsive behavior, and data-fetching boundaries when relevant.

Use `nexi-workflow-contracts` templates when the repository has no established artifact format.

## Variant Testing Guidance

Prefer React Testing Library or the repository's existing component test stack for component behavior. Use integration tests for routing, stores, data clients, and service adapters. Use Playwright or an equivalent browser tool for flows that depend on routing, browser APIs, focus management, viewport behavior, authentication redirects, or real user navigation.

For visual changes, verify at desktop and mobile widths when practical. Check that UI text does not overflow, interactive states are reachable, and browser console errors are treated as defects unless the repository already documents them.

## Manual Tester Output

Provide manual tester scenarios for flows not covered by automated tests, device/browser combinations that cannot run locally, third-party integrations, or visual review. Include viewport, browser, test data, steps, expected result, and cleanup.

## Traceability And Final Delivery

Maintain traceability from requirement to React component or route, automated tests, Playwright or browser verification, manual tester scenarios, and final commands. Final delivery must include tests run, skipped checks, and evidence from verification-before-completion.

## Blockers And Residual Risk

If install, dev server, Playwright browsers, credentials, fixtures, or external services are unavailable, stop the affected verification path and record the blocker with residual risk. Use the next strongest available verification and identify what remains unproven.
