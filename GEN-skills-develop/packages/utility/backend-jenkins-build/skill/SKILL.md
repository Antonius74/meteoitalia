---
name: backend-jenkins-build
description: "Trigger, verify, and monitor backend Jenkins builds from repository-local Jenkins documentation."
---

# Jenkins Build

Use this skill to operate Jenkins builds safely and repeatably while keeping repository-specific details outside the skill.

## Workflow

1. Identify code changes and the owning repository for the requested build.
2. Read the repository-local Jenkins document at `docs/JENKINS_BUILD.md`.
3. Use that document as the source of truth for:
   - job paths or URLs
   - required and optional parameters
   - profile or module constraints
   - node selection rules
   - known transport constraints such as REST vs CLI
4. If the document is missing or stale, verify the live Jenkins contract before building:
   - inspect Jenkins parameter definitions
   - inspect recent successful runs for real examples
   - inspect repository build files if node or profile selection depends on source code
   - update the repo-local Jenkins document before relying on the new findings
5. Validate requested inputs before triggering the build:
   - confirm required parameters are present
   - reject unsupported profile or module values
   - confirm the local repository layout supports the requested combination when that is relevant
   - determine the Jenkins node from the documented rule, often by inspecting the target branch POM
6. Prefer non-interactive automation:
   - use a checked-in build helper script if the project provides one
   - otherwise use a stable Jenkins transport such as REST
   - avoid browser automation unless the repository documentation explicitly requires it
7. When running a build:
   - show the resolved parameter set first
   - support a dry-run path when possible
   - trigger the build
   - wait for queue assignment
   - poll until completion
   - stream or collect console logs
8. Summarize the result with:
   - build number or URL
   - resolved parameters
   - final status
   - important warnings or follow-up actions

## Guardrails

- Always build dependencies first (e.g. if module A depends on module B, build first module B and then A)
- Treat credentials as external configuration. Read them from environment variables or project-approved local secret storage, never from committed files.
- When Jenkins CLI is unreliable, prefer the repository-approved fallback documented in the repo-local Jenkins document.

## Expected Repo Documentation

Expect the target repository to provide `docs/JENKINS_BUILD.md` with at least:

- pipeline purpose
- Jenkins job path or URL
- verified parameter list with defaults and choices
- parameter selection rules
- local validation rules, if any
- execution notes such as certificate or auth constraints

If any of those are missing, ask the user for missing details and update the document as part of the task.
