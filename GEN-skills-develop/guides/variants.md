# Runtime Variants

A runtime variant installs one visible Nexi runtime skill that adapts the selected provider to a repository type.

Only one runtime variant is active per tool installation. Use `--replace-variant` when switching variants.

## Summary

| Variant | Runtime skill | Use case | Key installed utilities |
| --- | --- | --- | --- |
| `frontend-react` | `nexi-frontend-react-runtime` | React frontend repositories, route/page work, UI behavior, browser verification, and design-to-code tasks. | `grill-me`, `read-jira-issue`, `figma-use`, `frontend-react-e2e-test-implementation` |
| `backend-java` | `nexi-backend-java-runtime` | Java backend repositories with service/controller boundaries, deployment flows, Jenkins, and API test needs. | `grill-me`, `read-jira-issue`, backend service/controller/deployment/Jenkins/Postman utilities |
| `mobile-ios` | `nexi-mobile-ios-runtime` | iOS repositories with XCTest, UI test, simulator, and design-aware mobile implementation needs. | `grill-me`, `read-jira-issue`, `figma-use` |
| `mobile-android` | `nexi-mobile-android-runtime` | Android repositories with Gradle, instrumented tests, layout inspection, and design-aware mobile implementation needs. | `grill-me`, `read-jira-issue`, `figma-use`, `mobile-android-layout-inspector` |

## How Variants Work

Each variant declares:

- required provider capabilities;
- required workflow contracts;
- required utility skills;
- one runtime skill that agents should use as the normal entry point.

The runtime skill reads repository documentation, applies the selected provider workflow, and brings in variant-specific guidance for development, tests, verification, and documentation.

## Documentation And Verification Expectations

| Variant | Documentation focus | Verification focus |
| --- | --- | --- |
| `frontend-react` | UI behavior, routes/pages, design-system mappings, Figma references, visible copy, and E2E scenarios. | Package scripts, component tests, browser checks, Playwright or equivalent E2E tests when available. |
| `backend-java` | API behavior, service/controller boundaries, deployment notes, Jenkins build steps, Postman collection flows, and API contracts. | Maven or Gradle tests, integration tests, API contract tests, Postman flows, Jenkins build verification when available. |
| `mobile-ios` | Screen behavior, navigation, simulator/device constraints, Figma mappings, and manual tester notes. | Xcode schemes, XCTest, UI tests, simulator validation, device fallback notes. |
| `mobile-android` | Screen behavior, navigation, layout inspection evidence, Figma mappings, and manual tester notes. | Gradle tests, instrumented tests, emulator validation, layout inspector or ADB evidence when relevant. |

## Install Examples

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --variant backend-java
npx -y @nexidigital/nd-gen-skills install --variant mobile-ios
npx -y @nexidigital/nd-gen-skills install --variant mobile-android
```

Switch variants intentionally:

```bash
npx -y @nexidigital/nd-gen-skills install --variant backend-java --replace-variant
```

## Related Guides

- [Published package install](install/published-package.md)
- [Local tarball install](install/local-tarball.md)
- [Support utility skills](utilities/support-utility-skills.md)
- [Superpowers provider](providers/superpowers.md)
- [Workflow Stack provider](providers/workflow-stack.md)
