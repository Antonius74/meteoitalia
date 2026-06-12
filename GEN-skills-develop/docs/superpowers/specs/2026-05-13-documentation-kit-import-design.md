# Documentation Kit Import Design

Date: 2026-05-13

## Context

`feat/ark` contains useful documentation workflow assets in the older `gen-skills` architecture:

- `skills/documentation-kit`
- `skills/documentation-design-kit`
- `skills/documentation-ubiquitous-language`
- `references/documentation-core`

`feat/ark_v2` contains the new TypeScript `nd-gen-skills` architecture with package sources under `packages/{provider,contract,variant,utility}` and generated archives under `dist-registry/`.

This design imports the best documentation content from `feat/ark` while preserving the new architecture. It does not bring over the old Python installer, `package.toml` workspace model, adapter templates, or schema-heavy documentation library.

## Goals

- Preserve old public documentation skill names to minimize migration friction.
- Import documentation utilities into the new utility package model.
- Import `documentation-core` as a slim contract package.
- Preserve old `skill_dependencies` behavior for `documentation-kit`.
- Keep V1 simple by retaining only documentation templates and validation scripts from `documentation-core`.
- Keep the generated registry deterministic and compatible with existing install, sync, list, validate, add-skill, and remove-skill commands.

## Non-Goals

- Import the old Python `skillctl` architecture.
- Preserve `package.toml` manifests.
- Preserve old adapter templates.
- Support schema-backed documentation validation in V1.
- Import `references/documentation-core/standards`, `schemas`, or `partials`.
- Rename documentation skills into the Nexi namespace.
- Auto-remove contract packages when utilities are removed.

## Package Shape

The import adds these package sources:

```text
packages/contract/documentation-core/
  manifest.yaml
  skill/
    SKILL.md
    templates/
    scripts/

packages/utility/documentation-kit/
  manifest.yaml
  skill/SKILL.md

packages/utility/documentation-design-kit/
  manifest.yaml
  skill/SKILL.md

packages/utility/documentation-ubiquitous-language/
  manifest.yaml
  skill/SKILL.md
```

Public package and skill names stay exactly compatible with the old branch:

```text
documentation-core
documentation-kit
documentation-design-kit
documentation-ubiquitous-language
```

`documentation-core` is a contract package because it provides shared reference material for other skills. The three `documentation-*` kits are utility packages because users can install them independently with `add-skill`.

## Slim Documentation Core

`documentation-core` keeps only the useful portable assets:

- `templates/`
- `scripts/`
- a thin `SKILL.md` index

The imported templates are cleaned so they do not link to removed `schemas`, `standards`, or `partials` folders. Template comments may keep stable template identifiers, but they must not point to missing files.

The contract skill entrypoint explains that this package is a shared reference library, not a normal user task workflow. It should point agents to retained template families:

- `templates/readme/`
- `templates/architecture/`
- `templates/workflow/`
- `templates/design/`
- `templates/plan/`

The retained `scripts/validate.sh` is simplified to validate only the slim contract:

- expected template folders exist
- expected template files exist
- removed old folders are not referenced by retained files
- local Markdown links inside retained docs are valid where practical

Schemas can return later if template-backed machine validation becomes valuable. V1 treats templates as the documentation contract.

## Utility Skill Behavior

`documentation-kit` is the umbrella documentation utility. It covers repository README, repository architecture, repository or local workflow docs, general plans, execution plans, and routing to specialized documentation skills.

`documentation-design-kit` owns `DESIGN.md` and design-to-code documentation for UI-bearing repositories. It references only retained design templates from `documentation-core`.

`documentation-ubiquitous-language` remains mostly self-contained. It creates or updates repository-level `docs/UBIQUITOUS_LANGUAGE.md` and does not require templates unless a future version adds one.

All imported skill bodies are remapped to the new architecture:

