---
name: nexi-mobile-android-runtime
description: Nexi runtime workflow for mobile Android repositories.
---

# Nexi Mobile Android Runtime

## Entry Point

Use this runtime for Android implementation, debugging, testing, review, and maintenance work. Start with `nexi-workflow-contracts` and discover Gradle modules, build variants, flavors, and emulator requirements before editing code.

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

`mobile-android-layout-inspector` is installed with this runtime for live Android UI evidence. Use it when a task needs screenshots, UI dumps, Android Studio Layout Inspector snapshots, Compose or View hierarchy inspection, scroll capture, or emulator/device state verification.

## Command Discovery

Perform command discovery from `settings.gradle`, `settings.gradle.kts`, module `build.gradle` files, `gradlew`, version catalogs, Fastlane files, CI config, and README files. Record bootstrap, assemble, lint, JVM unit test, instrumented test, connected Android test, static analysis, and relevant app run commands.

Identify affected modules, flavors, build types, and whether the project uses Android Views, Jetpack Compose, Kotlin Multiplatform, or shared modules. Prefer `./gradlew` when present.

## Test Design Before TDD

Write test design before automated TDD. Map requirements to JVM unit tests, Robolectric tests when used, repository integration tests, Compose or View UI tests, Espresso flows, and manual tester scenarios.

Use `nexi-workflow-contracts` templates when no repository-specific artifact exists.

## Variant Testing Guidance

Prefer JVM tests for pure logic and view models. Use Robolectric or Compose UI tests where the repository already supports them. Use Espresso or UIAutomator for critical user flows that need device behavior, permissions, navigation, or platform services. Run instrumented tests on an emulator only when available and justified by risk.

For UI changes, verify layout behavior across representative screen sizes, dark mode, localization, accessibility labels, and configuration changes when relevant.

## Manual Tester Output

Provide manual tester scenarios for device-only features, unavailable emulator coverage, push notifications, deep links, biometrics, camera, NFC, payment, accessibility review, or store-release constraints. Include device or emulator, Android version, build variant, setup data, steps, expected result, and cleanup.

## Traceability And Final Delivery

Maintain traceability from requirement to Android module, automated tests, Espresso or emulator verification, manual tester scenarios, and command output. Final delivery must include verification-before-completion evidence and skipped checks.

## Blockers And Residual Risk

If Gradle, Android SDK, emulator, credentials, signing, dependency resolution, or device access is unavailable, record the blocker and residual risk. Use the strongest available local verification and state what remains unverified.
