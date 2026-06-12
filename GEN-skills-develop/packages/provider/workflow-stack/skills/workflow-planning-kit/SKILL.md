---
name: workflow-planning-kit
description: Generate requirements artifacts for delivery workflows from Jira, requirement text, and supporting evidence.
---

# Planning Skill — Jira → Requirements Document

## Shared Planning Template

- [`../workflow-core-kit/templates/skills/shared/planning.template.md`](../workflow-core-kit/templates/skills/shared/planning.template.md)
- [`../workflow-core-kit/templates/skills/shared/requirements-template.md`](../workflow-core-kit/templates/skills/shared/requirements-template.md)

## Purpose
Extract every functional and non-functional requirement from a set of Jira User
Stories and write them into `requirements.md`, the single source-of-truth that
all downstream agents read. Jira stories are the primary input, but additional
supporting documentation may also be provided where relevant. This file must
report requirements in a structured, traceable way, with no details lost or
invented beyond what the provided source material describes. Additional
information about other supported inputs and how to use them is described in the
relevant sections of this skill. It should focus on the requirements relevant
for the project it is currently running on, not every possible requirement
linked to the provided Jira keys (eg. if running in a backend repo, only
include backend-relevant requirements even if the Jira stories also mention
frontend details).

## Quickstart
The orchestrator provides `--workflow-dir` as the run-specific directory. Run the init script
to scaffold an empty `requirements.md` in that directory:
```bash
python ./scripts/init_planning.py \
    --workflow-dir <run_dir> \
    --issues PROJ-101 PROJ-102
```
Then fill the document following the steps below.

## Progress Reporting
When this skill is run by the workflow orchestrator, emit progress messages
exactly in this format after each numbered step:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Use `M = 8` for this skill's Step-by-Step Process. Emit `[DONE]` only after
`requirements.md` is written to `artifacts.requirements` and the verification
checklist is satisfied or blocking source-access issues are recorded.

## Planning Reasoning Discipline
Use the installed `grill-me` skill as a required part of planning reasoning
before finalizing `requirements.md`. Treat it as the planning agent's
adversarial questioning pass: walk the requirement extraction and emerging plan
through one focused question at a time, answer any question that can be resolved
from Jira, directly linked Figma evidence, or repository context, and capture
only genuinely unresolved issues in Open Questions.

This reasoning pass is core to the planning workflow, not optional polish. It
improves correctness by forcing dependency order, missing inputs, validation
rules, displayed data, downstream effects, and acceptance criteria gaps to be
checked before handoff.

## Repository Documentation Context
Use existing repository documentation as supporting context for requirement
extraction, especially the repository `README.md`, `ARCHITECTURE.md`,
`docs/WORKFLOW.md`, relevant local boundary `README.md` files, local workflow
documents, ADRs, and formal interface contracts when they are present and
material to the requested scope.

Repository documentation helps identify scope, ownership boundaries, terminology,
runtime conventions, integration constraints, and where downstream agents will
expect handoff artifacts to live. It does not replace Jira stories as the
primary requirements source. If documentation conflicts with Jira, directly
linked Figma evidence, or other explicit source material, record the conflict in
Open Questions rather than resolving it silently.

Do not generate, rewrite, or maintain repository documentation as part of this
skill. Documentation creation and maintenance belongs to the installed
`documentation-kit` workflow. This skill only consumes existing documentation as
evidence and context for `requirements.md`.

## Step-by-Step Process

### 1 — Fetch Issues
For each issue key, use the installed `read-jira-issue` utility to retrieve a read-only Jira Evidence Packet. Do not call Jira mutation tools. Do not assume a fixed MCP function name such as `jira_get_issue`; let `read-jira-issue` select the available read-only Jira or Atlassian retrieval tool.

The evidence packet must capture: summary, description, acceptance criteria, priority, labels, status, linked issues, subtasks, and the recursive read trace when linked context is materially needed.

### 2 — Expand Material Jira Context
Use the `read-jira-issue` utility's recursive read trace to decide whether
additional Jira issues are materially needed for the requested scope. Expand
only issue keys explicitly listed by the human, direct parent or child context,
subtasks, blocker or dependency links, or issue keys mentioned in the
description or acceptance criteria when they clarify a requirement.

