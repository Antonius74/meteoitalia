# MarkItDown Utility Skill Design

Date: 2026-06-05

## Context

`GEN-skills` distributes managed AI skills through `@nexidigital/nd-gen-skills`. Utility skills live under
`packages/utility/<name>` and can be installed without changing the active provider or runtime variant.

Microsoft MarkItDown is an official Python tool for converting documents and other inputs to Markdown for LLM and text
analysis workflows. The official repository is the source of truth for installation, supported formats, CLI/API usage,
plugins, optional dependencies, and security guidance:

- <https://github.com/microsoft/markitdown>
- <https://pypi.org/project/markitdown/>

Local search found no existing `markitdown` utility in this repository. Public third-party MarkItDown skills exist, but
this repository should provide its own lean, provider-agnostic utility that follows the local package model and the
official Microsoft documentation instead of copying a marketplace skill shape.

## Goals

- Add a user-installable `markitdown` utility skill package.
- Use the official Microsoft MarkItDown README and PyPI package as the documentation baseline.
- Provide a small cross-platform Python helper for local document-to-Markdown conversion.
- Keep the utility provider-agnostic and compatible with Codex and Claude installs.
- Default to local file conversion only.
- Detect missing Python package dependencies and report install guidance without installing automatically.
- Avoid editing provider skills under `packages/provider/`.
- Add focused tests for package registration, packaged content, and helper-script behavior.

## Non-Goals

- Vendor, fork, or wrap the full Microsoft MarkItDown source code.
- Automatically create virtual environments or install Python dependencies.
- Make remote URLs, YouTube links, or network conversion part of the default workflow.
- Build a high-fidelity document publishing pipeline; MarkItDown output is optimized for LLM and text analysis use.
- Edit provider packages under `packages/provider/`.
- Add new installer behavior unless existing registry/package tests reveal a required package-content update.

## Proposed Package Structure

```text
packages/utility/markitdown/
  manifest.yaml
  skill/
    SKILL.md
    scripts/
      convert_markitdown.py
```

The manifest will be a standard utility package:

- `apiVersion: nd-gen-skills.nexidigital.com/v1`
- `kind: utility`
- `name: markitdown`
- `version: 0.1.0`
- `description`: concise local document-to-Markdown conversion description
- `requiresContracts: []`
- `requiresUtilities: []`
- `skill.name: markitdown`
- `skill.source: skill`

The utility is user-installable by default.

## Skill Behavior

`skill/SKILL.md` will instruct agents to use this utility when the user asks to convert local documents or folders of
documents into Markdown through Microsoft MarkItDown.

The skill will include:

- a link to the official MarkItDown repository;
- a short explanation that MarkItDown is for Markdown extraction suitable for LLM/text workflows;
- dependency checks for Python and the `markitdown` Python package;
- cross-platform install guidance such as `python -m pip install "markitdown[all]"`;
- default local-file-only conversion workflow;
- examples using the helper script;
- direct CLI examples for users who prefer MarkItDown's own CLI;
- explicit remote-input and archive warnings;
- troubleshooting for missing dependencies, unsupported formats, overwrite refusal, and conversion failures.

The skill will not instruct agents to install dependencies automatically.

## Helper Script Design

`skill/scripts/convert_markitdown.py` will be pure Python using the standard library plus the installed `markitdown`
package. It must work on macOS, Windows, and Linux.

The script interface will be intentionally small:

```text
python convert_markitdown.py INPUT [INPUT ...] --output-dir DIR [--overwrite] [--allow-remote] [--allow-archives] [--json]
```

Inputs must be explicit file paths. Directory inputs and recursive traversal are out of scope for the first version.
Users who need batch conversion can pass multiple file paths in one command.

The script will:

- parse arguments with `argparse`;
- handle paths with `pathlib`;
- avoid shell command construction;
- check whether `markitdown` can be imported;
- report dependency guidance if import fails;
- reject URL-like inputs unless `--allow-remote` is passed;
- reject archive inputs such as `.zip` unless `--allow-archives` is passed;
- create the output directory when needed;
- write one `.md` file per input;
- refuse to overwrite existing outputs unless `--overwrite` is passed;
- use MarkItDown's local-file conversion API when available;
- emit either concise text output or a JSON summary for agent-readable automation.

The output filename should preserve the input stem and use `.md`. If duplicate stems collide in one run, the script
should fail clearly instead of guessing a renamed output.

## Security And Safety

The utility must preserve MarkItDown's official security posture. The Microsoft README warns that MarkItDown performs
I/O with the privileges of the running process, so inputs should be treated carefully.

Safety defaults:

- local files only by default;
- no automatic dependency installation;
- no shell command construction;
- no overwrite unless `--overwrite` is passed;
- no archive processing unless `--allow-archives` is passed;
- no URL-like input unless `--allow-remote` is passed;
- concise failure reporting without dumping large extracted content into chat;
- explicit user confirmation before converting sensitive, untrusted, remote, or archive inputs.

The helper should prefer MarkItDown's local-file API over a permissive generic conversion path where the installed
version exposes such an API. If version differences require fallback behavior, the fallback must preserve the same local
input checks before calling MarkItDown.

## Cross-Platform Requirements

The utility must avoid POSIX-only assumptions.

Requirements:

- use `python`, `python3`, or the currently configured interpreter as documented examples, without hardcoding a platform;
- use `pathlib` for path handling;
- avoid Bash scripts, shell glob expansion, `realpath`, `find`, `xargs`, or Unix-only path syntax;
- quote install extras in examples: `python -m pip install "markitdown[all]"`;
- keep output paths and summaries understandable on Windows, macOS, and Linux.

## Testing Plan

Add or update focused tests without touching provider packages:

- manifest schema/package-content coverage includes `packages/utility/markitdown`;
- utility appears in available utility listing when registry is built;
- packaged tarball content includes `skill/SKILL.md` and `skill/scripts/convert_markitdown.py`;
- helper script reports missing `markitdown` dependency cleanly;
- helper script rejects URL-like inputs unless `--allow-remote` is passed;
- helper script rejects archive inputs unless `--allow-archives` is passed;
- helper script refuses overwrite unless `--overwrite` is passed;
- helper script can be tested with a mocked/stubbed `markitdown` module for a successful local conversion path.

Verification commands:

```bash
npm run build
npm run build:registry
npm test
```

## Open Decisions Resolved

- The utility should include a helper script, not just prose guidance.
- The helper should detect missing dependencies instead of installing MarkItDown automatically.
- Local files are the default conversion scope.
- Remote inputs are explicit opt-in.
- The first version should stay lean and cross-platform.
- The official Microsoft README and PyPI package should be used as the source of truth.
