# Planning Template (Shared)

## Purpose
Extract every functional and non-functional requirement from the authoritative source system and produce a structured `requirements.md` artifact with complete traceability.

## Inputs
- issue keys or equivalent requirement sources
- repository context from `README.md` and adjacent documentation

## Output
- `requirements.md` in the workflow run directory

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after the verification checklist is satisfied or blocking source-access
issues are recorded.

## Step-by-Step Process

### 1. Fetch Source Issues
When the authoritative source is Jira, use the installed `read-jira-issue` utility to produce a read-only Jira Evidence Packet for each issue key. For each issue key, capture at least:
- summary
- description
- acceptance criteria
- priority
- labels
- status
- linked issues
- subtasks

### 2. Expand Material Jira Context
Use the `read-jira-issue` utility's recursive read trace to decide whether
additional Jira issues are materially needed for the requested scope. Expand
only issue keys explicitly listed by the human, direct parent or child context,
subtasks, blocker or dependency links, or issue keys mentioned in the
description or acceptance criteria when they clarify a requirement.

Do not perform separate ad hoc Jira fetches outside `read-jira-issue`. Skip
broad `relates-to` links unless the current issue text identifies them as
required context, and record skipped or unavailable linked context in Open
Questions when it affects traceability.

### 3. Extract UX And Technical Detail
For each story, extract these four dimensions directly from the source text:

- **User Inputs**: every field, control, or parameter the user provides, including type, required or optional status, and defaults when present
- **Validations**: format, length, allowed values, dependency rules, and exact user-visible error behavior where specified
- **Displayed Data**: every label, value, fetched datum, empty state, loading state, and confirmation state shown to the user
- **User Flow And Next Steps**: what happens after the action completes, including navigation, branching, notifications, state changes, and follow-on actions

If a dimension is not specified, mark it explicitly as `Not specified` and carry it into the open questions.

### 4. Split Acceptance Criteria Into Testable Requirements
Break acceptance criteria into discrete, testable statements.

Assign stable IDs sequentially:
- `REQ-001`
- `REQ-002`
- `REQ-003`

Each requirement must remain traceable to its source issue.

### 5. Categorize Requirements
Group requirements by functional area inferred from labels, story titles, and domain boundaries.

Separate non-functional requirements such as:
- performance
- security
- observability
- compliance
- accessibility

### 6. Capture Ambiguities And Missing Information
Create an `Open Questions` section for:
- vague terms
- conflicting criteria
- missing UX details
- unresolved technical constraints
- assumptions that materially affect implementation

### 7. Fill The Canonical Output Template
Write the final document using:
- `templates/skills/shared/requirements-template.md`

The output must be written to the run-specific artifact path recorded in `<run_dir>/workflow-state.yml`, not to the project root.

## Verification Checklist
- [ ] Every listed source issue produced at least one requirement
- [ ] Every `REQ-xxx` includes a source reference
- [ ] Every `REQ-xxx` records the required UX and technical dimensions, or explicitly flags them as missing
- [ ] Acceptance criteria were split into independently testable statements
- [ ] Non-functional requirements are separated from functional requirements
- [ ] Ambiguities and missing details are captured in `Open Questions`
- [ ] A traceability matrix maps every `REQ-xxx` back to its source
- [ ] No requirement was invented beyond what the authoritative source supports

## Error Handling
- Issue not found or access denied through `read-jira-issue`: record the failure, continue where possible, and add it to `Open Questions`
- Jira or Atlassian MCP unavailable globally through `read-jira-issue`: stop and request Jira access or pasted issue content rather than inventing requirements
- Missing acceptance criteria: still produce requirements using available evidence, but mark the resulting ambiguity explicitly
