# Office Kit Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the downloaded `docx`, `pdf`, `pptx`, and `xlsx` document skills as installable utilities, with `office-kit` as an umbrella utility that installs all four.

**Architecture:** Use the existing utility package model under `packages/utility/*`. The four leaf packages contain the imported skill folders, and `office-kit` is a lightweight routing skill whose manifest depends on the four leaf utilities through `requiresUtilities`.

**Tech Stack:** Node 20, TypeScript, Vitest, YAML manifests, `scripts/build-registry.ts`, existing `add-skill` utility dependency closure.

---

## Source Spec

Implement [Office Kit Import Design](../specs/2026-06-05-office-kit-import-design.md).

## File Structure

- Create `packages/utility/docx/manifest.yaml`: manifest for the independently installable DOCX utility.
- Create `packages/utility/docx/skill/`: copied source skill content from `/Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/docx`.
- Create `packages/utility/pdf/manifest.yaml`: manifest for the independently installable PDF utility.
- Create `packages/utility/pdf/skill/`: copied source skill content from `/Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/pdf`.
- Create `packages/utility/pptx/manifest.yaml`: manifest for the independently installable PPTX utility.
- Create `packages/utility/pptx/skill/`: copied source skill content from `/Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/pptx`.
- Create `packages/utility/xlsx/manifest.yaml`: manifest for the independently installable XLSX utility.
- Create `packages/utility/xlsx/skill/`: copied source skill content from `/Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/xlsx`.
- Create `packages/utility/office-kit/manifest.yaml`: umbrella utility manifest with `requiresUtilities: ["docx", "pdf", "pptx", "xlsx"]`.
- Create `packages/utility/office-kit/skill/SKILL.md`: short routing guidance for non-coding office document work.
- Modify `scripts/build-registry.ts`: add five utility package keys to deterministic order.
- Modify `tests/unit/package-content.test.ts`: add package roots, expected manifest identities, manifest assertions, source path checks, license checks.
- Modify `tests/unit/build-registry.test.ts`: add expected package keys and registry package entries.
- Modify `tests/integration/utility-list-validate.test.ts`: add an `add-skill office-kit` integration test proving the umbrella installs all leaf utilities.
- Modify `guides/utilities/support-utility-skills.md`: document `office-kit` in common utilities and usage examples.
- Create `guides/utilities/office-kit.md`: focused install and usage guide.
- Regenerate `dist-registry/index.yaml` and the five new utility archives.

Do not edit anything under `packages/provider/`.

### Task 1: Package Content Tests

**Files:**
- Modify: `tests/unit/package-content.test.ts`

- [ ] **Step 1: Add failing package root expectations**

In `tests/unit/package-content.test.ts`, add these entries to `packageRoots` immediately after the existing platform utilities and before `packages/utility/read-jira-issue`:

```ts
  "packages/utility/docx",
  "packages/utility/pdf",
  "packages/utility/pptx",
  "packages/utility/xlsx",
  "packages/utility/office-kit",
```

Add these entries to `expectedPackages` in the same relative position:

```ts
  { root: "packages/utility/docx", kind: "utility", name: "docx" },
  { root: "packages/utility/pdf", kind: "utility", name: "pdf" },
  { root: "packages/utility/pptx", kind: "utility", name: "pptx" },
  { root: "packages/utility/xlsx", kind: "utility", name: "xlsx" },
  { root: "packages/utility/office-kit", kind: "utility", name: "office-kit" },
```

- [ ] **Step 2: Add exact manifest contract assertions**

In the `declares exact contract, variant, and utility manifest contracts` test, after the `androidInspector` assertion and before the caveman loop, add:

