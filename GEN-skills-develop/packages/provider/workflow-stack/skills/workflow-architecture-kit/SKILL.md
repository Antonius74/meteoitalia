---
name: workflow-architecture-kit
description: Produce implementation plans and API handoff artifacts from approved requirements.
---

# Architecture Skill — Requirements → Implementation Plan

## Purpose
Translate every REQ-xxx into a concrete, ordered sequence of file-level changes
that the Developer agent can execute without ambiguity. The plan is
technology-neutral in structure; the content follows whatever stack, platform,
and project type the repository already uses. For backend API work, also
produce an API contract handoff artifact that frontend and mobile architecture
skills can consume. `requirements.md` is the primary input, but additional supporting documentation may also be provided where relevant to clarify
boundaries, constraints, integrations, or implementation expectations. Use
those supporting documents to refine the plan, not to replace or contradict the
approved requirements.

Supported additional inputs may include repository or local documentation such
as `ARCHITECTURE.md`, `docs/WORKFLOW.md`, boundary `README.md` files, ADRs,
API/interface contracts, migration or operational notes, and other bounded
technical documents explicitly provided for the workflow run. When a supporting
document materially affects an implementation step, preserve traceability back
to both the relevant `REQ-xxx` and that supporting source.

## Quickstart
The orchestrator provides `--workflow-dir` as the run-specific directory. Scaffold an empty
`implementation-plan.md` pre-populated with requirement IDs:
```bash
python ./scripts/init_architecture.py \
    --workflow-dir <run_dir>
```

For backend architecture runs, scaffold the API handoff artifact at the same
time:
```bash
python ./scripts/init_architecture.py \
    --workflow-dir <run_dir> \
    --include-api-contract
```

## Progress Reporting
When this skill is run by the workflow orchestrator, emit progress messages
exactly in this format after each numbered step:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Use `M = 7` for this skill's Step-by-Step Process. Emit `[DONE]` only after
`implementation-plan.md` and any required `api-contract.md` are written to their
`artifacts.*` paths and unresolved risks are prepared for Gate 2 review.

## Architecture Reasoning Discipline
Use the installed `grill-me` skill as a required part of architecture reasoning
before finalizing the execution plan in `implementation-plan.md`. Treat it as
the architecture agent's adversarial questioning pass: walk the
requirement-to-component mapping, candidate file-level steps, dependency order,
interfaces, error cases, constraints, and implementation assumptions through
one focused question at a time.

Answer any question that can be resolved from `requirements.md`, explicitly
provided supporting documentation, or repository/codebase context. Capture only
genuinely unresolved issues in Risks & Assumptions for Gate 2 human review in
the draft plan.

This reasoning pass is core to the architecture workflow, not optional polish.
It improves correctness by forcing hidden dependencies, missing interfaces,
invalid sequencing, unclear ownership boundaries, and invented implementation
details to be exposed before handoff.

## How to use functional-requirement.md

- The `functional-requirement.md` file is a supported additional source when it
  is explicitly provided and relevant to the current backend project.
- Use `functional-requirement.md` to understand the functional requirements of
  the requested development and to capture any open points, assumptions, or
  decisions still needing clarification.
- Treat `functional-requirement.md` as a functional input document: it helps
  define expected behaviors, business rules, user-visible outcomes, process
  constraints, and unresolved questions that may affect implementation.
- Extract only what the document states explicitly. If parts are ambiguous,
  incomplete, or conflict with Jira or other approved sources, record the issue
  in Open Questions instead of resolving it implicitly.
- Preserve traceability by citing `functional-requirement.md` whenever a
  requirement, assumption, or open point is derived from that file.

## Step-by-Step Process

### 1 — Read Workflow State, Requirements, Documentation, and Codebase
Use the `--workflow-dir` provided by the orchestrator. Note
`artifacts.requirements`, `artifacts.implementation_plan`, and, when present,
`artifacts.api_contract` from `<run_dir>/workflow-state.yml`.

Then read `README.md` at the repository root. It defines:
- Language, runtime version, and platform (backend, mobile, frontend, etc.)
- Project module/package/folder structure and naming conventions
- Build tool and compile/run commands
- Coding standards and patterns to follow

Then read any additional supporting documentation explicitly provided for the
run or governing the impacted boundary, especially:
- repository `ARCHITECTURE.md`
- `docs/WORKFLOW.md` or local workflow documents
- local boundary `README.md` files
- formal contracts such as API specs, schemas, or interface documents
- ADRs, migration notes, or operational constraints relevant to the change

Then explore the existing source tree to understand folder layout, naming
conventions, and any existing patterns you must conform to.

Use supporting documents to clarify constraints, integration boundaries,
contracts, and sequencing. Do not let them override the approved requirements;
if a supporting document conflicts with `requirements.md`, record that conflict
under Risks & Assumptions for Gate 2 human resolution.

