---
name: workflow-us-quality-assessment-kit
description: Evaluate Jira, requirement, and Figma evidence for functional plan-readiness.
---

# Workflow US Quality Assessment Kit

## Purpose
Evaluate whether Jira user stories, requirement text, and optional Figma designs are functionally complete enough to support a reliable planning discussion.

This is a high-level functional quality gate. It is not a planning skill, writing skill, technical design skill, or implementation impact analysis.

The skill may inspect:

- Jira stories, epics, or backlog items
- requirement documents or pasted requirement text
- functional attachments such as copy decks, status matrices, or acceptance scenario spreadsheets
- Figma designs when UI or user flows are in scope

The skill must not rewrite the requirement, propose implementation tasks, inspect the local codebase, or silently resolve contradictions.

## Quickstart
The user provides one or more Jira issue keys, requirement text, requirement files, and/or Figma links.

1. Gather all available sources in read-only mode.
2. Treat Jira as the primary source of requested behavior and Figma as the primary UI source when UI is in scope.
3. If Figma is present and UI or flow behavior is in scope, validate the screens and flows with read-only Figma access. Before any `use_figma` inspection call, use the runtime-provided `figma-use` utility when it is installed; if it is not installed, record Figma access as unavailable and continue with explicit source gaps.
4. Evaluate all control families and any Jira story-level baseline dimensions.
5. Produce the report using `resources/report-template.md`.

Write the report to `workflow-us-quality-assessment-report.md` in the current directory unless the user asks for a different path or explicitly wants the report only in chat.

## Source Priority

### Primary Sources

- Jira is the source of truth for scope, requested behavior, priority, status, acceptance criteria, and linked work.
- Figma is the source of truth for UI, user-visible copy, screen states, CTAs, and prototype flow evidence when UI is in scope.

### Secondary Sources

- Requirement documents or pasted requirement text provide detail and context.
- Functional attachments may be used when they define copy, business rules, status matrices, user-visible behavior, or acceptance scenarios.
- Ignore purely technical attachment content unless the user explicitly asks for technical impact.

### Conflict Rule
When Jira, requirement text, attachments, and Figma diverge, do not choose silently and do not normalize the conflict away. Create an explicit finding with evidence from each conflicting source.

## Scope Control
Evaluate only functional plan-readiness.

Allowed focus:

- user goals and expected outcomes
- entry points, user journeys, and affected user-facing surfaces
- business states, visible status labels, timing rules, eligibility rules, and decision points
- input fields, required/optional rules, validation behavior, exact user-facing errors, and submitted outcomes
- UI behavior, copy, CTA behavior, navigation outcomes, dismissal behavior, and Figma flow consistency
- external product dependencies and ownership at a business level
- acceptance criteria and user-observable validation scenarios

Do not analyze:

- codebase modules, architecture, implementation ownership, or repository structure
- API schemas, payloads, field names, enum names, database models, DTOs, or technical contracts
- mock implementation, fake repositories, dependency injection, routing internals, or build impact
- estimates, implementation tasks, engineering design, or test automation design

Non-functional requirements such as performance, security, and accessibility are not standard gate dimensions. Note them only when they are explicitly present or when the user-visible functional outcome depends on them.

## Jira Story Baseline
When Jira issue keys are provided, fetch each issue through the installed `read-jira-issue` utility. Use the returned Jira Evidence Packet as the source for story baseline assessment. Jira access must remain read-only.

Capture:

- issue key, summary, description, status, priority, labels, and issue type
- acceptance criteria or any tester-verifiable behavior
- linked issues, subtasks, parent/child relationships, and explicitly mentioned related stories
- attachments and design links that contain functional evidence
- comments only when the user asks for them or when the issue body points to them as functional clarification

Assess each story against these baseline dimensions:

| # | Dimension | What to verify |
|---|---|---|
| 1 | Title & Description | Meaningful title; description explains business need, user role, and context |
| 2 | Acceptance Criteria | At least one criterion or behavior that a tester can verify; format does not matter |
| 3 | User Inputs & Validations | In-scope inputs are named with control type, required/optional behavior, validation rules, and exact error messages |
| 4 | Displayed Data & User Flow | User-visible data, destination after actions, success/error feedback, side effects, and relevant design evidence are clear |

A Figma link is evidence only after it has been inspected or explicitly marked unavailable. Do not treat a screenshot or link alone as a complete source of behavior.

Story-level gates are supplemental to the overall verdict:

