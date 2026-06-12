# Workflow Stack Provider Design

Date: 2026-05-13

## Context

The current `feat/ark_v2` architecture packages skills as typed registry packages under `packages/` and installs them
through a TypeScript CLI. It already supports provider packages, variant runtime packages, contracts, and utilities.

The old `feat/ark` branch contains a Python-era `workflow-stack` installer alias. That alias expanded to a group of
workflow skills:

- `workflow-planning-kit`
- `workflow-architecture-kit`
- `workflow-development-kit`
- `workflow-test-design-kit`
- `workflow-orchestration-kit`
- `workflow-us-quality-assessment-kit`

The old stack also depended on shared workflow-core templates, schemas, role contracts, init scripts, and helper skills
such as `grill-me`, `tdd`, and `figma-use`.

The new goal is to import the old workflow-stack as a new provider in the current architecture. It must not be treated
as a Superpowers variant, and it must not require changes to unrelated skills or unrelated architecture areas.

## Goals

- Add `workflow-stack` as a first-class provider package in the new registry architecture.
- Preserve the old workflow-stack skill names.
- Remap old workflow-stack content so it works as static installed skills in the new package model.
- Allow `install --provider workflow-stack` while keeping the existing default provider behavior unchanged.
- Make variant runtime glue provider-neutral enough to support both the default provider and `workflow-stack`.
- Keep helper skills as utilities when they are cross-cutting helpers rather than workflow-stack-owned workflow skills.
- Attach `figma-use` to UI-bearing variant runtimes, not to the workflow-stack provider.
- Add focused validation and test coverage for provider selection, provider-required utilities, variant-required utilities,
  package content, and sync behavior.

## Non-Goals

- Do not rename workflow-stack skills to Superpowers-compatible names.
- Do not change the Superpowers provider package or Superpowers sync behavior.
- Do not revive the old Python package installer.
- Do not add generic runtime body rendering to the installer.
- Do not make workflow-stack depend on `figma-use`.
- Do not change existing utility behavior except where required to support provider-required and variant-required utility
  metadata.
- Do not rewrite variant runtime testing, command-discovery, traceability, or platform guidance except for the minimal
  provider-neutral workflow glue and UI-runtime `figma-use` availability notes required by this design.
- Do not import `mobile-android-layout-inspector` as part of this provider. It was a variant-specific extra in the old
  branch and can become a separate utility later if needed.

## Approved Direction

Use a first-class provider import.

`workflow-stack` becomes `packages/provider/workflow-stack`. The provider contains the workflow-stack-owned skills and
the shared workflow-core support skill. The installer selects it only when the user passes `--provider workflow-stack`.

Default provider selection remains unchanged:

```bash
nd-gen-skills install --variant frontend-react
```

Workflow-stack install is explicit:

```bash
nd-gen-skills install --variant frontend-react --provider workflow-stack
```

The lockfile records the selected provider, and `sync` keeps using the provider recorded in the lockfile. UI-bearing
variant installs also include their required `figma-use` utility, regardless of which provider is selected.

## Package Layout

The provider package is shaped like this:

```text
packages/provider/workflow-stack/
  manifest.yaml
  skills/
    workflow-core-kit/
      SKILL.md
      README.md
      manifest.yaml
      references/
      schemas/
      scripts/
      templates/
    workflow-planning-kit/
      SKILL.md
      scripts/init_planning.py
      examples/example-requirements.md
    workflow-architecture-kit/
      SKILL.md
      scripts/init_architecture.py
      examples/example-implementation-plan.md
    workflow-development-kit/
      SKILL.md
      examples/example-fix-request.md
    workflow-test-design-kit/
      SKILL.md
      scripts/init_test_design.py
      examples/example-test-cases.md
    workflow-orchestration-kit/
      SKILL.md
      scripts/init_orchestration.py
    workflow-us-quality-assessment-kit/
      SKILL.md
      resources/report-template.md
```

The old `references/workflow-core` content is remapped into the installed support skill `workflow-core-kit`. Other
workflow-stack skills refer to it via sibling paths such as `../workflow-core-kit/templates/...`.

## Provider Manifest

`packages/provider/workflow-stack/manifest.yaml` uses `kind: provider`.

The manifest declares workflow-stack-owned skills:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: provider
name: workflow-stack
version: 0.1.0

requiresUtilities:
  - grill-me
  - tdd

capabilities:
  requirements-design:
    skill: workflow-planning-kit
  planning:
    skill: workflow-architecture-kit
  execution:
    skill: workflow-development-kit
  tdd:
    skill: workflow-development-kit
  debugging:
    skill: workflow-development-kit
  verification:
    skill: workflow-test-design-kit
  code-review:
    skill: workflow-orchestration-kit
  finishing:
    skill: workflow-orchestration-kit
  orchestration:
    skill: workflow-orchestration-kit
  functional-quality:
    skill: workflow-us-quality-assessment-kit

