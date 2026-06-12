---
name: markitdown
description: Convert local documents to Markdown with Microsoft MarkItDown.
---

# MarkItDown

Use this utility when the user asks to convert local documents into Markdown with Microsoft MarkItDown.

Official documentation is the source of truth:

- https://github.com/microsoft/markitdown
- https://pypi.org/project/markitdown/

MarkItDown output is intended for LLM and text-analysis workflows. It is not a high-fidelity publishing or document-layout conversion tool.

## Default Safety Rules

- Convert local files by default.
- Do not process URLs, YouTube links, or other remote inputs unless the user explicitly asks for remote conversion.
- Do not process archives such as `.zip` unless the user explicitly asks for archive conversion.
- Do not install Python packages automatically.
- Do not overwrite existing Markdown outputs unless the user explicitly approves overwrite behavior.
- Do not paste large extracted document content into chat unless the user asks for it.
- Treat untrusted, sensitive, remote, and archive inputs as higher risk.

Microsoft's README warns that MarkItDown performs I/O with the privileges of the running process. Keep conversion scope narrow and explicit.

## Dependency Check

Before using the helper script, check that Python and MarkItDown are available:

```bash
python --version
python -c "import markitdown; print('markitdown available')"
```

If MarkItDown is missing, report this command to the user and stop:

```bash
python -m pip install "markitdown[all]"
```

Use the active project virtual environment when the repository already has one. Do not create a virtual environment unless the user asks for that setup.

## Helper Script

Prefer the helper script for repeatable local conversion. Use the skill directory for the current tool:

| Tool | `SKILL_DIR` |
| --- | --- |
| Codex | `.agents/skills/markitdown` |
| Claude | `.claude/skills/markitdown` |

Replace `SKILL_DIR` in these examples with the matching path.

```bash
python SKILL_DIR/scripts/convert_markitdown.py ./input.pdf --output-dir ./markdown
```

Convert multiple explicit files:

```bash
python SKILL_DIR/scripts/convert_markitdown.py ./a.pdf ./b.docx --output-dir ./markdown
```

Emit JSON for agent-readable summaries:

```bash
python SKILL_DIR/scripts/convert_markitdown.py ./input.xlsx --output-dir ./markdown --json
```

Overwrite an existing output only after user approval:

```bash
python SKILL_DIR/scripts/convert_markitdown.py ./input.pptx --output-dir ./markdown --overwrite
```

The helper accepts explicit file paths only. Directory traversal is not part of the first version; pass each file path explicitly.

## Direct MarkItDown CLI

When the user specifically wants the upstream CLI, follow the official README. A typical local conversion is:

```bash
markitdown ./input.pdf -o ./output.md
```

Use direct CLI commands only with explicit local paths unless the user approves remote or archive inputs.

## Remote And Archive Inputs

Remote inputs and archives are opt-in because they can trigger extra I/O or hide unexpected content. If the user asks for them, state the risk briefly, confirm the exact input, and use the narrowest command that satisfies the request.

Helper flags:

```bash
python SKILL_DIR/scripts/convert_markitdown.py "https://example.com/file.pdf" --output-dir ./markdown --allow-remote
python SKILL_DIR/scripts/convert_markitdown.py ./bundle.zip --output-dir ./markdown --allow-archives
```

## Reporting

After conversion, report:

- output Markdown path;
- number of converted inputs;
- skipped inputs;
- failed inputs with concise error messages.

Do not include full converted content in chat unless the user asks for it.

## Troubleshooting

- Missing `markitdown`: ask the user to install it with `python -m pip install "markitdown[all]"`.
- Unsupported format: report the source path and MarkItDown error.
- Existing output: rerun with `--overwrite` only after user approval.
- Remote input rejected: rerun with `--allow-remote` only after explicit user approval.
- Archive input rejected: rerun with `--allow-archives` only after explicit user approval.