Do not perform separate ad hoc Jira fetches outside `read-jira-issue`. Skip
broad `relates-to` links unless the current issue text identifies them as
required context, and record skipped or unavailable linked context in Open
Questions when it affects traceability.

### 3 — Retrieve Linked Figma Context
If the Jira ticket or one of its directly relevant linked issues references a
Figma prototype, page, frame, or file needed to understand the requirement,
retrieve only the linked Figma context needed to clarify the requirement before
extracting requirements.

Use read-only Figma access only. Never create, update, delete, map, publish,
or generate Figma files, Figma nodes, libraries, Code Connect mappings, or
design-system rule files as part of this skill. If read-only retrieval requires
JavaScript execution in the Figma file context, use the runtime-provided
`figma-use` utility when it is installed; if it is not installed, record Figma
access as unavailable and continue with explicit source gaps. Otherwise use
read-only Figma retrieval tools directly.

Treat Figma as supporting source material linked from Jira: capture only the
details needed to clarify the requirements, preserve traceability back to the
Jira issue, and do not invent behavior beyond what the Jira ticket and linked
Figma material actually show.

### 4 — Extract UX & Technical Details
For each story, extract the following four dimensions directly from the Jira
description, acceptance criteria, and any directly linked Figma context
retrieved in Step 3. Record them per REQ-xxx in the output. Do not invent
details not explicitly stated in the source material you used.

- **User Inputs** — every field, control, or parameter the user provides:
  field name, type (text, select, date, file, …), required/optional, default value.
- **Validations** — every rule applied to each input: format constraints,
  length limits, allowed values, dependency rules between fields, and the
  exact error message shown to the user on violation.
- **Displayed Data** — every piece of information shown to the user: labels,
  computed values, fetched data (with its source/API), empty-state messages,
  loading states.
- **User Flow — Next Steps** — what happens after the user completes the action:
  navigation target, success/error feedback, branching conditions, follow-on
  triggers (emails, notifications, state changes).

If a dimension is not described in the source material you used, mark it
explicitly as
`Not specified — flagged in Open Questions`.

### 5 — Parse Acceptance Criteria
Split each criterion into one discrete, testable statement.
Assign IDs: **REQ-001**, REQ-002, … sequential across all stories.

### 6 — Categorise
Group requirements by functional area (infer from Jira labels / story titles).
Separate non-functional requirements (performance, security, observability).

### 7 — Flag Ambiguities
Add an **Open Questions** section for vague terms, conflicts between stories,
and any UX/technical dimension marked "Not specified" in Step 4.

### 8 — Fill `requirements.md`
Use the template in `../workflow-core-kit/templates/skills/shared/requirements-template.md`.
See `examples/example-requirements.md` for a complete filled-in reference.
Write the output to the path at `artifacts.requirements` in `<run_dir>/workflow-state.yml` —
never to the project root.

## Verification Checklist
Run through every item before handing off:

- [ ] Every Jira story key has ≥ 1 REQ-xxx entry in the document
- [ ] Every REQ-xxx references its source Jira key
- [ ] Any requirement clarified by linked Figma material remains traceable back to the Jira issue and linked Figma source
- [ ] No Figma write action was performed; any Figma usage remained read-only and evidence-only
- [ ] Every REQ-xxx has all four UX/technical dimensions filled (or explicitly flagged)
- [ ] Acceptance criteria are split into discrete, independently testable statements
- [ ] Non-functional requirements are in a separate section
- [ ] All ambiguous or conflicting criteria are listed in Open Questions
- [ ] All "Not specified" UX dimensions are listed in Open Questions
- [ ] The `grill-me` reasoning pass was used to stress-test completeness, dependency order, and unresolved planning questions before final handoff
- [ ] Traceability matrix at the bottom maps every REQ-xxx to its Jira source
- [ ] No requirements invented beyond what Jira stories or any explicitly used supporting source material describe

## Error Handling
- `read-jira-issue` reports an issue as not found or access denied → log warning, skip that issue, add the failure to Open Questions, and surface it to the human before proceeding.
- `read-jira-issue` reports Jira or Atlassian MCP unavailable → abort and ask the human to provide Jira access or pasted issue content.
- Linked Figma prototype/page cannot be retrieved → note the missing design source in Open Questions, continue with Jira-only evidence if possible, and surface the gap to the human before handoff.
- Jira story has no acceptance criteria → mark all REQ-xxx for that story as "Not specified" and add to Open Questions.
