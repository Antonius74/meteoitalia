---
name: workflow-development-kit
description: Implement workflow-stack plans through test-driven development and fix loops.
---

# Development Skill - Implementation Plan + Test Cases -> Code

## Purpose
Implement every step in the run's `implementation-plan.md` using the language,
framework, and conventions the project already uses. Development is test-driven:
consume the unit/behavior backlog in `test-cases.md`, implement one `TC-U-xxx`
case at a time, and use red-green-refactor before handing off to later
validation phases.

Also apply targeted fixes when the Unit-Tester or Automation-Test-Runner reports failures.

## Progress Reporting
When this skill is run by the workflow orchestrator, emit progress messages
exactly in this format after each numbered step:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Use `M = 8` for the main development Step-by-Step Process and `M = 7` for a
fix-request cycle. Emit `[DONE]` only after implementation, validation, and
completion reporting are done, or after an explicit blocker is reported.

## Step-by-Step Process

### 1 - Read Workflow State, README.md, and TDD Guidance
Use the `--workflow-dir` provided by the orchestrator. Read `<run_dir>/workflow-state.yml`
and note:
- `artifacts.implementation_plan`
- `artifacts.api_contract` when present
- `artifacts.test_cases`

All workflow file references in subsequent steps use these values.

Then read the repository `README.md` before writing a single line of code. It defines:
- Language and runtime version
- Framework and architectural patterns in use
- Build tool and the exact commands to compile, test, and run the project
- Coding standards, naming conventions, and code organisation rules
- How to add dependencies

Read and apply the installed `tdd` skill. In a workflow-stack run, approved
`requirements.md`, `implementation-plan.md`, and `test-cases.md` satisfy the
TDD planning approval step. Ask the user only when those artifacts conflict,
omit a required public interface, or leave a P0 behavior ambiguous.

If `artifacts.api_contract` is present and the file exists, treat it as an
authoritative API boundary constraint. Use it to verify endpoint, payload,
status/error, compatibility, and consumer mapping details. If it conflicts with
`implementation-plan.md` or `test-cases.md`, stop and report the conflict
instead of guessing.

All implementation decisions must conform to what README.md describes.
When README.md is silent on a convention, match the style visible in existing source files.

### 2 - Read the Implementation Plan and Test Cases
Read `artifacts.implementation_plan`, the output of the Architecture skill.
Understand every step, the dependency order defined by the Architect, and which
`REQ-xxx` each step satisfies.

Read `artifacts.test_cases`. Treat the `TC-U-xxx` Unit / Behavior Test Backlog
as the authoritative TDD driver for development:
- Process cases in `Development order`, starting with `P0` tracer bullets.
- Respect `Depends on` relationships between test cases.
- Use `TC-E2E-xxx` and `TC-M-xxx` cases only as final validation/manual
  readiness context; they are not the normal development TDD loop.

In a workflow-stack run, do not start implementation unless both
`artifacts.implementation_plan` and `artifacts.test_cases` are present and
consistent. In a standalone development run only, if `artifacts.test_cases` is
missing, derive the smallest behavior backlog from the implementation plan and
record that fallback in the completion report.

When `artifacts.api_contract` is available, read it before writing API boundary
code. It constrains behavior, but it does not replace the implementation plan's
file list or the test cases' TDD order.

### 3 - Run One TC-U Red-Green-Refactor Cycle at a Time
For each applicable `TC-U-xxx`:

1. **RED** - Write one executable test through the public interface named in the case.
   Confirm it fails for the expected reason.
2. **GREEN** - Implement the smallest production change needed to pass that test.
   Follow the implementation plan paths and repository conventions.
3. **VERIFY** - Run the focused test and the relevant build/type/lint command from README.md.
4. **REFACTOR** - Refactor only while green. Keep behavior unchanged and rerun the focused test.

Do not write all test files first. Do not implement speculative behavior for later cases.
Do not mock internal collaborators; use doubles only for true system boundaries.

### 4 - Execute Implementation Steps in Plan Order
The implementation plan remains the structural source of truth for files and modules.
Work through the plan sequentially while using the `TC-U-xxx` order to drive behavior.

**For each CREATE step:**
- Write the new file at the exact path specified in the plan
- Follow the naming and structural conventions of existing files in the same directory

**For each MODIFY step:**
- Read the full existing file first
- Apply only the change specified and preserve all other content unchanged
- Add a comment referencing the `REQ-xxx` only if the codebase already uses inline requirement references

### 5 - Handle Development-Discovered Test Gaps
If implementation reveals missing behavior not covered by `test-cases.md`:
- Add the executable test only when it protects an observable behavior.
- Append a matching case to the **Development-discovered Test Cases** section in
  `artifacts.test_cases`.
