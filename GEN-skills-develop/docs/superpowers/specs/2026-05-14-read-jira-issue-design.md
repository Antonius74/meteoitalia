# Read Jira Issue Utility Design

## Purpose

Replace the optional user-facing `nexi-jira-summary` utility with an internal
`read-jira-issue` utility used by all runtime variants to collect Jira evidence
for workflow skills.

The new utility is not a summarization assistant. It provides a consistent,
read-only Jira evidence packet that planning, quality assessment, and other
workflow skills can consume.

## Goals

- Install `read-jira-issue` automatically with every runtime variant.
- Make Jira access read-only across all workflow usage.
- Give downstream skills a stable evidence format for Jira facts.
- Support bounded recursive issue reads when extra context is materially needed.
- Remove `nexi-jira-summary` from package sources, registry output, tests, and
  public documentation.

## Non-Goals

- No lockfile migration from `nexi-jira-summary`.
- No user-facing ticket summary workflow.
- No Jira mutation support.
- No broad recursive traversal of loosely related backlog items.

## Architecture

Create a new utility package:

```text
packages/utility/read-jira-issue/
  manifest.yaml
  skill/
    SKILL.md
```

The package and installed skill name are both `read-jira-issue`.

Every runtime variant must declare the utility in both manifest locations:

- `requiresUtilities`
- `runtime.references`

This applies to:

- `frontend-react`
- `backend-java`
- `mobile-ios`
- `mobile-android`

This variant-level wiring guarantees the utility is available for all runtime
variants, regardless of provider choice.

Remove the old package:

```text
packages/utility/nexi-jira-summary/
```

Remove old references from README examples, requirements text, package-content
expectations, CLI smoke tests, registry artifact expectations, and integration
tests.

## Read-Only Constraint

`read-jira-issue` must treat Jira as read-only evidence.

Allowed actions:

- search for Jira issues;
- fetch Jira issue fields;
- read linked issue metadata and fields;
- read comments only when the caller explicitly requests them or when they are
  needed for functional clarification;
- read directly linked evidence metadata such as attachments, Figma links, or
  Confluence references when exposed by read-only tools.

Forbidden actions:

- adding Jira comments;
- editing issue fields;
- transitioning issue status;
- assigning or reassigning issues;
- adding, updating, or deleting worklogs;
- creating or deleting issue links;
- changing labels, priority, sprint, fix version, or any other field;
- mutating Confluence pages or linked evidence sources.

If a caller asks for a mutation while using this utility, the skill must refuse
that action and return only read-only evidence.

## Skill Contract

### Inputs

The calling workflow skill provides:

- one or more explicit Jira issue keys;
- optional caller intent, such as `planning`, `quality-assessment`, or
  `requirements-extraction`;
- optional instruction to include comments when comments are necessary evidence.

### Expansion Rules

Start with the explicit issue keys.

Read additional issues only when they are materially needed to understand the
requested issue context. Material context includes:

- parent or child hierarchy;
- subtasks;
- blocker or dependency links;
- issue keys mentioned in the description;
- issue keys mentioned in acceptance criteria;
- links whose relationship type implies delivery dependency.

Skip broad `relates to` links unless the current issue text points to them as
required context.

Recursive reads must be bounded. The evidence packet must record every expanded
issue and why it was read.

### Output

Return a Markdown Jira Evidence Packet with stable headings:

- Requested Issues
- Read-Only Compliance
- Issue Facts
- Description Evidence
- Acceptance Criteria Evidence
- Linked Issue Evidence
- Attachment And Design Evidence
- Comments Evidence
- Missing Or Unavailable Fields
- Recursive Read Trace
- Access Failures

The packet should preserve facts and source references. It should not invent
requirements, owners, blockers, dates, decisions, or next steps.

## Workflow Integration

Update workflow guidance to route Jira reads through `read-jira-issue`.

`workflow-planning-kit`:

- Step 1 uses `read-jira-issue` to fetch Jira evidence.
- The planning skill then extracts requirements from the evidence packet.

`workflow-us-quality-assessment-kit`:

- Jira story baseline reads Jira evidence through `read-jira-issue`.
- Findings cite the evidence packet rather than ad hoc Jira fetch behavior.

Shared planning template:

- When the authoritative source is Jira, instruct agents to use
  `read-jira-issue` before extracting source issue details.

Runtime skills:

- List `read-jira-issue` in the Runtime Utilities section.
- State that Jira evidence must be collected through this utility in read-only
  mode.

## Error Handling

If Jira or Atlassian MCP tools are unavailable, `read-jira-issue` must stop and
tell the caller to ask the user for Jira access or pasted issue content. It must
not replace Jira reads with guesses, browser search, stale local knowledge, or
unverified assumptions.

If an issue is not found or access is denied, record the failure in the evidence
packet and stop expansion for that branch.

If a field is absent, mark it as missing rather than inferring a value.

If recursive expansion would broaden scope without materially improving context,
skip that issue and record the skip reason when relevant.

## Testing

Tests should verify:

- all four variant manifests include `read-jira-issue` in `requiresUtilities`;
- all four variant manifests include `read-jira-issue` in `runtime.references`;
- installing each variant installs `.agents/skills/read-jira-issue/SKILL.md`;
- installed lockfiles mark `read-jira-issue` as a non-requested utility required
  by the selected variant;
- package content tests include `packages/utility/read-jira-issue`;
- package content tests no longer include `packages/utility/nexi-jira-summary`;
- CLI smoke and registry tests expect
  `dist-registry/packages/utility-read-jira-issue-0.1.0.tgz`;
- CLI smoke and registry tests no longer expect the old summary artifact;
- workflow skill content references `read-jira-issue` for Jira reads;
- README and requirements examples no longer advertise
  `add-skill nexi-jira-summary`.

## Success Criteria

- `npm test` passes.
- `npm run build:registry` produces a registry containing
  `utility/read-jira-issue` and no `utility/nexi-jira-summary`.
- Installing any runtime variant installs `read-jira-issue` automatically.
- Jira-related workflow guidance consistently preserves read-only behavior.
