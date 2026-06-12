# Architecture Template (Shared)

## Purpose
Translate approved requirements into a concrete, ordered, file-level implementation plan that a developer can execute without ambiguity.

## Inputs
- `requirements.md`
- repository `README.md`
- additional supporting documentation explicitly provided for the run, such as `ARCHITECTURE.md`, `docs/WORKFLOW.md`, local boundary docs, ADRs, or formal interface contracts
- repository structure and existing code patterns

## Output
- `implementation-plan.md`

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after the plan is written to the artifact path and unresolved risks are
prepared for Gate 2 review.

## Step-by-Step Process

### 1. Read Workflow State, Documentation, And Codebase
Identify the workflow artifact paths from `<run_dir>/workflow-state.yml`.

Then read:
- the repository `README.md`
- any supporting documentation explicitly provided for the run
- any boundary documentation that governs the impacted area
- the existing source tree for the affected modules

Use the codebase's actual boundaries, naming conventions, and runtime model. Do not invent a new architecture vocabulary.
Use supporting documents to clarify constraints and implementation boundaries, but do not let them override the approved requirements. Record any conflicts for human review.

### 2. Map Requirements To Concrete Components
For each `REQ-xxx`, identify the modules, files, or units that must change.

Use only the abstractions already present in the repository, such as:
- routes
- components
- services
- reducers
- sagas
- adapters
- repositories

### 3. Define One Implementation Step Per File
Each step must specify:
- whether the file is `CREATE` or `MODIFY`
- the exact repository-relative path
- the requirement IDs it satisfies
- the file's responsibility
- the public interface to add or change
- the internal logic that must be implemented
- the dependencies it imports or calls
- the relevant error cases
- the constraints or invariants that must hold

### 4. Order Steps By Dependency
Sort the plan so no step depends on a later one.

The result should be executable in order without hidden prerequisites.

### 5. Record Risks And Assumptions
Before finalizing the plan, capture:
- risks that could cause rework or delivery failure
- assumptions made where requirements are ambiguous
- concrete mitigations for each risk

### 6. Prepare Risks And Assumptions For Gate 2
Write the draft plan with a `Risks & Assumptions` section marked for Gate 2
review. Do not create a separate architecture-only stop; the orchestrator owns
Gate 2 and presents the implementation plan together with test-design artifacts.

If Gate 2 approval is withheld, revise the plan inputs rather than pushing uncertainty downstream.

### 7. Fill The Canonical Output Template
Write the final plan using:
- `templates/skills/shared/implementation-plan-template.md`

Write the output to the run-specific artifact path recorded in `<run_dir>/workflow-state.yml`.

## Verification Checklist
- [ ] Every `REQ-xxx` is covered by at least one implementation step
- [ ] Every step includes an exact repository-relative file path
- [ ] Every step clearly states `CREATE` or `MODIFY`
- [ ] Public interface, internal logic, dependencies, error cases, and constraints are captured where applicable
- [ ] Step order respects dependency direction
- [ ] External dependency changes are called out explicitly
- [ ] Any supporting documentation that materially changed the plan remains traceable
- [ ] `Risks & Assumptions` were prepared for Gate 2 human review
- [ ] The traceability matrix maps every requirement to implementing steps
- [ ] The plan follows the repository's existing architecture rather than inventing a new one
- [ ] The plan does not invent behavior beyond the approved requirements and any explicitly used supporting source material
