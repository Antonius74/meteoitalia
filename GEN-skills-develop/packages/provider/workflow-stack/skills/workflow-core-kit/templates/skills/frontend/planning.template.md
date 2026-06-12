# Frontend Overlay: Planning

Apply this overlay after the shared planning template.

- Prioritize user flows, interaction states, and accessibility requirements.
- Apply `references/api-consumer-contract.md` when requirements depend on mapping or consuming backend APIs.
- Capture browser/runtime compatibility constraints and API dependency assumptions.
- Flag unresolved UI text/content and design-state ambiguities.
- Add a requirement-to-component mapping section for every functional requirement.
- Add content and localization requirements whenever user-facing copy is introduced or changed.

## Content And Localization Requirements

Create a dedicated section in `requirements.md` whenever the requirement
introduces or changes user-facing copy, especially when design artifacts provide
source copy in a non-default language.

- Figma or design copy is design evidence, not automatically the implementation fallback copy.
- Code-level default copy, including `defaultMessage` values, must be written in English.
- Locale-specific copy must be provided through the existing i18n layer when the target bank, flavor, or locale requires translated text.
- If the design copy differs from the English default copy, document both values explicitly:
  - Source/design copy
  - Default English copy
  - Target locale mapping, when known
- Include titles, body text, button labels, aria labels, validation messages, empty states, and analytics labels when they are user-facing or observable.

Use a table with at least these columns:

- `UI Element`
- `Source / Design Copy`
- `Default English Copy`
- `Target Locale Copy`
- `Notes`

## Functional Requirement to Component Mapping

Create a dedicated section in `requirements.md` that maps each functional
requirement (`REQ-xxx`) to:

- the relevant Figma component(s),
- the matching codebase component(s), and
- whether each codebase component is already available or needs to be created.

Use a table with at least these columns:

- `REQ ID`
- `Functional Requirement`
- `Figma Component(s)`
- `Codebase Component(s)`
- `Component Status` (`existing` or `to-create`)
