# Variant Skill Utilities Import Design

Date: 2026-05-13

## Context

`feat/ark` contains variant-specific skills that are not yet present in the current `feat/ark_v2` package tree:

- `frontend-react-e2e-test-implementation`
- `backend-service-implementation-kit`
- `backend-controller-implementation-kit`
- `mobile-android-layout-inspector`

The current architecture already supports the needed integration points:

- utility packages under `packages/utility/*`
- independently installable utilities through `add-skill`
- provider-level utility requirements through `provider.requiresUtilities`
- variant-level utility requirements through `variant.requiresUtilities`
- lockfile utility state through `utilities[].requested` and `utilities[].requiredBy`
- runtime install/sync utility resolution through `runtimeUtilityRequests(...)`
- runtime reference validation against managed skills

This work must fit that architecture. It should not add a new package kind, a new companion-skill model, or a second
dependency mechanism.

## Goals

- Import the relevant `feat/ark` variant-specific skills into the existing utility package model.
- Keep each imported skill independently installable with `add-skill`.
- Auto-install the imported utility skills when their matching variant is installed.
- Allow future variants to reuse the same utility packages by listing them in `requiresUtilities`.
- Link runtime guidance to the installed utilities only where that runtime actually uses them.
- Preserve current provider, contract, runtime, utility, lockfile, install, sync, validate, and remove semantics.

## Non-Goals

- Do not change package architecture.
- Do not add a new variant-owned companion-skill package type.
- Do not embed these skills inside variant archives.
- Do not promote these platform-specific helpers into provider capabilities.
- Do not add a mobile iOS companion utility unless a concrete iOS-specific source skill is identified later.
- Do not rewrite the imported skill bodies beyond path, metadata, and architecture-fit cleanup needed for this package
  model.

## Approved Direction

Import the `feat/ark` skills as reusable utility packages and wire them through existing variant metadata.

The package layout should add:

```text
packages/utility/frontend-react-e2e-test-implementation/
  manifest.yaml
  skill/SKILL.md

packages/utility/backend-service-implementation-kit/
  manifest.yaml
  skill/SKILL.md
  references/

packages/utility/backend-controller-implementation-kit/
  manifest.yaml
  skill/SKILL.md
  references/

packages/utility/mobile-android-layout-inspector/
  manifest.yaml
  skill/SKILL.md
  references/
  scripts/
```

The exact retained support folders depend on the source skill contents. If a source skill references examples,
templates, scripts, or legacy references that remain useful, keep them under the utility package and make the skill body
refer to package-local paths. Drop old `package.toml`, old agent config files, adapter templates, or Python installer
assumptions.

## Variant Wiring

Add the utility requirements to the existing variant manifests:

```yaml
# packages/variant/frontend-react/manifest.yaml
requiresUtilities:
  - frontend-react-e2e-test-implementation
```

```yaml
# packages/variant/backend-java/manifest.yaml
requiresUtilities:
  - backend-service-implementation-kit
  - backend-controller-implementation-kit
```

```yaml
# packages/variant/mobile-android/manifest.yaml
requiresUtilities:
  - mobile-android-layout-inspector
```

```yaml
# packages/variant/mobile-ios/manifest.yaml
requiresUtilities: []
```

This keeps utility ownership reusable. A future `mobile-android-react-native` variant can reuse
`mobile-android-layout-inspector` by declaring the same utility requirement.

## Runtime References And Guidance

Runtime manifests should include imported utility names in `runtime.references` only when the runtime body refers to
them. That keeps existing validation meaningful: every named runtime reference must be a managed installed skill.

Runtime body updates should be small and local:

- `nexi-frontend-react-runtime` should route selected `TC-E2E-*` Playwright scenario generation to
  `frontend-react-e2e-test-implementation`.
- `nexi-backend-java-runtime` should route service-layer implementation work to `backend-service-implementation-kit`
  and controller or endpoint implementation work to `backend-controller-implementation-kit`.
- `nexi-mobile-android-runtime` should route live Android UI evidence, screenshots, UI dumps, and Android Studio Layout
  Inspector workflows to `mobile-android-layout-inspector`.
- `nexi-mobile-ios-runtime` should not mention a missing imported utility.

Provider workflow guidance stays provider-based. These utilities are platform helpers used by runtimes; they are not
provider capabilities.

## Install, Sync, Add, And Remove Behavior

No new installer behavior is required beyond using the existing architecture.

When a variant is installed, `runtimeUtilityRequests(...)` should include variant-required utilities as non-requested
roots:

```yaml
utilities:
  - name: mobile-android-layout-inspector
    version: 0.1.0
    requested: false
    requiredBy:
      - variant/mobile-android
```

When the user also runs `add-skill mobile-android-layout-inspector`, the utility remains a single lockfile entry:

```yaml
requested: true
requiredBy:
  - variant/mobile-android
```

When `remove-skill` targets a utility still required by the installed variant, it should preserve the installed files and
clear only explicit requested state if present. Existing `requiredBy` preservation already expresses this behavior.

When a variant is replaced, runtime utility resolution should drop stale non-requested utilities that are no longer
required by the new provider or variant.

## Registry Build

Add the new utility package keys to the deterministic registry package order so `dist-registry/index.yaml` remains
stable and readable.

The generated registry should include:

```text
utility/frontend-react-e2e-test-implementation
utility/backend-service-implementation-kit
utility/backend-controller-implementation-kit
utility/mobile-android-layout-inspector
```

## Testing

Update existing tests rather than adding a new test layer.

Package content tests should verify:

- the four utility package manifests exist and have kind `utility`
- each declared source path exists
- each variant declares the expected `requiresUtilities`
- each runtime references only managed skills
- runtime guidance contains the expected utility skill names

Install and sync integration tests should verify:

- `install --variant frontend-react` installs `frontend-react-e2e-test-implementation` as `requested: false` and
  `requiredBy: ["variant/frontend-react"]`
- `install --variant backend-java` installs both backend implementation utilities as variant-required utilities
- `install --variant mobile-android` installs `mobile-android-layout-inspector` as a variant-required utility
- `sync` restores or updates those utilities through the existing runtime utility closure
- `add-skill` can mark a variant-required utility as `requested: true`
- `remove-skill` preserves a still-required utility and clears only requested state
- replacing a variant removes stale non-requested utilities no longer required by the selected runtime

Registry tests should verify generated utility archives exist for the four imported packages.

## Risks And Controls

| Risk | Control |
| --- | --- |
| Imported skill bodies refer to old `feat/ark` paths | Rewrite references to package-local paths and add package content assertions |
| Utility package support files are omitted from archives | Keep all referenced support files under the package source and verify declared source paths |
| Runtime references drift from installed skills | Keep imported utility names in `runtime.references` and rely on existing validation |
| Future variants need the same skill | Use reusable utility packages and `variant.requiresUtilities`, not embedded variant content |
| Remove behavior accidentally deletes required utility files | Cover required utility remove behavior in integration tests |

## Acceptance Criteria

- All four imported skills are packaged as utilities and listed in the generated registry.
- Relevant variants install their required utility skills automatically.
- Each utility remains installable with `add-skill`.
- Runtime guidance points to the imported utility skills where relevant.
- Existing provider and runtime architecture remains unchanged.
- Tests and registry artifacts confirm install, sync, add, remove, validate, and package content behavior.
