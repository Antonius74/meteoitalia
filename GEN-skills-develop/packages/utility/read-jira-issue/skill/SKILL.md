---
name: read-jira-issue
description: Read Jira issue evidence for workflow skills in read-only mode.
---

# Read Jira Issue

Use this utility only when another installed workflow or runtime skill needs Jira issue evidence.

This utility is not a user-facing ticket summary workflow. Return a structured Jira Evidence Packet so the calling skill can perform planning, quality assessment, requirements extraction, test design, or implementation reasoning.

## Read-Only Requirement

Jira access is read-only.

Allowed actions:

- search for Jira issues;
- fetch Jira issue fields;
- read linked issue metadata and fields;
- read comments only when the caller explicitly requests them or when comments are needed for functional clarification;
- read directly linked evidence metadata such as attachments, Figma links, or Confluence references when exposed by read-only tools.

Forbidden actions:

- Do not add comments.
- Do not edit issue fields.
- Do not transition issues.
- Do not assign or reassign issues.
- Do not add, update, or delete worklogs.
- Do not create, update, or delete issue links.
- Do not change labels, priority, sprint, fix version, or any other field.
- Do not mutate Confluence pages, Figma files, attachments, or linked evidence sources.

Do not use known mutation tools, including:

- `addCommentToJiraIssue`
- `addWorklogToJiraIssue`
- `createIssueLink`
- `createJiraIssue`
- `editJiraIssue`
- `transitionJiraIssue`
- `createConfluenceFooterComment`
- `createConfluenceInlineComment`
- `createConfluencePage`
- `updateConfluencePage`

If the caller asks for a mutation, refuse that action and return only read-only evidence.

## Jira MCP Availability

First check that Jira or Atlassian MCP read tools are available in the current environment.

If Jira MCP tools are unavailable, stop and tell the calling skill to ask the user for Jira access or pasted issue content. Do not replace Jira reads with guesses, browser search, stale local knowledge, or unverified assumptions.

## Inputs From The Calling Skill

The calling skill should provide:

- one or more explicit Jira issue keys;
- the caller intent, such as `planning`, `quality-assessment`, or `requirements-extraction`;
- whether comments are needed as functional evidence.

If no issue key is provided, stop and ask the calling skill to provide explicit Jira keys.

## Functional Scope Discipline

Requested issue keys define the functional scope for brainstorming and planning.
Linked issues are dependency context, not functional requirements, unless the user explicitly expands scope.

For planning or brainstorming callers:

- Do not extract or return linked issue acceptance criteria as in-scope requirements by default.
- For linked issues that are not approved into scope, do not copy their descriptions or acceptance criteria into `Description Evidence` or `Acceptance Criteria Evidence`; summarize only dependency metadata and the expansion reason under `Linked Issue Evidence`.
- Use linked issue data only to identify blockers, dependency risks, hierarchy, traceability, or source gaps.
- If a linked issue appears necessary to implement or test the requested issue, mark it as a scope decision needed and tell the calling skill to ask the user before expanding scope.
- If the dependency does not block understanding of the requested issue, keep it out of scope and record it as dependency context.

## Read Process

1. Fetch each explicit issue key in read-only mode.
2. Capture issue key, summary, issue type, status, priority, labels, assignee, reporter, description, acceptance criteria, linked issues, subtasks, parent or child relationship, attachments, and design links when available.
3. Mark absent fields as missing. Do not infer absent values.
4. Read additional issues only when they are materially needed to understand the requested issue context, not to collect extra delivery scope.

Material context includes:

- parent or child hierarchy;
- subtasks;
- blocker or dependency links;
- issue keys mentioned in the description;
- issue keys mentioned in acceptance criteria;
- links whose relationship type implies delivery dependency.

Skip broad `relates to` links unless the current issue text points to them as required context.

Recursive reads must stay bounded:

- Maximum expansion depth is 1 linked-issue hop beyond each requested issue unless the caller explicitly explains why deeper context is required.
- Stop after reading at most 5 additional issues per requested issue.
- Do not revisit an issue key that has already been read.
- Follow direct links only; do not follow links discovered from expanded linked issues unless the link is a blocker, parent, child, or explicitly mentioned in the requested issue text.

Record every expanded issue and the reason it was read.

For any expanded issue, also record whether it is `dependency context`, `hierarchy context`, `source clarification`, or `scope decision needed`. Do not label expanded issues as in-scope delivery work unless the caller supplied them as explicit issue keys or the user approved scope expansion.

## Jira Evidence Packet

Return Markdown with these headings:

```md
## Requested Issues

## Read-Only Compliance

## Issue Facts

## Description Evidence

## Acceptance Criteria Evidence

## Linked Issue Evidence

## Attachment And Design Evidence

## Comments Evidence

## Missing Or Unavailable Fields

## Recursive Read Trace

## Access Failures
```

The packet must preserve facts and source references: do not invent requirements, owners, blockers, dates, decisions, or next steps.

## Error Handling

- Issue not found: record the key under `Access Failures` and stop expansion for that branch.
- Access denied: record the key under `Access Failures` and stop expansion for that branch.
- Field absent: record it under `Missing Or Unavailable Fields`.
- Linked issue not materially relevant: skip it and record the skip reason when it affects traceability.
- Comments unavailable: record comments as unavailable; do not block unless the caller said comments are required evidence.
