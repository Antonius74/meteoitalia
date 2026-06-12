# MarkItDown Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lean, user-installable `markitdown` utility skill that uses Microsoft MarkItDown to convert local documents into Markdown safely and cross-platform.

**Architecture:** Add one provider-agnostic utility package under `packages/utility/markitdown`. The package contains a normal manifest, a `SKILL.md` that follows the official Microsoft MarkItDown README guidance, and one pure-Python helper script for explicit local-file conversion. Existing registry and package-content tests are extended so the utility is packaged, discoverable, installable, and validated without editing provider packages.

**Tech Stack:** Node 20, TypeScript, Vitest, YAML manifests, Python 3 standard library, Microsoft `markitdown` Python package supplied by the target environment.

---

## File Structure

- Create: `packages/utility/markitdown/manifest.yaml`
  - Declares the utility package identity and skill source.
- Create: `packages/utility/markitdown/skill/SKILL.md`
  - Agent-facing workflow guidance, official docs alignment, dependency checks, security defaults, examples, and troubleshooting.
- Create: `packages/utility/markitdown/skill/scripts/convert_markitdown.py`
  - Cross-platform conversion helper using `argparse`, `pathlib`, and MarkItDown's Python API.
- Create: `tests/unit/markitdown-helper.test.ts`
  - Behavior tests for the Python helper script.
- Modify: `tests/unit/package-content.test.ts`
  - Adds package-root coverage and manifest/content expectations.
- Modify: `tests/unit/build-registry.test.ts`
  - Adds registry index and archive-content expectations.
- Modify: `tests/integration/utility-list-validate.test.ts`
  - Adds an install/list/validate integration check for the new utility.
- Modify: `scripts/build-registry.ts`
  - Adds `utility/markitdown` to the explicit package ordering.
- Modify: `guides/utilities/support-utility-skills.md`
  - Adds `markitdown` to the user-installable utilities table.
- Regenerate: `dist-registry/index.yaml`
  - Registry output after `npm run build:registry`.
- Generate: `dist-registry/packages/utility-markitdown-0.1.0.tgz`
  - Registry artifact after `npm run build:registry`.

Do not modify any file under `packages/provider/`.

---

### Task 1: Package Manifest And Skill Guidance

**Files:**
- Modify: `tests/unit/package-content.test.ts`
- Create: `packages/utility/markitdown/manifest.yaml`
- Create: `packages/utility/markitdown/skill/SKILL.md`

- [ ] **Step 1: Write failing package-content expectations**

In `tests/unit/package-content.test.ts`, add `packages/utility/markitdown` to `packageRoots` near the other user-installable utilities:

```ts
  "packages/utility/markitdown",
```

Add this entry to `expectedPackages`:

```ts
  { root: "packages/utility/markitdown", kind: "utility", name: "markitdown" },
```

Inside `it("declares exact contract, variant, and utility manifest contracts", async () => { ... })`, add this assertion after the `documentation-ubiquitous-language` or `figma-use` utility assertions:

```ts
    const markitdown = await readManifest("packages/utility/markitdown");
    expect(markitdown.kind).toBe("utility");
    expect(markitdown.description).toBe(
      "Convert local documents to Markdown with Microsoft MarkItDown.",
    );
    expect(markitdown.requiresContracts).toEqual([]);
    expect(markitdown.requiresUtilities).toEqual([]);
    expect(markitdown.skill).toEqual({ name: "markitdown", source: "skill" });
```

- [ ] **Step 2: Run the failing package-content test**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: FAIL because `packages/utility/markitdown/manifest.yaml` does not exist.

- [ ] **Step 3: Create the manifest**

Create `packages/utility/markitdown/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: markitdown
version: 0.1.0
description: Convert local documents to Markdown with Microsoft MarkItDown.
requiresContracts: []
requiresUtilities: []
skill:
  name: markitdown
  source: skill
```

- [ ] **Step 4: Create the skill guidance**

Create `packages/utility/markitdown/skill/SKILL.md`:

