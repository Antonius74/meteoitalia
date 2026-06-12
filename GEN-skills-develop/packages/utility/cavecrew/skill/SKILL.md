---
name: cavecrew
description: Use when deciding whether to delegate work with caveman-style subagent patterns to save context and keep outputs terse.
---

# Cavecrew

Cavecrew is a delegation guide for caveman-style subagent work. Main idea: structured terse sub-results save context.

## When To Use

- locate definitions, callers, or usages
- make a small surgical edit
- review a diff for findings only
- keep delegation output short and structured

## Preferred Mapping

| Task | Pattern |
| --- | --- |
| Find where something lives | investigator-style delegation |
| Make a 1-2 file change | builder-style delegation |
| Review diff for bugs or risks | reviewer-style delegation |
| Big feature or cross-cutting refactor | main thread or normal planning flow |

## Rules

- Use terse structured outputs for delegated work.
- Prefer file-path-first, line-attached summaries.
- Do not use this pattern for broad exploratory architecture discussions.
- Do not force delegation when the answer is already obvious in the main thread.

## Boundaries

- This utility is guidance only.
- It does not install subagent executables or hooks by itself.