```ts
    const docx = await readManifest("packages/utility/docx");
    expect(docx.kind).toBe("utility");
    expect(docx.description).toBe("Create, edit, review, and analyze Word DOCX documents.");
    expect(docx.requiresContracts).toEqual([]);
    expect(docx.requiresUtilities).toEqual([]);
    expect(docx.skill).toEqual({ name: "docx", source: "skill" });

    const pdf = await readManifest("packages/utility/pdf");
    expect(pdf.kind).toBe("utility");
    expect(pdf.description).toBe("Extract, generate, split, merge, analyze, and fill PDF documents and forms.");
    expect(pdf.requiresContracts).toEqual([]);
    expect(pdf.requiresUtilities).toEqual([]);
    expect(pdf.skill).toEqual({ name: "pdf", source: "skill" });

    const pptx = await readManifest("packages/utility/pptx");
    expect(pptx.kind).toBe("utility");
    expect(pptx.description).toBe("Create, edit, analyze, and convert PowerPoint PPTX presentations.");
    expect(pptx.requiresContracts).toEqual([]);
    expect(pptx.requiresUtilities).toEqual([]);
    expect(pptx.skill).toEqual({ name: "pptx", source: "skill" });

    const xlsx = await readManifest("packages/utility/xlsx");
    expect(xlsx.kind).toBe("utility");
    expect(xlsx.description).toBe("Create, edit, analyze, recalculate, and validate spreadsheet workbooks.");
    expect(xlsx.requiresContracts).toEqual([]);
    expect(xlsx.requiresUtilities).toEqual([]);
    expect(xlsx.skill).toEqual({ name: "xlsx", source: "skill" });

    const officeKit = await readManifest("packages/utility/office-kit");
    expect(officeKit.kind).toBe("utility");
    expect(officeKit.description).toBe(
      "Install office document skills for Word, PDF, PowerPoint, and spreadsheet work.",
    );
    expect(officeKit.requiresContracts).toEqual([]);
    expect(officeKit.requiresUtilities).toEqual(["docx", "pdf", "pptx", "xlsx"]);
    expect(officeKit.skill).toEqual({ name: "office-kit", source: "skill" });
```

- [ ] **Step 3: Add imported license preservation test**

Add this test after `keeps declared skills discoverable with matching frontmatter`:

```ts
  it("preserves licenses for imported office document skills", async () => {
    for (const utilityName of ["docx", "pdf", "pptx", "xlsx"]) {
      await expect(access(join("packages/utility", utilityName, "skill", "LICENSE.txt"))).resolves.toBeUndefined();
    }
  });
```

- [ ] **Step 4: Run the package content test and verify it fails**

Run:

```bash
npm test -- tests/unit/package-content.test.ts
```

Expected: FAIL because `packages/utility/docx`, `packages/utility/pdf`, `packages/utility/pptx`, `packages/utility/xlsx`, and `packages/utility/office-kit` do not exist yet.

- [ ] **Step 5: Keep the failing package content tests uncommitted**

Run:

```bash
git status --short
```

Expected: `tests/unit/package-content.test.ts` is modified. Do not commit yet; Task 3 commits these tests together with the implementation that makes them pass.

### Task 2: Registry Tests And Package Order

**Files:**
- Modify: `tests/unit/build-registry.test.ts`
- Modify: `scripts/build-registry.ts`

- [ ] **Step 1: Add failing registry expectations**

In `tests/unit/build-registry.test.ts`, add the office utility package keys to the expected `Object.keys(index.packages)` array after `utility/mobile-android-layout-inspector` and before `utility/read-jira-issue`:

```ts
      "utility/docx",
      "utility/pdf",
      "utility/pptx",
      "utility/xlsx",
      "utility/office-kit",
```

Add matching entries to the expected `packages` object:

```ts
        "utility/docx": {
          latest: "0.1.0",
          artifact: "packages/utility-docx-0.1.0.tgz",
        },
        "utility/pdf": {
          latest: "0.1.0",
          artifact: "packages/utility-pdf-0.1.0.tgz",
        },
        "utility/pptx": {
          latest: "0.1.0",
          artifact: "packages/utility-pptx-0.1.0.tgz",
        },
        "utility/xlsx": {
          latest: "0.1.0",
          artifact: "packages/utility-xlsx-0.1.0.tgz",
        },
        "utility/office-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-office-kit-0.1.0.tgz",
        },
```