```md
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

Prefer the helper script for repeatable local conversion:

```bash
python .agents/skills/markitdown/scripts/convert_markitdown.py ./input.pdf --output-dir ./markdown
```

Convert multiple explicit files:

```bash
python .agents/skills/markitdown/scripts/convert_markitdown.py ./a.pdf ./b.docx --output-dir ./markdown
```

Emit JSON for agent-readable summaries:

```bash
python .agents/skills/markitdown/scripts/convert_markitdown.py ./input.xlsx --output-dir ./markdown --json
```

Overwrite an existing output only after user approval:

```bash
python .agents/skills/markitdown/scripts/convert_markitdown.py ./input.pptx --output-dir ./markdown --overwrite
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
python .agents/skills/markitdown/scripts/convert_markitdown.py "https://example.com/file.pdf" --output-dir ./markdown --allow-remote
python .agents/skills/markitdown/scripts/convert_markitdown.py ./bundle.zip --output-dir ./markdown --allow-archives
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
```

- [ ] **Step 5: Run package-content test again**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: PASS for package-content tests, or fail only because later tasks have not yet added the helper script expectations.

- [ ] **Step 6: Commit package skeleton**

```bash
git add tests/unit/package-content.test.ts packages/utility/markitdown/manifest.yaml packages/utility/markitdown/skill/SKILL.md
git commit -m "feat(utility): add markitdown skill package"
```

---

### Task 2: Helper Script Behavior

**Files:**
- Create: `tests/unit/markitdown-helper.test.ts`
- Create: `packages/utility/markitdown/skill/scripts/convert_markitdown.py`

- [ ] **Step 1: Write failing helper tests**

Create `tests/unit/markitdown-helper.test.ts`:

```ts
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve("packages/utility/markitdown/skill/scripts/convert_markitdown.py");

let pythonExecutable: string | undefined;

beforeAll(async () => {
  pythonExecutable = await resolvePythonExecutable();
});

describe("convert_markitdown.py", () => {
  it("reports missing MarkItDown dependency without installing packages", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-missing-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    const emptyPythonPath = path.join(root, "empty-pythonpath");
    await mkdir(emptyPythonPath);
    await writeFile(input, "hello", "utf8");

    await expect(
      execFileAsync(python, [scriptPath, input, "--output-dir", outputDir], {
        env: { ...process.env, PYTHONPATH: emptyPythonPath, PYTHONNOUSERSITE: "1" },
      }),
    ).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('python -m pip install "markitdown[all]"'),
    });
  });

  it("rejects remote inputs unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-remote-"));
    const outputDir = path.join(root, "out");

    await expect(
      runHelper(python, ["https://example.com/file.pdf", "--output-dir", outputDir]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Remote input requires --allow-remote"),
    });
  });

  it("rejects archives unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-archive-"));
    const input = path.join(root, "bundle.zip");
    const outputDir = path.join(root, "out");
    await writeFile(input, "not a real zip", "utf8");

    await expect(runHelper(python, [input, "--output-dir", outputDir])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Archive input requires --allow-archives"),
    });
  });

  it("refuses to overwrite existing output unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-overwrite-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    const output = path.join(outputDir, "input.md");
    await mkdir(outputDir);
    await writeFile(input, "hello", "utf8");
    await writeFile(output, "existing", "utf8");

    await expect(runHelperWithStub(python, root, [input, "--output-dir", outputDir])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Output already exists"),
    });
  });

  it("converts a local file with a stubbed MarkItDown module and emits JSON", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-success-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    await writeFile(input, "hello", "utf8");

    const { stdout } = await runHelperWithStub(python, root, [input, "--output-dir", outputDir, "--json"]);

    const summary = JSON.parse(stdout) as {
      converted: Array<{ input: string; output: string }>;
      failed: Array<{ input: string; error: string }>;
      skipped: string[];
    };
    expect(summary.converted).toEqual([{ input, output: path.join(outputDir, "input.md") }]);
    expect(summary.failed).toEqual([]);
    expect(summary.skipped).toEqual([]);
    await expect(readFile(path.join(outputDir, "input.md"), "utf8")).resolves.toBe(
      `converted:${input}\n`,
    );
  });
});

function requirePython(): string {
  if (pythonExecutable === undefined) {
    throw new Error("Python executable not found. Set PYTHON to run MarkItDown helper tests.");
  }
  return pythonExecutable;
}

async function resolvePythonExecutable(): Promise<string | undefined> {
  const candidates = [process.env.PYTHON, "python3", "python"].filter((candidate): candidate is string =>
    Boolean(candidate),
  );

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ["--version"]);
      return candidate;
    } catch {
      continue;
    }
  }

  return undefined;
}

function runHelper(python: string, args: string[]) {
  return execFileAsync(python, [scriptPath, ...args], {
    env: { ...process.env },
  });
}

