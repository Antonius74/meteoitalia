<!-- template-id: design-repository -->

# Design

> Canonical repository-level design-to-code entry point for UI-bearing repositories.
> Keep this document focused on central design sources, central component mappings, and source-of-truth links.

## Scope of This File

- **Scope type:** `repository-design`
- **This file exists to:** map central Figma design sources to the central code component library and related source-of-truth documentation.
- **This file must not:** duplicate component README files, local page composition docs, workflow artifacts, test cases, screenshots, or token values.

## Central Design Sources

| Source | Type | Location | Scope | Notes |
|---|---|---|---|---|
| [Figma library or file] | [library, file, prototype] | [link] | [central components or shared flows] | [notes] |
| [code component library] | [package or path] | [path or link] | [shared UI components] | [notes] |

## Central Component Mapping

| Design Component | Figma Source | Node ID | Code Component | Component Docs |
|---|---|---|---|---|
| [component name] | [Figma link] | [node-id] | [path or symbol] | [README, workflow, or component docs] |

## Token Sources

| Token Source | Location | Scope | Notes |
|---|---|---|---|
| [Figma variables or styles] | [link] | [colors, typography, spacing] | [notes] |
| [code token source] | [path or package] | [colors, typography, spacing] | [notes] |

## Local Design Discovery

Local page and screen design docs live at `docs/DESIGN.md` inside meaningful local boundaries.
Discover them by scanning local boundary documentation and UI route or screen ownership rather than maintaining a manual repository-level index.

## Maintenance Rule

Update this file when central design sources, central component mappings, component documentation links, token source links, or Code Connect references materially change.