- 🟢 **Green** — baseline dimensions are complete and no blocker/high functional issue exists for the story.
- 🟡 **Yellow** — planning can proceed with tracked gaps, or one dimension is partial/missing without a blocker.
- 🔴 **Red** — planning is unreliable because a blocker exists, acceptance criteria are absent, or two or more baseline dimensions are missing or vague.

The overall verdict remains the authoritative quality gate for the requirement package.

## Figma Flow Validation
Use Figma only when UI, screens, pages, dialogs, copy, visual states, navigation surfaces, layout behavior, or design parity are explicitly in scope.

Rules:

- Treat Figma as read-only.
- Prefer read-only Figma MCP tools such as design context, metadata, and screenshots when they are sufficient.
- If `use_figma` is needed to inspect prototypes, reactions, node structure, or flow links, first use the runtime-provided `figma-use` utility when it is installed; if it is not installed, record Figma access as unavailable and continue with explicit source gaps. Make a read-only inspection call only.
- Pass `skillNames: "figma-use"` on `use_figma` calls.
- Do not create, edit, delete, publish, move, import, rename, or mutate any Figma object.
- Do not evaluate pixel-perfect spacing, design tokens, component anatomy, asset extraction, or implementation details.

When Figma is inspected, validate functional UI consistency:

- required screens and user-visible states
- loading, empty, error, success, retry, cancel, dismiss, timeout, and terminal states when relevant
- visible copy, placeholders, dynamic text rules, and CTA labels
- CTA outcomes, navigation targets, overlays, footer/fixed surfaces, and scroll behavior at a functional level
- prototype flow links or documented navigation paths when available
- conflicts between Jira, requirement text, and Figma

If Figma is unavailable and it is the only source for an in-scope UI flow, record a finding. Classify it as `blocker` only when planning cannot proceed without the missing UI behavior.

## Controlled Clarification With Grill-Me
Use the installed `grill-me` skill only as a controlled fallback when all of these are true:

- a functional ambiguity would make the verdict `BLOCKED`
- the ambiguity cannot be resolved from Jira, requirement text, functional attachments, or Figma
- the question is about user behavior, business rules, user-visible states, copy, CTA outcomes, ownership, or acceptance criteria

When using `grill-me`:

- ask exactly one question at a time
- include one recommended answer for the question
- keep the question functional, not technical
- stop asking once the answer is sufficient to classify the requirement
- cite the answer as `user clarification` evidence in the final report

Do not use `grill-me` for `READY` or `READY WITH GAPS` cases, non-blocking gaps, technical implementation details, or questions about modules, APIs, payloads, enums, architecture, mocks, repositories, or tests.

## Control Families
Always evaluate the input against every family below.

### 1. Requirement Coverage
Check whether the requested behavior is complete enough to support planning.

Verify:

- entry points are clear
- main flow is clear
- alternative branches are clear
- failure paths are described
- completion conditions are described
- dependencies on other flows or systems are explicit

### 2. Business Rule And Terminology Consistency
Check whether business terms, status labels, visible values, and functional rules are used consistently.

Verify:

- status and state labels are stable
- the same user-visible concept is not described with conflicting labels
- business rules do not contradict each other
- timing rules and eligibility rules are coherent
- removed or legacy behavior is not still referenced elsewhere

### 3. State And Flow Completeness
Check whether the user flow and business state progression can be understood without guessing.

Verify:

- current state is explicit
- fallback or alternative state is explicit when relevant
- transitions have functional triggers
- retry behavior is defined when relevant
- cancel and dismiss behavior are defined when relevant
- blocking and terminal user-visible states are defined when relevant

### 4. UI And Figma Parity
Run this family only when UI is in scope.

Verify:

- UI copy matches the source
- placeholders and dynamic text rules are explicit
- visual states are functionally complete
- layout behavior is defined at a functional level for scroll, footer, overlays, and fixed surfaces when relevant
- icon or illustration requirements are explicit when they matter functionally
- Figma and Jira do not describe conflicting UI behavior
- CTA and navigation outcomes are functionally consistent across Jira and Figma

### 5. Terminology And Copy Consistency
Check whether product language is coherent enough to avoid functional ambiguity.

Verify:

- the same feature is not named differently across sources
- button labels and state labels are not conflicting
- notification names, service identifiers, and visible titles do not drift
- final user-facing wording is clear enough that copy does not need to be invented

### 6. Business Dependency And Ownership Clarity
Check whether the requirement identifies external business dependencies and ownership boundaries needed for functional planning.