skills:
  - name: workflow-core-kit
    role: support
    source: skills/workflow-core-kit
  - name: workflow-planning-kit
    role: workflow
    source: skills/workflow-planning-kit
  - name: workflow-architecture-kit
    role: workflow
    source: skills/workflow-architecture-kit
  - name: workflow-development-kit
    role: workflow
    source: skills/workflow-development-kit
  - name: workflow-test-design-kit
    role: workflow
    source: skills/workflow-test-design-kit
  - name: workflow-orchestration-kit
    role: workflow
    source: skills/workflow-orchestration-kit
  - name: workflow-us-quality-assessment-kit
    role: workflow
    source: skills/workflow-us-quality-assessment-kit
```

`requiresUtilities` is new provider metadata. It is not user-requested utility installation; it means the selected
provider needs those utilities available for its workflow instructions to work.

## Utility Packages

Create these utility packages from the old branch material:

```text
packages/utility/grill-me/
packages/utility/tdd/
packages/utility/figma-use/
```

`workflow-stack` provider requires only:

- `grill-me`
- `tdd`

`figma-use` is not a workflow-stack provider dependency.

## Variant Runtime Glue

The existing variant runtimes are the glue layer between a project type and the selected provider. To support more than
one provider, their provider workflow guidance must become selected-provider-aware.

Required manifest adjustment:

- Keep `requiresProviderCapabilities` as the abstract provider contract.
- Treat provider-owned workflow skills as resolved through `requiresProviderCapabilities`, not through concrete
  `runtime.references`.
- Keep `runtime.references` for static, non-provider references such as contracts and required utilities.

Required runtime content adjustment:

- Replace Superpowers-only workflow wording with selected-provider wording.
- Include a short mapping for the default provider and `workflow-stack`.
- Preserve existing command discovery, testing, traceability, manual tester, and residual-risk sections.

Example provider mapping in runtime guidance:

```text
If the installed provider is superpowers, use the installed Superpowers skills for brainstorming, planning, execution,
TDD, debugging, verification, review, and finishing.

If the installed provider is workflow-stack, use workflow-orchestration-kit for full workflow coordination, then the
workflow-planning-kit, workflow-architecture-kit, workflow-test-design-kit, and workflow-development-kit phase skills as
directed by the orchestrator or by the current task.
```

This keeps variant runtimes as the entry point while avoiding provider-specific hard-coding in validation.

## Variant-Required Utilities

Add variant-level utility metadata for UI-bearing runtimes:

```yaml
requiresUtilities:
  - figma-use
```

Apply that to:

- `variant/frontend-react`
- `variant/mobile-ios`
- `variant/mobile-android`

Do not add it to:

- `variant/backend-java`

Frontend, iOS, and Android runtime skills must state that `figma-use` is available as a runtime-provided utility for
read-only Figma inspection workflows. Backend runtime content must not mention or depend on `figma-use`.

The installer resolves required utilities from both sources:

- selected provider `requiresUtilities`
- selected variant `requiresUtilities`

Lockfile entries for these utilities use `requested: false`.

Examples:

```yaml
utilities:
  - name: grill-me
    version: 0.1.0
    requested: false
    requiredBy:
      - provider/workflow-stack
  - name: tdd
    version: 0.1.0
    requested: false
    requiredBy:
      - provider/workflow-stack
  - name: figma-use
    version: 0.1.0
    requested: false
    requiredBy:
      - variant/frontend-react