async function runHelperWithStub(python: string, root: string, args: string[]) {
  const stubRoot = path.join(root, "stub");
  const moduleRoot = path.join(stubRoot, "markitdown");
  await mkdir(moduleRoot, { recursive: true });
  await writeFile(
    path.join(moduleRoot, "__init__.py"),
    [
      "class Result:",
      "    def __init__(self, text_content):",
      "        self.text_content = text_content",
      "",
      "class MarkItDown:",
      "    def convert_local(self, source):",
      "        return Result(f'converted:{source}')",
      "",
    ].join("\n"),
    "utf8",
  );

  return execFileAsync(python, [scriptPath, ...args], {
    env: { ...process.env, PYTHONPATH: stubRoot, PYTHONNOUSERSITE: "1" },
  });
}
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```bash
npm test -- tests/unit/markitdown-helper.test.ts
```

Expected: FAIL because `packages/utility/markitdown/skill/scripts/convert_markitdown.py` does not exist.

- [ ] **Step 3: Create the helper script**

Create `packages/utility/markitdown/skill/scripts/convert_markitdown.py`:

```py
#!/usr/bin/env python3
"""Convert explicit inputs to Markdown with Microsoft MarkItDown."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ARCHIVE_SUFFIXES = {".zip", ".tar", ".tgz", ".gz", ".bz2", ".xz", ".7z", ".rar"}
REMOTE_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*://")
INSTALL_COMMAND = 'python -m pip install "markitdown[all]"'


@dataclass(frozen=True)
class Conversion:
    input: str
    output: str


@dataclass(frozen=True)
class Failure:
    input: str
    error: str


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    try:
        converter_class = load_markitdown()
    except ImportError:
        message = (
            "Microsoft MarkItDown is not installed. "
            f"Install it with: {INSTALL_COMMAND}"
        )
        if args.json:
            print(json.dumps({"converted": [], "failed": [{"input": "", "error": message}], "skipped": []}))
        else:
            print(message, file=sys.stderr)
        return 2

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    validation_error = validate_inputs(args.inputs, args.allow_remote, args.allow_archives)
    if validation_error is not None:
        print(validation_error, file=sys.stderr)
        return 1

    output_error = validate_outputs(args.inputs, output_dir, args.overwrite)
    if output_error is not None:
        print(output_error, file=sys.stderr)
        return 1

    converter = converter_class()
    converted: list[Conversion] = []
    failed: list[Failure] = []

    for source in args.inputs:
        output_path = output_path_for(source, output_dir)
        try:
            markdown = convert_input(converter, source, args.allow_remote)
            output_path.write_text(markdown.rstrip() + "\n", encoding="utf8")
            converted.append(Conversion(input=source, output=str(output_path)))
        except Exception as error:
            failed.append(Failure(input=source, error=str(error)))

    if args.json:
        print(
            json.dumps(
                {
                    "converted": [conversion.__dict__ for conversion in converted],
                    "failed": [failure.__dict__ for failure in failed],
                    "skipped": [],
                },
                indent=2,
            )
        )
    else:
        for conversion in converted:
            print(f"converted: {conversion.input} -> {conversion.output}")
        for failure in failed:
            print(f"failed: {failure.input}: {failure.error}", file=sys.stderr)

    return 1 if failed else 0


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert explicit inputs to Markdown with Microsoft MarkItDown.")
    parser.add_argument("inputs", nargs="+", help="Explicit file paths. Remote URIs require --allow-remote.")
    parser.add_argument("--output-dir", required=True, help="Directory where Markdown files will be written.")
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing existing Markdown output files.")
    parser.add_argument("--allow-remote", action="store_true", help="Allow remote URI inputs.")
    parser.add_argument("--allow-archives", action="store_true", help="Allow archive inputs such as .zip files.")
    parser.add_argument("--json", action="store_true", help="Emit a JSON summary.")
    return parser.parse_args(argv)


def load_markitdown() -> Any:
    from markitdown import MarkItDown

    return MarkItDown


def validate_inputs(inputs: list[str], allow_remote: bool, allow_archives: bool) -> str | None:
    for source in inputs:
        if is_remote(source):
            if not allow_remote:
                return f"Remote input requires --allow-remote: {source}"
            continue

        source_path = Path(source)
        if not source_path.exists():
            return f"Input does not exist: {source}"
        if not source_path.is_file():
            return f"Input must be an explicit file path: {source}"
        if is_archive(source_path) and not allow_archives:
            return f"Archive input requires --allow-archives: {source}"

    return None


def validate_outputs(inputs: list[str], output_dir: Path, overwrite: bool) -> str | None:
    seen: set[Path] = set()
    for source in inputs:
        output_path = output_path_for(source, output_dir)
        if output_path in seen:
            return f"Duplicate output path for input stem: {output_path}"
        seen.add(output_path)
        if output_path.exists() and not overwrite:
            return f"Output already exists; rerun with --overwrite to replace it: {output_path}"
    return None


def output_path_for(source: str, output_dir: Path) -> Path:
    if is_remote(source):
        stem = Path(source.rstrip("/")).stem or "remote"
    else:
        stem = Path(source).stem
    return output_dir / f"{stem}.md"


def convert_input(converter: Any, source: str, allow_remote: bool) -> str:
    if is_remote(source):
        if not allow_remote:
            raise ValueError(f"Remote input requires --allow-remote: {source}")
        result = converter.convert(source)
    elif hasattr(converter, "convert_local"):
        result = converter.convert_local(source)
    else:
        result = converter.convert(source)

    markdown = getattr(result, "text_content", None)
    if markdown is None:
        markdown = getattr(result, "markdown", None)
    if markdown is None:
        markdown = str(result)
    return str(markdown)


def is_remote(source: str) -> bool:
    return REMOTE_PATTERN.match(source) is not None


def is_archive(source_path: Path) -> bool:
    suffixes = [suffix.lower() for suffix in source_path.suffixes]
    return any(suffix in ARCHIVE_SUFFIXES for suffix in suffixes)


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run helper tests and fix only mismatches**

Run:

```bash
npm test -- tests/unit/markitdown-helper.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run package-content tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: PASS. The existing declared-source tests should now cover `skill/scripts/convert_markitdown.py` because the whole `skill` directory is packaged.

