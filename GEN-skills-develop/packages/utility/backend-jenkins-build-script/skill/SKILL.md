---
name: backend-jenkins-build-script
description: "Create or maintain backend Jenkins build automation scripts from repository-local Jenkins documentation."
---

# Jenkins Build Script

Use this skill to build or maintain automation code that triggers Jenkins builds from local repositories.

## Workflow

1. Read every relevant repository-local Jenkins document at `docs/JENKINS_BUILD.md`.
2. Treat those documents as the project-specific contract.
3. Keep the script generic:
   - accept repository, branch, and build parameters as inputs
   - avoid hardcoding transient branch names or one-off examples
   - centralize repository-specific mappings in data structures or repo-local documentation
4. Implement a safe preflight phase:
   - validate required inputs
   - validate constrained values such as profile or module selections
   - confirm repo-local file structure for profile or module combinations when applicable
   - derive node selection from documented rules, often by reading the target branch POM
5. Implement an inspection phase for dry-runs:
   - resolve the owning repo
   - resolve the target job
   - resolve final Jenkins parameters
   - print the exact plan without triggering Jenkins
6. Implement an execution phase:
   - authenticate via environment variables or approved local secret sources
   - trigger Jenkins through the project-approved transport
   - wait for queue assignment
   - track the build URL or number
   - stream or collect console output until completion
7. Prefer REST over CLI when:
   - CLI transport is unstable behind proxies or certificates
   - the project has already proven REST works
8. Update the repo-local Jenkins documentation when code changes uncover stale contracts.

## Script Design Rules

- Keep transport details replaceable. A helper that separates validation, trigger, queue polling, and log streaming is easier to maintain.
- Fail early on invalid inputs with concrete error messages.
- Never store credentials in the script or in committed files.
- Support a dry-run mode for safe verification.
- Print resolved parameters before execution so humans can inspect them easily.
- Preserve cross-platform behavior where practical, and isolate OS-specific credential fallbacks.

## Expected Repo Documentation

Expect each participating repository to provide `docs/JENKINS_BUILD.md` containing:

- job identifiers
- parameter definitions and choices
- recent successful examples
- node selection rules
- repo-local validation expectations
- transport notes such as REST vs CLI limitations

If the script requires project knowledge that is not in those docs, update the docs first and then update the script.
