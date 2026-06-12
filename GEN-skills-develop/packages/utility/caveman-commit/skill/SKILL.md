---
name: caveman-commit
description: Use when the user asks for a commit message, wants terse Conventional Commits output, or wants caveman-style commit text.
---

# Caveman Commit

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

- Subject format: `type(scope): message`
- `scope` optional.
- Allowed types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Use imperative mood.
- Prefer subject length <= 50 chars. Hard cap 72.
- No trailing period.
- Add body only when the why is not obvious, or for breaking changes, migrations, security fixes, or reversions.
- Wrap body at 72 chars when present.
- Use `-` bullets when bullets help.
- Put issue refs at end, for example `Closes #42`.

## Drop

- filler
- AI attribution
- restating obvious diff details
- "I", "we", "this commit", "as requested"

## Output

Return only the commit message, ready to paste. Use a code block when multi-line output is clearer.

## Boundaries

- Do not run `git commit`.
- Do not stage files.
- Do not amend commits.