- [ ] **Step 6: Commit helper script**

```bash
git add tests/unit/markitdown-helper.test.ts packages/utility/markitdown/skill/scripts/convert_markitdown.py tests/unit/package-content.test.ts
git commit -m "test(utility): cover markitdown helper"
```

---

### Task 3: Registry Build Coverage

**Files:**
- Modify: `scripts/build-registry.ts`
- Modify: `tests/unit/build-registry.test.ts`

- [ ] **Step 1: Add failing registry expectations**

In `tests/unit/build-registry.test.ts`, add `utility/markitdown` to the expected package key list:

```ts
      "utility/markitdown",
```

Add this expected registry package entry:

```ts
        "utility/markitdown": {
          latest: "0.1.0",
          artifact: "packages/utility-markitdown-0.1.0.tgz",
        },
```

In `it("creates archives that extract to manifests and declared source content", async () => { ... })`, add this archive-content assertion:

```ts
    const markitdownArchivePath = path.join(outputRoot, "packages/utility-markitdown-0.1.0.tgz");
    const markitdownExtractedRoot = await extractPackageArchive(markitdownArchivePath);
    await expect(access(path.join(markitdownExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(
      access(path.join(markitdownExtractedRoot, "skill/scripts/convert_markitdown.py")),
    ).resolves.toBeUndefined();
```

- [ ] **Step 2: Run failing registry test**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: FAIL because `scripts/build-registry.ts` has not added `utility/markitdown` to `PACKAGE_ORDER`.

- [ ] **Step 3: Add MarkItDown to explicit package order**

In `scripts/build-registry.ts`, add the new package key after `utility/figma-use`:

```ts
    "utility/markitdown",
```

- [ ] **Step 4: Run registry test again**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit registry coverage**

```bash
git add scripts/build-registry.ts tests/unit/build-registry.test.ts
git commit -m "test(registry): include markitdown utility"
```

---

### Task 4: Install/List/Validate Integration

**Files:**
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Add a failing add-skill integration test**

In `tests/integration/utility-list-validate.test.ts`, add this constant near the other utility skill paths:

```ts
const markitdownSkillFile = path.join(".agents", "skills", "markitdown", "SKILL.md");
const markitdownHelperFile = path.join(
  ".agents",
  "skills",
  "markitdown",
  "scripts",
  "convert_markitdown.py",
);
```

Add this test inside `describe("utility, list, and validate commands", () => { ... })`:

```ts
  it("add-skill installs the markitdown utility with its helper script", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "markitdown", ci: true, registry: registryRoot });

    await expect(readText(markitdownSkillFile)).resolves.toContain("Microsoft MarkItDown");
    await expect(readText(markitdownHelperFile)).resolves.toContain("convert_local");

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "markitdown", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
    expect(lockfile.managedSkills).toEqual([
      { name: "markitdown", role: "utility", package: "utility/markitdown" },
    ]);

    await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });
  });
```