- no `{{shared_root}}` placeholders
- no references to old adapter templates
- no references to removed schemas, standards, or partials
- references to shared templates use installed skill-relative paths such as `../documentation-core/templates/...`
- bodies keep concise triggers, clear usage boundaries, step-by-step process, and output rules

## Utility Dependency Semantics

The new architecture adds dependency support for utility manifests:

```yaml
requiresContracts:
  - documentation-core
requiresUtilities:
  - documentation-design-kit
  - documentation-ubiquitous-language
```

`documentation-kit` declares both `documentation-core` and its utility dependencies. `documentation-design-kit` declares `documentation-core`. `documentation-ubiquitous-language` can remain standalone unless it later needs shared templates.

`add-skill documentation-kit` installs:

```text
contract/documentation-core
utility/documentation-kit
utility/documentation-design-kit
utility/documentation-ubiquitous-language
```

The lockfile tracks requested and transitive utilities:

```yaml
utilities:
  - name: documentation-kit
    version: 1.1.0
    requested: true
  - name: documentation-design-kit
    version: 1.1.0
    requested: false
    requiredBy:
      - documentation-kit
```

If a user explicitly adds a transitive utility, it becomes `requested: true` and is preserved when the parent utility is removed.

## Remove Behavior

`remove-skill documentation-kit` removes `documentation-kit` and any transitive utility dependencies that are no longer required by another requested utility.

Contracts are not auto-removed in V1. After removing the final documentation utility, `documentation-core` remains installed until a future explicit contract-removal command exists.

This keeps removal predictable and avoids unexpectedly deleting shared reference material that may be required by multiple packages.

## Installer And Validation Changes

The installer gains a small utility dependency resolver.

For `add-skill`:

1. Load the requested utility package.
2. Recursively load `requiresUtilities`.
3. Load `requiresContracts`.
4. Merge resolved utilities and contracts with the existing lockfile.
5. Mark only the requested utility as `requested: true`.
6. Preserve existing requested utilities.
7. Apply normal managed-file safety rules.

For `remove-skill`:

1. Mark the requested utility as no longer requested.
2. Recompute utility dependency closure from remaining requested utilities.
3. Remove utilities that are neither requested nor required.
4. Keep installed contracts.
5. Apply normal managed-file hash checks and folder safety rules.

For `sync` and `validate`:

- resolve utility dependency closure from requested utilities
- detect missing required utility dependencies
- detect missing required contracts
- verify documentation utility and contract files against registry artifacts
- keep `AGENTS.md` simple by listing installed utility skills without explaining dependency internals

## Migration From `feat/ark`

Keep and adapt:

```text
skills/documentation-kit/src/body.md
skills/documentation-design-kit/src/body.md
skills/documentation-ubiquitous-language/SKILL.md
references/documentation-core/templates/
references/documentation-core/scripts/validate.sh
```

Drop for V1:

```text
package.toml files
adapter templates
references/documentation-core/schemas/
references/documentation-core/standards/
references/documentation-core/partials/
old Python installer and skillctl model
```

The imported documentation content should be edited for clarity rather than copied blindly. If a sentence depends on removed folders or old installer behavior, rewrite it to match the new package model.

## Testing

Automated coverage should include:

- package manifest parsing for `requiresContracts` and `requiresUtilities`
- registry build includes `documentation-core` and the three documentation utilities
- `add-skill documentation-kit` installs all expected utilities and `documentation-core`
- `remove-skill documentation-kit` removes unused transitive utilities and keeps `documentation-core`
- explicitly requested dependency utilities are preserved
- `validate` fails when required utility dependencies or contracts are missing
- `sync` restores drifted documentation utility and contract files
- package content tests verify slim `documentation-core` has no references to removed folders

## Open Extension Points

Future versions may add:

- schema-backed documentation validation
- explicit `remove-contract`
- utility dependency version constraints beyond latest bundled versions
- documentation profiles for repository-specific conventions
- remote registry support for documentation packages through Artifactory