Verify:

- dependent teams, systems, channels, or business processes are named
- upstream and downstream business dependencies are explicit when relevant
- responsibility boundaries are understandable from the requirement package
- integration points are not implied only by screenshots or copy

### 7. Functional Validation Readiness
Check whether the requirement package is testable through user-observable acceptance scenarios.

Verify:

- success and failure scenarios are functionally described when necessary
- notification, asynchronous, or timed flows have observable acceptance conditions when relevant
- prerequisite business data or user conditions are clear enough to validate behavior
- acceptance criteria do not require guessing expected user-visible outcomes
- cancel, dismiss, timeout, retry, and terminal states have expected user-visible outcomes when relevant

## Severity Model
Use exactly these severities:

- `blocker` — functional planning cannot be done reliably
- `high` — functional planning is possible but likely to cause major scope or acceptance rework
- `medium` — important functional planning risk or ambiguity exists
- `low` — minor quality issue that should be tracked but does not materially distort planning

## Family Status Model
For each control family, assign exactly one status:

- `pass` — no material issue is present
- `warning` — gaps exist but the family does not block planning
- `fail` — the family contains at least one blocker or severe unresolved contradiction

## Overall Verdict
The overall verdict must be exactly one of:

- `READY`
- `READY WITH GAPS`
- `BLOCKED`

Use:

- `READY` when functional planning can proceed without material ambiguity
- `READY WITH GAPS` when functional planning can proceed but important issues must be tracked explicitly
- `BLOCKED` when at least one unresolved issue prevents reliable functional planning

## Planning Recommendation
Always include exactly one recommendation aligned with the overall verdict:

- `Ready to plan`
- `Ready to plan with gaps`
- `Not ready to plan`

## Findings
Only include findings that materially affect plan-readiness.

Each finding must contain:

- `severity`
- `area`
- `issue`
- `evidence`
- `impact`
- `decision needed`

Evidence must cite the source as `Jira`, `requirement`, `Figma`, or `user clarification`.

Order findings by severity first, then by planning impact.

## Output Format
Return the report in this order:

### Overall Verdict
State the verdict and one short reason.

If Jira stories were reviewed, include a compact story rollup table with issue key, title, story gate, and open-question count.

### Planning Recommendation
State one of the required recommendation values.

### Control Family Status
List every family with:

- family name
- status
- short justification

### Findings
List only findings relevant to plan-readiness, ordered by severity first and then impact.

### Open Questions To Resolve Before Planning
List only unresolved questions that must be answered before planning can be considered stable.

### Functional Scope Impact
List only affected product areas or user-facing surfaces. Do not list code modules, architecture components, APIs, payloads, repositories, or implementation owners.

Examples:

- Homepage card status experience
- Notification Center
- Alerts settings
- Support FAQ
- Transaction history user experience
- Card block or unblock user journey

### Delivery Follow-Ups
Optional. Include only short follow-ups needed because a functional decision depends on another team, system, or delivery owner.

Rules:

- keep them business-level and user-outcome oriented
- do not include module names, API schemas, payloads, enum names, DTOs, database details, mock design, or implementation steps
- do not let a delivery follow-up change the verdict unless the functional behavior itself is unclear
- phrase them as dependency checks, not engineering tasks

## Error Handling
- `read-jira-issue` reports an issue as not found or access denied: mark the story 🔴 Red and add a blocker finding asking to confirm the issue key or Jira access.
- Jira or Atlassian MCP unavailable through `read-jira-issue`: stop and ask the user to provide Jira access or pasted issue content.
- Figma unavailable: continue only if Jira or requirements contain enough UI/flow behavior to classify the requirement; otherwise record the missing Figma evidence as a finding.
- Story has no description and no acceptance criteria: mark it 🔴 Red and include blocker findings for missing business context and missing tester-verifiable behavior.

## Verification Checklist
Before finishing, confirm:

- [ ] Every provided issue key has a story rollup row or explicit not-found finding
- [ ] Every control family has a status and justification
- [ ] Every finding cites Jira, requirement, Figma, or user clarification evidence
- [ ] Every blocker maps to an open question or required decision
- [ ] Non-functional requirements are not used as gate factors unless they affect user-visible behavior
- [ ] No technical modules, APIs, payloads, DTOs, enums, repositories, or implementation tasks appear in the standard output
- [ ] No invented details are presented as facts
- [ ] Any `use_figma` call was read-only and used the runtime-provided `figma-use` utility when it was installed
