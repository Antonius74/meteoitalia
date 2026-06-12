# Utility Skills

Utility skills add focused capabilities to a Codex repository without changing the active provider or runtime variant. Use them when a team needs one additional workflow, helper, or implementation kit on top of the installed provider setup.

## List Available Utilities

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills list --available
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills list --available
```

## Install A Utility

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

## Remove A Utility

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills remove-skill documentation-kit
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

## Validate

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

## Common Utilities

| Utility | Use when |
| --- | --- |
| `documentation-kit` | Create, refresh, or audit repository documentation. |
| `documentation-quality-assessment` | Assess repository docs and `AGENTS.md` against enterprise documentation quality gates. |
| `tdd` | Use behavior-focused red-green-refactor guidance. |
| `grill-me` | Challenge and clarify an implementation idea or plan. |
| `markitdown` | Convert local documents to Markdown. |
| `figma-use` | Use Figma Plugin API guidance when the runtime allows Figma work. |
| `frontend-react-e2e-test-implementation` | Generate a Playwright React E2E scenario from selected test cases. |
| `backend-service-implementation-kit` | Implement backend service-layer behavior. |
| `backend-controller-implementation-kit` | Implement backend controller and endpoint layers. |
| `mobile-android-layout-inspector` | Inspect Android layouts with Layout Inspector and ADB capture workflows. |

Some utilities are installed automatically as dependencies of providers, variants, contracts, or other utilities. Dependency-only utilities are not directly user-installable; use `nd-gen-skills list --available` to see which utilities can be added explicitly.

## Use An Installed Utility

```text
Use $documentation-kit to refresh README.md and ARCHITECTURE.md from the current source tree.
```

```text
Use $documentation-quality-assessment to validate repository documentation and AGENTS.md.
Write docs/quality/documentation-quality-assessment.md and include the recommended fix planning prompt for the installed provider.
```

```text
Use $grill-me to challenge this implementation idea before I start coding:
<describe the idea>
```