```

If a user also installs one of those utilities explicitly through `add-skill`, keep the same utility package installed,
set `requested: true`, and preserve existing `requiredBy` entries.

`remove-skill` must not remove a utility that is still required by the installed provider or variant. If the utility is
both requested and required, removing it clears only the requested state and keeps the required installation.

## Content Remapping

The old workflow-stack skills used template placeholders and install-time body composition. The new architecture copies
declared package sources directly from archives, so the import must produce static installed content.

Required content changes:

1. Render each old `src/body.md` into a real `SKILL.md`.
2. Replace `{{package_root}}` with local skill-relative paths such as `.` or `scripts/...`.
3. Replace `{{shared_root}}` with `../workflow-core-kit`.
4. Move old `references/workflow-core` into `workflow-core-kit`.
5. Update init scripts so they resolve workflow-core templates from the installed sibling skill path:

   ```text
   <skills-root>/workflow-core-kit/templates/...
   ```

6. Fold old variant body append sections into the relevant `SKILL.md` files under explicit sections. Each skill must
   tell the agent to use the section matching the installed runtime variant.
7. Remove assumptions that `figma-use` is always installed. Workflow-stack planning and US-quality instructions must
   say to use the runtime-provided Figma helper when present; otherwise mark Figma access as unavailable and record the
   gap.
8. Keep Figma usage read-only where the old skills intended read-only inspection.

The import can change skill content as needed to make these skills coherent in the new architecture.

## Installer Changes

`install` accepts an optional provider:

```bash
nd-gen-skills install --variant frontend-react --provider workflow-stack
```

CLI parsing adds `provider?: string` only to install options.

Install flow:

1. Resolve the selected provider from `--provider` or `registry.index.defaults.provider`.
2. Resolve the selected variant as today.
3. Load the selected provider package.
4. Load the selected variant package.
5. Resolve variant-required contracts as today.
6. Resolve required utilities from provider and variant metadata.
7. Build desired state from provider skills, contracts, runtime skill, existing/requested utilities, and required utilities.
8. Apply desired state as today.
9. Write lockfile with selected provider and utility state.

`sync` keeps using `existingLockfile.provider?.name`. It must also re-resolve provider-required and variant-required
utilities so an installed workflow-stack runtime remains complete after sync.

## Registry Build

The registry builder continues discovering packages from `packages/provider`, `packages/contract`,
`packages/variant`, and `packages/utility`.

Update package ordering only for deterministic output:

- keep `provider/superpowers` first
- include `provider/workflow-stack`
- include `utility/grill-me`
- include `utility/tdd`
- include `utility/figma-use`

The registry default provider remains `superpowers`.

## Validation

Validation stays generic and selected-provider-aware.

Rules:

- A variant still declares abstract capabilities through `requiresProviderCapabilities`.
- The selected provider maps those capabilities to concrete provider skills.
- Missing required provider capabilities remain validation errors.
- Runtime reference validation must not force Superpowers skill names when the selected provider is `workflow-stack`.
- Concrete provider skill availability is validated by resolving `requiresProviderCapabilities` through the selected
  provider manifest.
- Provider-required utilities must be installed.
- Variant-required utilities must be installed.
- Utility dependency closure remains enforced.
- No installed workflow-stack provider file may contain unresolved legacy placeholders such as `{{shared_root}}` or
  `{{package_root}}`.
- Workflow-stack scripts must be present and able to locate their sibling `workflow-core-kit` templates.

Expected error examples:

```text
Provider workflow-stack requires utility tdd, but it is not installed.
Variant frontend-react requires utility figma-use, but it is not installed.
Provider workflow-stack does not declare required capability verification.
```

## Tests

Add focused tests for:

- CLI parsing of `install --provider workflow-stack`.
- Default install still resolves the default provider when `--provider` is omitted.
- Install with `--provider workflow-stack` installs workflow-stack provider skills.
- Install with `--provider workflow-stack --variant frontend-react` installs `grill-me`, `tdd`, and `figma-use`.
- Install with `--provider workflow-stack --variant backend-java` installs `grill-me` and `tdd`, but not `figma-use`.
- Variant runtime manifests use provider-neutral static references and rely on `requiresProviderCapabilities` for
  provider workflow skills.
- Variant runtime content includes selected-provider workflow guidance without changing platform-specific testing and
  traceability guidance.
- Lockfile records provider-required and variant-required utilities as `requested: false` with correct `requiredBy`.
- `add-skill` preserves required utility metadata when the same utility becomes user-requested.
- `remove-skill` keeps a utility installed when it is still provider-required or variant-required.
- `sync` keeps the selected provider and re-resolves required utilities.
- Registry build includes `provider/workflow-stack` and the new utility packages.
- Workflow-stack provider package contains no unresolved legacy placeholders.
- Workflow-stack provider archive contains scripts, examples, resources, templates, schemas, and references needed by
  declared skills.
- Init scripts can find `workflow-core-kit` templates from an installed provider layout.

## Acceptance Criteria

- `nd-gen-skills install --variant frontend-react` continues selecting the default provider and also installs
  variant-required `figma-use`.
- `nd-gen-skills install --variant frontend-react --provider workflow-stack` installs the workflow-stack provider,
  frontend runtime, required contracts, `grill-me`, `tdd`, and `figma-use`.
- `nd-gen-skills install --variant backend-java --provider workflow-stack` installs the workflow-stack provider,
  backend runtime, required contracts, `grill-me`, and `tdd`, without `figma-use`.
- `nd-gen-skills sync` preserves the selected provider from the lockfile.
- `nd-gen-skills validate --ci` passes after workflow-stack installs.
- Existing Superpowers provider tests and behavior continue to pass.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Old workflow-stack placeholders leak into installed skills | Add package-content tests for unresolved `{{...}}` placeholders. |
| Scripts cannot find templates after installation | Update script path resolution and test scripts against an installed-layout fixture. |
| Required utilities are accidentally removable | Make `remove-skill` preserve utilities with non-empty `requiredBy`. |
| Provider selection breaks default installs | Keep registry default provider unchanged and add explicit default-install regression tests. |
| Variant manifests become provider-specific | Keep variants capability-based and utility-based; put concrete provider mappings only in concise runtime guidance. |
| Figma helper is installed for backend unnecessarily | Declare `figma-use` only on UI-bearing variants. |

## Implementation Scope

The implementation touches only:

- provider and utility package sources needed for workflow-stack
- manifest schemas and types for provider/variant required utilities
- variant manifests and minimal variant runtime provider glue needed for provider-neutral operation
- install/sync/validate/utility dependency resolution paths
- CLI install argument parsing
- registry build deterministic ordering and generated registry artifacts
- focused unit and integration tests
- documentation/spec updates

It must not modify unrelated utility packages, unrelated runtime guidance, or Superpowers provider content.