### 2 — Map Requirements → Components
For each REQ-xxx in `artifacts.requirements`, identify which modules or units of
the project are affected. Use only the abstractions and layer names the project
already uses — do not invent new ones.

### 3 — Define Implementation Steps
Write one step per file to create or modify. Each step must describe the work
in enough detail that a developer can implement it without asking questions.

**A complete step description must include all of the following that apply:**

- **Responsibility** — what this module does; its single, well-defined purpose
- **Public interface** — every function, method, class, or symbol to add or
  change, with its name, parameters (names and types), return type, and a
  one-sentence description of what it does
- **Internal logic** — the key algorithm, rules, or processing steps the
  implementation must follow
- **Dependencies** — what this module imports or calls, and how
- **Error cases** — which error types to raise or return, and under what conditions
- **Constraints** — naming rules, validation rules, or any invariants that must hold

Omit only sections that genuinely do not apply.

### 4 — Order Implementation Steps
Sort steps so every dependency is satisfied before it is used. The principle is
that no step may depend on a step that comes after it.

### 5 — Identify Risks and Assumptions
Before writing the final plan, compile a Risk & Assumptions table:
- **Risks** — anything that could cause the implementation to fail or require rework
- **Assumptions** — decisions made where the requirement left room for interpretation
- **Mitigations** — concrete actions that reduce each risk

### 6 — Prepare Risks & Assumptions for Gate 2 Review
Include the Risk & Assumptions table in the draft `implementation-plan.md` with
each unresolved item marked `Awaiting Gate 2 approval`.

Do not create a separate architecture-only human stop before writing the draft
plan. The orchestrator owns Gate 2 and presents the implementation plan together
with the test-design artifact for explicit approval.

### 7 — Fill `implementation-plan.md`
Use `../workflow-core-kit/templates/skills/shared/implementation-plan-template.md`.
See `examples/example-implementation-plan.md` for the expected structure.
Write the output to the path at `artifacts.implementation_plan` in
`<run_dir>/workflow-state.yml` — never to the project root.

For backend architecture runs, also fill `api-contract.md` using
`../workflow-core-kit/templates/skills/shared/api-contract-template.md`. Write it to
the path at `artifacts.api_contract` in `<run_dir>/workflow-state.yml`. If the
backend requirements do not change any API behavior, still fill the artifact and
mark the summary as `No API-impacting changes identified`.

Frontend and mobile architecture runs must not create or regenerate
`api-contract.md`. They must read `artifacts.api_contract` when the file exists
or when an `api-contract.md` is explicitly provided, then use it as backend
handoff input for client, state, screen, and error-behavior planning. If no API
handoff is available, do not state that the artifact is globally unnecessary;
state only that no frontend/mobile output artifact is required, and record an
open question when API behavior cannot be planned from the available inputs.

## Verification Checklist
Run through every item before handing the plan to the orchestrator for Gate 2 approval:

- [ ] `--workflow-dir` was received from the orchestrator and `artifacts.*` paths are confirmed
- [ ] Backend architecture runs wrote `artifacts.api_contract`; non-API backend runs explicitly recorded no API impact
- [ ] Frontend/mobile architecture runs did not create `api-contract.md` and consumed an existing one when present
- [ ] Every REQ-xxx is covered by at least one implementation step
- [ ] Every step specifies the full file path relative to the project root
- [ ] Every step specifies whether the file is CREATE or MODIFY
- [ ] Every step includes: responsibility, public interface, internal logic, dependencies, error cases, and constraints (where applicable)
- [ ] Modified files list only the functions/methods being changed, not the whole file
- [ ] Steps are ordered so no step depends on a later step
- [ ] New external dependencies are listed with their purpose
- [ ] Any supporting documentation used is explicitly traceable where it materially affects the plan
- [ ] The `grill-me` reasoning pass was used to stress-test component mapping,
      file-level steps, dependency order, interfaces, and unresolved architecture
      questions before final plan approval
- [ ] Risks & Assumptions are recorded in the draft plan for Gate 2 approval
- [ ] Traceability matrix at the end maps every REQ-xxx to its implementing steps
- [ ] No implementation detail assumes a specific language or framework beyond what README.md defines
- [ ] No implementation detail was invented beyond the approved requirements and any explicitly used supporting source material

## Implementation alignment

For each planned change, map it to the closest existing pattern in the repository.

For every task item, state:
- the analogous file, feature, module, or boundary in the codebase
- the existing helper, lifecycle abstraction, adapter, service, state flow,
  validation utility, or pattern that should be reused
- any required deviation from the existing pattern

Do not propose a new implementation pattern when an existing one is already present.
Prefer the smallest change that preserves the repository's current architecture.
If a planned approach would introduce a new pattern, mark it as a deviation and move it to a separate note.