In the `list --available reports registry package ids and latest versions` test, add this line to the `expect.arrayContaining([...])` block:

```ts
        "utility/markitdown@0.1.0",
```

- [ ] **Step 2: Run the integration test**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: PASS after Tasks 1-3 are complete.

- [ ] **Step 3: Commit integration coverage**

```bash
git add tests/integration/utility-list-validate.test.ts
git commit -m "test(cli): install markitdown utility"
```

---

### Task 5: User-Facing Utility Guide

**Files:**
- Modify: `guides/utilities/support-utility-skills.md`

- [ ] **Step 1: Add a guide entry**

In `guides/utilities/support-utility-skills.md`, add this row to the `Common User-Installable Utilities` table:

```md
| `markitdown` | Convert explicit local documents to Markdown with Microsoft MarkItDown for LLM and text-analysis workflows. | `npx -y @nexidigital/nd-gen-skills add-skill markitdown` |
```

Add this short section after the documentation utility examples and before backend-specific utilities:

```md
### MarkItDown Document Conversion

Install the MarkItDown utility:

```bash
npx -y @nexidigital/nd-gen-skills add-skill markitdown
```

Example prompt:

```text
Use $markitdown to convert ./docs/source.pdf into Markdown under ./docs/converted.
Use local files only and do not overwrite existing output.
```

This utility follows Microsoft MarkItDown's official README and defaults to local file conversion. Remote inputs,
YouTube links, and archives require explicit user approval.
```

- [ ] **Step 2: Verify the guide references the utility**

Run:

```bash
rg -n "markitdown|MarkItDown" guides/utilities/support-utility-skills.md
```

Expected: output includes the table row, install command, and example prompt.

- [ ] **Step 3: Commit guide update**

```bash
git add guides/utilities/support-utility-skills.md
git commit -m "docs: document markitdown utility"
```

---

### Task 6: Registry Artifacts And Full Verification

**Files:**
- Modify: `dist-registry/index.yaml`
- Create: `dist-registry/packages/utility-markitdown-0.1.0.tgz`

- [ ] **Step 1: Build TypeScript**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 2: Rebuild registry artifacts**

Run:

```bash
npm run build:registry
```

Expected: PASS and creates `dist-registry/packages/utility-markitdown-0.1.0.tgz`.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: changes are limited to the new utility, tests, guide, registry builder, and generated registry outputs. No files under `packages/provider/` are modified.

- [ ] **Step 5: Inspect registry index entry**

Run:

```bash
rg -n "utility/markitdown|utility-markitdown-0.1.0.tgz" dist-registry/index.yaml
```

Expected: output contains both `utility/markitdown` and `packages/utility-markitdown-0.1.0.tgz`.

- [ ] **Step 6: Commit generated registry outputs**

```bash
git add dist-registry/index.yaml dist-registry/packages/utility-markitdown-0.1.0.tgz
git commit -m "build: refresh registry for markitdown utility"
```

---

## Final Verification Checklist

- [ ] `npm run build` passes.
- [ ] `npm run build:registry` passes.
- [ ] `npm test` passes.
- [ ] `rg -n "packages/provider/" <(git diff --name-only HEAD~6..HEAD)` returns no provider package edits, or inspect with `git diff --name-only HEAD~6..HEAD | rg "packages/provider/"` and expect no output.
- [ ] `dist-registry/index.yaml` contains `utility/markitdown`.
- [ ] `dist-registry/packages/utility-markitdown-0.1.0.tgz` exists.
- [ ] The helper script uses no shell command construction.
- [ ] The helper script rejects remote inputs by default.
- [ ] The helper script rejects archives by default.
- [ ] The helper script refuses overwrite by default.
- [ ] The skill links to the official Microsoft MarkItDown repository.

## Self-Review Against Spec

- User-installable package: covered by Tasks 1, 3, 4, and 6.
- Official Microsoft documentation baseline: covered by Task 1 skill text and Task 5 guide.
- Cross-platform helper: covered by Task 2 script design using `argparse`, `pathlib`, and no shell.
- Local-file default: covered by Task 2 validation and Task 1 skill safety rules.
- Missing dependency detection without install: covered by Task 2 missing dependency test and script return code 2.
- No provider edits: stated in file structure and final verification checklist.
- Focused tests: covered by package-content, helper, registry, and integration tasks.
- Registry artifacts: covered by Task 6.