- [ ] **Step 2: Add archive extraction assertions**

In the `creates archives that extract to manifests and declared source content` test, after existing utility archive extraction checks, add:

```ts
    const officeArchivePath = path.join(outputRoot, "packages/utility-office-kit-0.1.0.tgz");
    const officeExtractedRoot = await extractPackageArchive(officeArchivePath);
    await expect(access(path.join(officeExtractedRoot, "manifest.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(officeExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();

    const docxArchivePath = path.join(outputRoot, "packages/utility-docx-0.1.0.tgz");
    const docxExtractedRoot = await extractPackageArchive(docxArchivePath);
    await expect(access(path.join(docxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(docxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(access(path.join(docxExtractedRoot, "skill/ooxml/scripts/unpack.py"))).resolves.toBeUndefined();

    const pdfArchivePath = path.join(outputRoot, "packages/utility-pdf-0.1.0.tgz");
    const pdfExtractedRoot = await extractPackageArchive(pdfArchivePath);
    await expect(access(path.join(pdfExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(pdfExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(access(path.join(pdfExtractedRoot, "skill/scripts/fill_fillable_fields.py"))).resolves.toBeUndefined();

    const pptxArchivePath = path.join(outputRoot, "packages/utility-pptx-0.1.0.tgz");
    const pptxExtractedRoot = await extractPackageArchive(pptxArchivePath);
    await expect(access(path.join(pptxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(pptxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(access(path.join(pptxExtractedRoot, "skill/scripts/html2pptx.js"))).resolves.toBeUndefined();

    const xlsxArchivePath = path.join(outputRoot, "packages/utility-xlsx-0.1.0.tgz");
    const xlsxExtractedRoot = await extractPackageArchive(xlsxArchivePath);
    await expect(access(path.join(xlsxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(xlsxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(access(path.join(xlsxExtractedRoot, "skill/recalc.py"))).resolves.toBeUndefined();
```

- [ ] **Step 3: Run the registry test and verify it fails**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: FAIL because the package roots and package-order entries are missing.

- [ ] **Step 4: Add deterministic package order**

In `scripts/build-registry.ts`, add these entries to `PACKAGE_ORDER` after `utility/mobile-android-layout-inspector` and before `utility/read-jira-issue`:

```ts
    "utility/docx",
    "utility/pdf",
    "utility/pptx",
    "utility/xlsx",
    "utility/office-kit",
```

- [ ] **Step 5: Run the registry test and verify it still fails only for missing packages**

Run:

```bash
npm test -- tests/unit/build-registry.test.ts
```

Expected: FAIL because package roots are still missing. There should be no TypeScript syntax error.

- [ ] **Step 6: Keep registry test and order changes uncommitted**

Run:

```bash
git status --short
```

Expected: `tests/unit/build-registry.test.ts`, `scripts/build-registry.ts`, and `tests/unit/package-content.test.ts` are modified. Do not commit yet; Task 3 commits these changes with the package implementation.

### Task 3: Create Utility Packages

**Files:**
- Create: `packages/utility/docx/manifest.yaml`
- Create: `packages/utility/docx/skill/**`
- Create: `packages/utility/pdf/manifest.yaml`
- Create: `packages/utility/pdf/skill/**`
- Create: `packages/utility/pptx/manifest.yaml`
- Create: `packages/utility/pptx/skill/**`
- Create: `packages/utility/xlsx/manifest.yaml`
- Create: `packages/utility/xlsx/skill/**`
- Create: `packages/utility/office-kit/manifest.yaml`
- Create: `packages/utility/office-kit/skill/SKILL.md`

- [ ] **Step 1: Copy imported source skills into package-local skill directories**

Run:

```bash
mkdir -p packages/utility/docx packages/utility/pdf packages/utility/pptx packages/utility/xlsx
cp -R /Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/docx packages/utility/docx/skill
cp -R /Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/pdf packages/utility/pdf/skill
cp -R /Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/pptx packages/utility/pptx/skill
cp -R /Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills/xlsx packages/utility/xlsx/skill
```

