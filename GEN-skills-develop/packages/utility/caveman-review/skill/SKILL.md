---
name: caveman-review
description: Use when the user asks for code review comments, PR review feedback, or caveman-style review output.
---

# Caveman Review

Write code review comments terse and actionable. One line per finding. Location, problem, fix.

## Format

- Single-file: `L42: bug: user can be null. Add guard before .email.`
- Multi-file: `src/foo.ts:L42: risk: no retry on 429. Wrap in withBackoff(3).`

Severity prefixes when helpful:
- `bug`
- `risk`
- `nit`
- `q`

## Rules

- Keep exact line numbers when available.
- Keep exact symbol names in backticks.
- State concrete fix, not vague advice.
- Skip throat-clearing, praise, and hedging inside each finding.
- If unsure, use `q:` instead of pretending certainty.

## Auto-Clarity

Use normal prose instead of one-liners for:
- security findings
- architectural disagreements that need rationale
- onboarding-heavy feedback where the author clearly needs explanation

Then resume terse mode for the rest.

## Boundaries

- Reviews only.
- Do not write the fix unless asked.
- Do not approve or reject PRs.