- Do not rewrite or renumber approved cases.

### 6 - Final Build and Test Verification
After all applicable `TC-U-xxx` cycles pass, run the full build/compile/test command
required by the repository for this change class.

The output must be clean: zero errors and no new warnings introduced by your changes.

Review `TC-E2E-xxx` end-to-end flows and `TC-M-xxx` manual cases and report whether they are:
- ready for automated execution
- ready for manual tester handoff
- blocked by missing dependencies such as backend services, seeded data, devices,
  credentials, or third-party systems

Do not fail development solely because optional E2E dependencies are unavailable.
Record the blocker and substitute validation evidence instead.

### 7 - Document Implemented Code
After verification tests pass, document every public or exported item in each file
you created or modified. Read README.md for the project's documentation conventions
(docstring format, annotation style) and match them exactly.

For each implemented file:
- Write or update a docstring or equivalent annotation for every public function,
  method, class, type, and constant that is missing one
- For non-obvious private logic, add an inline comment explaining the decision

If you added a significant new capability, update the relevant section of README.md
using business language from the requirements.

### 8 - Report Completion
State which implementation steps and `TC-U-xxx` cases were implemented, list the
files created or modified, confirm the build result, confirm all TDD tests pass,
summarize `TC-E2E-xxx` and `TC-M-xxx` readiness, and confirm all new public
items are documented.
Do not report done until those conditions are met or explicitly blocked.

## Handling Fix Requests
When you receive a fix request from the Unit-Tester or Automation-Test-Runner:

1. Read the failure description, the failing test identifier, and the `REQ-xxx` reference
2. Locate the affected file(s)
3. Identify the root cause (logical error, missing guard, wrong error type, etc.)
4. Add or update the smallest behavior-focused test that reproduces the failure
5. Apply the minimal production fix without changing unrelated behaviour
6. Run the focused test and build/compile command to confirm no new errors are introduced
7. Report what file changed, what changed, and why

See `examples/example-fix-request.md` for the expected fix request format.

## Verification Checklist
Before reporting completion to the orchestrator:

- [ ] `--workflow-dir` was received from the orchestrator and `artifacts.*` paths are confirmed
- [ ] `artifacts.implementation_plan` and `artifacts.test_cases` were read
- [ ] `artifacts.implementation_plan` was treated as the Architecture skill output and structural source of truth
- [ ] `artifacts.api_contract` was read when present, and any artifact conflicts were reported before implementation
- [ ] Approved workflow artifacts were used as the TDD planning source
- [ ] All implementation plan steps are implemented or explicitly deferred
- [ ] Every applicable `TC-U-xxx` was processed in development order
- [ ] Each `TC-U-xxx` had a red-green-refactor cycle with a failing test observed first
- [ ] Every new file is at the exact path the plan specifies
- [ ] Modified files preserve all pre-existing content outside the changed section
- [ ] Build/compile/test command exits with zero errors
- [ ] No new warnings were introduced that did not exist before this implementation
- [ ] Development-discovered test gaps were appended to `test-cases.md` without rewriting approved cases
- [ ] `TC-E2E-xxx` and `TC-M-xxx` readiness or blockers are reported for final validation/manual handoff
- [ ] Every created/modified file follows the naming and coding conventions in README.md
- [ ] Every public/exported item in created or modified files is documented
- [ ] Docstring format matches the project's existing style
- [ ] README updated where a new significant capability was added

## Repository coherence gate

Before writing code, inspect the codebase and identify at least 2 analogous implementations for the same kind of change.

Follow this order:
1. Reuse the same architectural path already used in the repo.
2. Reuse existing helpers, lifecycle abstractions, adapters, services, state flows, validation utilities, and patterns.
3. Match naming, file placement, import style, and data flow used by the closest examples.
4. If the repo already has a standard mechanism for a concern, do not introduce a new one.

Hard rules:
- Do not bypass an existing boundary layer such as controllers, adapters, services, repositories, actions, sagas, workers, or clients.
- Do not introduce framework-specific lifecycle or dependency patterns when the repo already uses a different local convention.
- Do not create new instrumentation, logging, validation, mapping, or transport helpers when an existing wrapper already owns that concern.
- Do not invent new abstractions when an existing one can be reused.
- Do not change architecture unless the task explicitly asks for it.

If no clear example exists in the repository, stop and report the gap instead of guessing.

Before finishing, perform a consistency check:
- architecture matches existing patterns
- lifecycle/import/dependency patterns match repo conventions
- existing helpers were reused where applicable
- no new custom path was introduced unnecessarily
- implementation can be explained as a direct extension of an existing pattern
