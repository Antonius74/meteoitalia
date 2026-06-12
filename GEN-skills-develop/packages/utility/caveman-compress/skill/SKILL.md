---
name: caveman-compress
description: Use when the user asks to compress a prose-heavy memory file, notes file, or markdown document into a terser caveman form.
---

# Caveman Compress

Compress natural-language files into caveman style to save input tokens. Preserve technical substance, code, URLs, and structure.

## Good Targets

- `CLAUDE.md`
- notes
- todos
- preferences
- markdown-heavy memory files

## Rules

- Preserve code blocks exactly.
- Preserve inline code exactly.
- Preserve URLs, file paths, commands, versions, dates, and numeric values exactly.
- Preserve heading text and document structure.
- Compress only prose around those elements.
- Prefer short direct wording and fragments when clear.

## Boundaries

- Only compress prose-heavy text files.
- Never rewrite source code, config files, lockfiles, or structured machine-readable files just to sound caveman.
- If a file mixes prose and code, compress prose only.
- If unsure whether text is code or prose, leave it unchanged.
- If rewriting a file in place, create a backup first.
