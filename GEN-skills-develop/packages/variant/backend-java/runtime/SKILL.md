---
name: nexi-backend-java-runtime
description: Nexi runtime workflow for backend Java repositories.
---

# Nexi Backend Java Runtime

## Entry Point

Use this runtime for backend Java implementation, debugging, testing, review, and maintenance work. Begin with `nexi-workflow-contracts` so command discovery, test design, traceability, and residual risk are handled consistently.

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

`backend-service-implementation-kit` is installed with this runtime for service-layer implementation details. Use it when work touches reactive service methods, REST request generators, facade/service orchestration, mapper behavior, JPA wrapping, downstream clients, or backend data-operation patterns.

`backend-controller-implementation-kit` is installed with this runtime for controller and endpoint entry-point implementation. Use it when work touches thin controller orchestration, facade request generation, enrichers, response mappers, `AdapterFactory` resolution, or `Mono<ResponseEntity<T>>` endpoint behavior.

`backend-deployment-management` is installed with this runtime for documented backend deployment, rollout, refresh, release, Argo CD sync, Jenkins deployment pipeline, and deployment documentation work. Use repository-owned deployment docs, helper scripts, and pipeline definitions as the source of truth.

`backend-jenkins-build` is installed with this runtime for triggering, dry-running, monitoring, and collecting logs for backend Jenkins builds. Use it when the task asks to validate Jenkins parameters, inspect recent runs, trigger a job, or report build results.

`backend-jenkins-build-script` is installed with this runtime for creating or maintaining repository-local automation that triggers Jenkins builds. Use it when work touches build helper scripts, dry-run output, queue polling, build log streaming, node selection, or Jenkins REST/CLI transport fallback.

`backend-postman-flow-tests` is installed with this runtime for creating backend Postman flow-test environments and collections from repository testing documentation. Use it when the task asks to prepare flow-specific Postman assets, wire prerequisite calls, or preserve token propagation.

`backend-run-collection` is installed with this runtime for running backend Postman collection tests with the Postman CLI. Use it when the task asks to run, verify, or inspect API test suites after backend changes.

## Backend Dependency Boundaries

Do not satisfy missing collaborator, DTO, client, mapper, facade, service, or generated-contract types by creating code in dependency libraries. Treat dependency libraries, generated clients, shared artifacts, and other repositories as external contracts unless the user explicitly includes them in scope.

When using the Superpowers provider, this backend runtime constrains brainstorming, writing-plans, executing-plans, and subagent-driven-development. Apply provider completeness rules only to repository-owned code and documented local test doubles. Do not follow reflective expansion into dependency-library implementation details.

Before planning or implementing backend Java changes, identify which module owns each required interface or DTO. Reuse existing repository-owned types when they are present. For missing or unverifiable dependency contracts, record the owner, expected contract shape, and blocked verification instead of inventing classes or methods.

Ask for confirmation only when the dependency boundary blocks the requested implementation or test evidence. If the boundary does not block current-repository work, proceed with a documented assumption and residual risk.

## Command Discovery

Perform command discovery from `build.gradle`, `build.gradle.kts`, `settings.gradle`, `pom.xml`, Maven wrapper, Gradle wrapper, Makefiles, Docker Compose files, CI config, and README files. Record build, unit test, integration test, API contract test, static analysis, local service startup, database migration, and packaging commands.

Prefer `./gradlew` or `./mvnw` when wrappers exist. If both Gradle and Maven appear, identify the active module from CI and project layout before running commands.

## Test Design Before TDD

Write test design before automated TDD. Map requirements to unit tests for pure services, integration tests for persistence and messaging boundaries, controller tests for HTTP behavior, and API contract tests for externally consumed request/response contracts.

Use `nexi-workflow-contracts` templates when no repository-specific format exists.

## Variant Testing Guidance

For service logic, prefer fast unit tests. For controllers, verify status codes, validation, error bodies, headers, and serialization. For persistence, use repository-approved integration tooling such as Testcontainers, embedded databases, or configured test profiles. For public or partner-facing APIs, add or update API contract coverage and note compatibility risk.

Run Gradle or Maven verification commands that correspond to the affected module. If the repository separates unit and integration tasks, run the narrow affected task first and the aggregate verification before final delivery when feasible.

## Manual Tester Output

Provide manual tester scenarios for API behavior that cannot be fully automated, environment-specific integrations, batch jobs, or operational checks. Include endpoint or job name, setup data, request examples, expected response or side effect, log signals, and cleanup.

## Traceability And Final Delivery

Maintain traceability from requirement to service/controller/repository area, automated tests, API contract checks, command output, manual tester scenarios, and residual risk. Final delivery must include verification-before-completion evidence.

## Blockers And Residual Risk

If credentials, databases, message brokers, Docker, Gradle, Maven, or downstream services are unavailable, record the blocked command and residual risk. Use the next strongest local verification and state what remains unverified.
