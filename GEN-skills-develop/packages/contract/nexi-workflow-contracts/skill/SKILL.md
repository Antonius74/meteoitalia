---
name: nexi-workflow-contracts
description: Shared Nexi workflow contracts for command discovery, test design, traceability, and final delivery.
---

# Nexi Workflow Contracts

Use this contract at the start of implementation, debugging, testing, review, and maintenance work. Runtime skills add platform details, but this skill owns the shared evidence and reporting expectations.

## Command Discovery

Create a command discovery record before changing behavior. Inspect repository documentation, package/build files, CI config, scripts, and existing test commands. Record install, build, lint, unit, integration, e2e, run, and validation commands with the source file or documentation that proves each command.

If no command is available for a level, record that as a blocker or residual risk. Do not invent commands or assume a framework command exists without repository evidence.

## Human VCS Gate

Apply this gate to every provider workflow, runtime skill, contract, and utility installed by `nd-gen-skills`.

Do not automatically run `git add`, `git commit`, `git push`, VCS write operations such as `git merge`, `git rebase`, or `git cherry-pick`, pull request creation commands, branch deletion commands, or worktree cleanup commands. A VCS write action is allowed only after the user explicitly asks for that VCS write action.

Read-only Git inspection is allowed. You may run commands such as `git status`, `git diff`, `git log`, and `git branch` to understand repository state and report changes.

Implementation, verification, review, and file edits may proceed normally. By default, final delivery must leave changes unstaged and uncommitted, and must report changed files, verification results, skipped checks, residual risk, and any suggested commit message. If the user explicitly requested a VCS write action, final delivery must instead report the VCS action taken and the resulting repository state.

## Test Design Before TDD

Write a test design before automated TDD begins. Capture the requirement, acceptance criteria, risk, proposed automated level, expected fixtures, and manual tester coverage. Use `templates/test-design.md` when a repository has no existing format.

The test design must make e2e applicability explicit. If e2e tests are skipped, explain why and identify the next best verification level.

## Automated Tests

Prefer the smallest automated test that proves the behavior. Use unit tests for pure behavior, integration tests for module boundaries, API or contract tests for service boundaries, and e2e tests only when user-visible workflow confidence requires the full stack.

When Superpowers test-driven-development applies, follow its red-green-refactor sequence after the test design exists. Keep test names tied to the requirement and avoid testing implementation details.

## E2E Applicability

Assess e2e applicability for every user-facing or cross-boundary change. Consider production risk, frequency of use, known fragile integrations, available tooling, data setup, execution time, and CI support.

Record the decision as one of: required, useful but deferred, not applicable, or blocked. Include the verification substitute and residual risk for any non-required or blocked decision.

## Manual Tester Scenarios

Provide manual tester scenarios when automated coverage is incomplete, user workflows changed, visual behavior changed, device/browser coverage matters, or an external dependency prevents automated execution.

Each manual tester scenario must include setup, steps, expected result, data or environment needs, and cleanup. The phrase manual tester should appear in the final delivery when manual coverage is required.

## Traceability

Maintain traceability from each requirement or ticket acceptance criterion to one or more tests, manual scenarios, and verification commands. Use `templates/traceability.md` when a repository has no existing format.

Traceability must identify uncovered requirements and explain whether the gap is accepted, blocked, deferred, or requires follow-up work.

## Final Delivery

Final delivery must include changed behavior, automated tests run, manual tester output when applicable, traceability status, skipped verification, and residual risk.

Do not claim completion until verification-before-completion has been used and fresh command output supports the claim.

## Skipped Verification And Residual Risk

Skipped verification is allowed only when there is a concrete blocker such as missing credentials, unavailable simulator, missing service dependency, excessive runtime, or unsupported local tooling.

For each skipped check, record the command or scenario, why it was skipped, the residual risk, and the owner or next step needed to close it.