- [ ] **Step 2: Create leaf utility manifests**

Create `packages/utility/docx/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: docx
version: 0.1.0
description: Create, edit, review, and analyze Word DOCX documents.
requiresContracts: []
requiresUtilities: []
skill:
  name: docx
  source: skill
```

Create `packages/utility/pdf/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: pdf
version: 0.1.0
description: Extract, generate, split, merge, analyze, and fill PDF documents and forms.
requiresContracts: []
requiresUtilities: []
skill:
  name: pdf
  source: skill
```

Create `packages/utility/pptx/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: pptx
version: 0.1.0
description: Create, edit, analyze, and convert PowerPoint PPTX presentations.
requiresContracts: []
requiresUtilities: []
skill:
  name: pptx
  source: skill
```

Create `packages/utility/xlsx/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: xlsx
version: 0.1.0
description: Create, edit, analyze, recalculate, and validate spreadsheet workbooks.
requiresContracts: []
requiresUtilities: []
skill:
  name: xlsx
  source: skill
```

- [ ] **Step 3: Create office-kit manifest and skill**

Create `packages/utility/office-kit/manifest.yaml`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: office-kit
version: 0.1.0
description: Install office document skills for Word, PDF, PowerPoint, and spreadsheet work.
requiresContracts: []
requiresUtilities:
  - docx
  - pdf
  - pptx
  - xlsx
skill:
  name: office-kit
  source: skill
```

Create `packages/utility/office-kit/skill/SKILL.md`:

```markdown
---
name: office-kit
description: Install and route non-coding office document work across Word, PDF, PowerPoint, and spreadsheet skills.
---

# Office Kit

Use this umbrella skill when a user asks for non-coding document, presentation, PDF, or spreadsheet work and wants the full office-document toolset installed together.

## Installed Skills

`office-kit` installs these focused utility skills:

- `docx`: Word document creation, editing, tracked changes, comments, formatting preservation, and text extraction.
- `pdf`: PDF text and table extraction, PDF generation, merging, splitting, form inspection, and form filling.
- `pptx`: PowerPoint presentation creation, editing, analysis, slide layout work, speaker notes, comments, and conversion.
- `xlsx`: Spreadsheet creation, editing, analysis, formulas, formatting, visualization, and recalculation.

## Routing

Use the focused skill directly when the task names a concrete file type:

- Use `docx` for `.docx` and Word-document tasks.
- Use `pdf` for `.pdf` tasks.
- Use `pptx` for `.pptx` and PowerPoint tasks.
- Use `xlsx` for `.xlsx`, `.xlsm`, `.csv`, `.tsv`, and spreadsheet tasks.

For mixed office workflows, use all relevant focused skills and keep outputs format-specific.
```

- [ ] **Step 4: Rewrite legacy path references**

Run:

```bash
rg -n "skills/(docx|pdf|pptx|xlsx)|document-skills|claude-skills" packages/utility/docx packages/utility/pdf packages/utility/pptx packages/utility/xlsx
```

Expected before cleanup: at least the PPTX skill may reference `skills/pptx/ooxml/scripts/unpack.py`.

Change any installed-path assumptions so they are relative to the skill folder. The known PPTX change should be:

```diff
- **Note**: The unpack.py script is located at `skills/pptx/ooxml/scripts/unpack.py` relative to the project root. If the script doesn't exist at this path, use `find . -name "unpack.py"` to locate it.
+ **Note**: The unpack.py script is located at `ooxml/scripts/unpack.py` relative to this skill folder. If the script doesn't exist at this path, use `find . -name "unpack.py"` to locate it.
```

- [ ] **Step 5: Run package and registry tests**

Run:

```bash
npm test -- tests/unit/package-content.test.ts tests/unit/build-registry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit utility package implementation and passing unit tests**

Run:

