---
name: nexi-mobile-ios-runtime
description: Nexi runtime workflow for mobile iOS repositories.
---

# Nexi Mobile iOS Runtime

## Entry Point

Use this runtime for iOS implementation, debugging, testing, review, and maintenance work. Start with `nexi-workflow-contracts` and discover the repository's Xcode, Swift Package Manager, CocoaPods, or Tuist conventions before changing code.

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

## Command Discovery

Perform command discovery from `.xcodeproj`, `.xcworkspace`, `Package.swift`, `Podfile`, `Project.swift`, Fastlane files, CI config, and README files. Record install/bootstrap, build, unit test, UI test, lint, format, simulator destination, and archive commands.

Identify schemes, configurations, destinations, and whether commands require `xcodebuild`, Fastlane, or repository scripts. Do not assume a simulator destination until it is discovered or listed locally.

## Test Design Before TDD

Write test design before automated TDD. Map requirements to XCTest unit tests, view model tests, snapshot tests where already used, integration tests for persistence/network abstractions, and UI tests for critical user flows.

Use `nexi-workflow-contracts` templates if the repository has no existing test design artifact.

## Variant Testing Guidance

Prefer fast XCTest coverage for business logic, formatting, validation, and state transitions. Use UI tests only for workflows where the simulator and app target are available and the risk justifies runtime cost. When network or platform services are involved, prefer injectable clients and deterministic fixtures.

For visual or interaction changes, verify device class, orientation, accessibility labels, dynamic type impact, and localization constraints when relevant.

## Manual Tester Output

Provide manual tester scenarios for device-only features, unavailable simulator coverage, push notifications, deep links, biometrics, camera, payment, accessibility review, or release-signing constraints. Include device or simulator, OS version, setup data, steps, expected result, and cleanup.

## Traceability And Final Delivery

Maintain traceability from requirement to iOS module, XCTest or UI test, simulator verification, manual tester scenarios, and final command output. Final delivery must cite verification-before-completion evidence and skipped checks.

## Blockers And Residual Risk

If Xcode, simulator runtime, signing, provisioning, dependencies, or test devices are unavailable, record the blocker and residual risk. Use the strongest available build or unit verification and state what remains unproven.
