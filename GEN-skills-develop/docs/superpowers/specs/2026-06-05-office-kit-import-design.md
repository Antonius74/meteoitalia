# Office Kit Import Design

Date: 2026-06-05

## Context

The source folder `/Users/marcofasanella/Downloads/P20251122-claude-skills-main/document-skills` contains four document-focused skills:

- `docx`
- `pdf`
- `pptx`
- `xlsx`

The repository already supports user-installable utility skills under `packages/utility/*`. It also supports umbrella utilities through `requiresUtilities`, as shown by `documentation-kit`.

The user confirmed they have explicit authorization to copy and redistribute the downloaded materials in this repository/package registry. The source `LICENSE.txt` files must remain with the imported skill content.

## Goals

- Import all four source skills as utility packages.
- Keep the individual skill names generic: `docx`, `pdf`, `pptx`, and `xlsx`.
- Add an umbrella utility package named `office-kit`.
- Allow installing either one specific skill or the full bundle.
- Preserve source support files needed by each skill, including scripts, reference Markdown, schemas, and licenses.
- Keep provider skills under `packages/provider/` unchanged.
- Fit the existing installer, lockfile, registry, and validation model.

## Non-Goals

- Do not add a new package kind or tag mechanism.
- Do not merge all document skills into one large skill.
- Do not rename the leaf skills to namespaced alternatives such as `office-docx`.
- Do not edit upstream provider skills under `packages/provider/`.
- Do not add runtime variant auto-install behavior; these skills are manually added utilities.
- Do not add unsupported fields to utility manifests.

## Approved Direction

Use the existing reusable utility package model:

```text
packages/utility/docx/
  manifest.yaml
  skill/

packages/utility/pdf/
  manifest.yaml
  skill/

packages/utility/pptx/
  manifest.yaml
  skill/

packages/utility/xlsx/
  manifest.yaml
  skill/

packages/utility/office-kit/
  manifest.yaml
  skill/SKILL.md
```

The `docx`, `pdf`, `pptx`, and `xlsx` packages are independently installable utilities. The `office-kit` package is a lightweight umbrella utility that depends on the four leaf utilities.

Users can install one format-specific utility:

```bash
nd-gen-skills add-skill docx
nd-gen-skills add-skill pdf
nd-gen-skills add-skill pptx
nd-gen-skills add-skill xlsx
```

Users can install the full non-coding office/document bundle:

```bash
nd-gen-skills add-skill office-kit
```

Installing `office-kit` installs `office-kit` plus `docx`, `pdf`, `pptx`, and `xlsx` through the existing utility dependency closure.

## Utility Manifests

Each leaf utility should have `kind: utility`, `version: 0.1.0`, and `skill.source: skill`.

The umbrella manifest should declare:

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

The leaf skill descriptions should summarize the imported source skills without changing their triggering intent.

## Skill Content

Copy each source folder into the matching utility `skill/` directory:

- `document-skills/docx/*` to `packages/utility/docx/skill/*`
- `document-skills/pdf/*` to `packages/utility/pdf/skill/*`
- `document-skills/pptx/*` to `packages/utility/pptx/skill/*`
- `document-skills/xlsx/*` to `packages/utility/xlsx/skill/*`

Preserve `LICENSE.txt` in each imported skill folder.

Keep source support files when referenced or clearly useful:

- `docx`: `docx-js.md`, `ooxml.md`, `scripts/`, `ooxml/`
- `pdf`: `forms.md`, `reference.md`, `scripts/`
- `pptx`: `html2pptx.md`, `ooxml.md`, `scripts/`, `ooxml/`
- `xlsx`: `recalc.py`

Rewrite path references only where needed to make them package-local after installation. For example, references to legacy paths such as `skills/pptx/ooxml/scripts/unpack.py` should become `ooxml/scripts/unpack.py` or a similar relative path that works from the installed skill folder.

The `office-kit` skill body should be short. It should route requests to the format-specific skills and avoid duplicating the full source content.

## Registry And Documentation

Add these package keys to the deterministic registry order in `scripts/build-registry.ts`:

```text
utility/docx
utility/pdf
utility/pptx
utility/xlsx
utility/office-kit
```

Regenerate registry artifacts after implementation:

- `dist-registry/index.yaml`
- `dist-registry/packages/utility-docx-0.1.0.tgz`
- `dist-registry/packages/utility-pdf-0.1.0.tgz`
- `dist-registry/packages/utility-pptx-0.1.0.tgz`
- `dist-registry/packages/utility-xlsx-0.1.0.tgz`
- `dist-registry/packages/utility-office-kit-0.1.0.tgz`

Update utility documentation:

- Add `office-kit` to `guides/utilities/support-utility-skills.md`.
- Add a focused `guides/utilities/office-kit.md` guide.
- Document both usage modes: installing one specific skill and installing the umbrella bundle.

## Tests

Update existing tests rather than adding a new test layer.

Package content tests should verify:

- all five package roots exist
- all five manifests parse and have `kind: utility`
- each declared `skill.source` path exists
- `office-kit.requiresUtilities` is exactly `["docx", "pdf", "pptx", "xlsx"]`
- each imported leaf skill contains `SKILL.md`
- each imported leaf skill preserves `LICENSE.txt`

Registry tests should verify:

- all five package keys are emitted in `dist-registry/index.yaml`
- all five utility archives are generated

Utility dependency tests may use existing coverage unless a gap appears. The current dependency closure already supports umbrella utilities.

Run:

```bash
npm run build:registry
npm run build
npm test
```

## Risks And Controls

| Risk | Control |
| --- | --- |
| Imported skills contain old path assumptions | Search imported files for legacy path patterns and rewrite only the needed references |
| Source support files are accidentally omitted | Copy full source folders and assert declared source paths exist |
| Package archives become larger because of OOXML schemas | Accept the size for `docx` and `pptx`; each source folder is about 1.3 MB |
| Generic skill names collide with future utilities | User explicitly approved generic names; rely on package uniqueness and existing naming validation |
| License terms are lost during import | Preserve `LICENSE.txt` in every imported skill folder |
| Existing provider skill behavior drifts | Do not edit `packages/provider/*` |

## Acceptance Criteria

- `docx`, `pdf`, `pptx`, and `xlsx` are independently installable utility skills.
- `office-kit` installs all four leaf utilities through `requiresUtilities`.
- Imported support files and licenses are preserved.
- Registry output includes all five utility packages and archives.
- Utility documentation explains individual and umbrella install modes.
- Tests cover package presence, umbrella dependencies, registry output, and source path validity.
- `npm run build:registry`, `npm run build`, and `npm test` pass.