```bash
git add tests/unit/package-content.test.ts tests/unit/build-registry.test.ts scripts/build-registry.ts packages/utility/docx packages/utility/pdf packages/utility/pptx packages/utility/xlsx packages/utility/office-kit
git commit -m "feat(utility): add office document skills"
```

### Task 4: Integration Test For Umbrella Install

**Files:**
- Modify: `tests/integration/utility-list-validate.test.ts`

- [ ] **Step 1: Add office skill file constants**

Near the existing documentation and caveman utility constants, add:

```ts
const officeUtilityNames = ["office-kit", "docx", "pdf", "pptx", "xlsx"];
```

- [ ] **Step 2: Add office-kit add-skill test**

After the existing `add-skill caveman installs the full caveman utility family` test, add:

```ts
  it("add-skill office-kit installs the full office document utility family", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "office-kit", ci: true, registry: registryRoot });

    for (const utilityName of officeUtilityNames) {
      await expect(readText(path.join(".agents", "skills", utilityName, "SKILL.md"))).resolves.toContain(
        `name: ${utilityName}`,
      );
    }

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "office-kit", version: "0.1.0", requested: true, requiredBy: [] },
      { name: "docx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "pdf", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "pptx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "xlsx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
    ]);
  });
```

- [ ] **Step 3: Run the integration test**

Run:

```bash
npm test -- tests/integration/utility-list-validate.test.ts
```

Expected: PASS after Task 3 exists. If the utility order differs, inspect `src/commands/utility-dependencies.ts`; preserve the existing dependency traversal and update the expected lockfile order only if it matches actual deterministic traversal.

- [ ] **Step 4: Commit integration coverage**

Run:

```bash
git add tests/integration/utility-list-validate.test.ts
git commit -m "test: cover office kit utility install"
```

### Task 5: Utility Documentation

**Files:**
- Modify: `guides/utilities/support-utility-skills.md`
- Create: `guides/utilities/office-kit.md`

- [ ] **Step 1: Add office-kit to support utility table**

In `guides/utilities/support-utility-skills.md`, add this row to the `Common User-Installable Utilities` table near the documentation utilities:

```markdown
| `office-kit` | Umbrella office-document workflow for Word, PDF, PowerPoint, and spreadsheet tasks. | `npx -y @nexidigital/nd-gen-skills add-skill office-kit` |
```

- [ ] **Step 2: Add focused office-kit guide**

Create `guides/utilities/office-kit.md`:

```markdown
# Office Kit

Use this guide when a repository needs non-coding office document support with `office-kit`.

`office-kit` is the umbrella utility for Word documents, PDFs, PowerPoint presentations, and spreadsheets.

## What It Installs

Install `office-kit` when you want one entry point for office document work rather than adding each format skill separately.

It installs:

- `office-kit`
- `docx`
- `pdf`
- `pptx`
- `xlsx`

The utility is installed as a managed skill and tracked in the tool-specific lockfile.

For Codex, files are written under `.agents/skills` and tracked in `.agents/nd-gen-skills.lock.yaml`.

For Claude, files are written under `.claude/skills` and tracked in `.claude/nd-gen-skills.lock.yaml`.

The installer also updates the managed Nexi block in root `AGENTS.md`.

## Install The Full Bundle

From the target repository, install the utility for Codex:

```bash
npx -y @nexidigital/nd-gen-skills add-skill office-kit
```

Install the same utility for Claude:

```bash
npx -y @nexidigital/nd-gen-skills add-skill office-kit --tool claude
```

Validate the managed state after install:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

## Install One Specific Skill

Install only the format-specific skill when a repository needs one office format:

```bash
npx -y @nexidigital/nd-gen-skills add-skill docx
npx -y @nexidigital/nd-gen-skills add-skill pdf
npx -y @nexidigital/nd-gen-skills add-skill pptx
npx -y @nexidigital/nd-gen-skills add-skill xlsx
```

For Claude, add `--tool claude`.

## Install From A Local Tarball

Build the tarball from this repository:

```bash
npm ci
npm run prepare
mkdir -p dist
npm run pack
```

Set the tarball path:

```bash
TARBALL="$(ls -t "$PWD"/dist/nexidigital-nd-gen-skills-*.tgz | head -n 1)"
```

From the target repository, install the full bundle:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill office-kit
```

