<!-- template-id: design-local -->

# Design

> Canonical local design-to-code document for pages or screens owned by one boundary.
> Keep this document near the implementation and focused on page or screen composition.

## Scope of This File

- **Scope type:** `local-design`
- **Boundary:** [feature, route, module, or screen-flow boundary]
- **This file exists to:** map local Figma frames or prototypes to implemented routes, screens, and composed components.
- **This file must not:** duplicate central component library docs, workflow artifacts, detailed test cases, screenshots, or token values.

## Boundary Design Sources

| Source | Type | Location | Scope | Notes |
|---|---|---|---|---|
| [Figma frame or prototype] | [frame, prototype, file] | [link] | [page or screen flow] | [notes] |

## Page and Screen Composition

| Page / Screen | Figma Frame / Prototype | Node ID | Route / Entry Point | Composed Components | Behavior States | E2E Coverage |
|---|---|---|---|---|---|---|
| [page or screen] | [Figma link] | [node-id] | [route, screen, or entry symbol] | [central or local component names] | [loading, empty, success, error] | [coverage reference] |

## Local Components

| Local Component | Code Location | Documentation | Used By |
|---|---|---|---|
| [component name] | [path or symbol] | [README, workflow, or docs] | [page or screen] |

## Maintenance Rule

Update this file when local page or screen composition, routes, Figma sources, behavior states, local component references, or E2E coverage references materially change.