Install one specific skill:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill docx
```

## How To Use It

After install, call the focused skill that matches the file type:

```text
Use $docx to review this Word document and propose tracked changes.
```

```text
Use $pdf to extract form fields from this PDF and prepare filled values.
```

```text
Use $pptx to create a PowerPoint deck from this outline.
```

```text
Use $xlsx to analyze this workbook and recalculate formulas.
```

Use `office-kit` as the umbrella entry point for mixed office workflows:

```text
Use $office-kit for this office-document workflow. Create the spreadsheet, export summary tables, and prepare a PowerPoint presentation.
```

## Related Guides

- [Support utility skills](support-utility-skills.md)
- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Release process](../install/release-process.md)
```

- [ ] **Step 3: Link office-kit from related guides**

In `guides/utilities/support-utility-skills.md`, add `- [Office Kit](office-kit.md)` to the `Related Guides` list.

- [ ] **Step 4: Commit documentation**

Run:

```bash
git add guides/utilities/support-utility-skills.md guides/utilities/office-kit.md
git commit -m "docs: add office kit utility guide"
```

### Task 6: Registry Artifacts And Full Verification

**Files:**
- Modify: `dist-registry/index.yaml`
- Create: `dist-registry/packages/utility-docx-0.1.0.tgz`
- Create: `dist-registry/packages/utility-pdf-0.1.0.tgz`
- Create: `dist-registry/packages/utility-pptx-0.1.0.tgz`
- Create: `dist-registry/packages/utility-xlsx-0.1.0.tgz`
- Create: `dist-registry/packages/utility-office-kit-0.1.0.tgz`

- [ ] **Step 1: Regenerate registry artifacts**

Run:

```bash
npm run build:registry
```

Expected: command exits 0 and writes the updated registry index plus five new utility archives.

- [ ] **Step 2: Verify registry entries**

Run:

```bash
rg -n "utility/(docx|pdf|pptx|xlsx|office-kit)|utility-(docx|pdf|pptx|xlsx|office-kit)-0\\.1\\.0\\.tgz" dist-registry/index.yaml
```

Expected output includes all five package keys and all five archive names.

- [ ] **Step 3: Run full build**

Run:

```bash
npm run build
```

Expected: PASS with TypeScript compilation complete.

- [ ] **Step 4: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS for all Vitest suites.

- [ ] **Step 5: Review changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: changed files are limited to office-kit implementation, tests, docs, registry artifacts, and any pre-existing unrelated branch changes already committed before this plan execution.

- [ ] **Step 6: Commit registry artifacts**

Run:

```bash
git add dist-registry/index.yaml dist-registry/packages/utility-docx-0.1.0.tgz dist-registry/packages/utility-pdf-0.1.0.tgz dist-registry/packages/utility-pptx-0.1.0.tgz dist-registry/packages/utility-xlsx-0.1.0.tgz dist-registry/packages/utility-office-kit-0.1.0.tgz
git commit -m "build: refresh registry for office kit"
```

## Final Verification

Run these commands after all tasks are complete:

```bash
npm run build:registry
npm run build
npm test
git status --short
```

Expected:

- registry build exits 0
- TypeScript build exits 0
- all Vitest tests pass
- `git status --short` is clean or contains only intentional local files that are not part of the office-kit feature

## Implementation Notes

- Preserve `LICENSE.txt` for each imported leaf skill.
- Do not add `license` to `manifest.yaml`; the manifest schema rejects unsupported fields.
- Keep generic names `docx`, `pdf`, `pptx`, and `xlsx`; this was explicitly approved.
- Do not edit `packages/provider/*`.
- If a copied source file refers to a dependency that is not available locally, do not vendor that dependency in this task. Preserve the skill guidance and document runtime expectations through the skill content.
