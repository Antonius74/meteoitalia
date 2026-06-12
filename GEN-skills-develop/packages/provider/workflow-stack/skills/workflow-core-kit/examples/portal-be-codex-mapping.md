# Legacy Mapping: `portal-be/codex` -> Variant Package Architecture

This mapping is the migration inventory used during execution of the cross-architecture rollout.

## Workflow-Core Skill Mapping

| Legacy Skill | New Installable Package | Shared Template Anchor | Variant Overlay Anchor |
|---|---|---|---|
| `skills/planning/SKILL.md` | `skills/workflow-planning-kit` | `templates/skills/shared/planning.template.md` | `templates/skills/{backend|frontend|mobile-android|mobile-ios}/planning.template.md` |
| `skills/architecture/SKILL.md` | `skills/workflow-architecture-kit` | `templates/skills/shared/architecture.template.md` | `templates/skills/{backend|frontend|mobile-android|mobile-ios}/architecture.template.md` |
| `skills/development/SKILL.md` | `skills/workflow-development-kit` | `templates/skills/shared/development.template.md` | `templates/skills/{backend|frontend|mobile-android|mobile-ios}/development.template.md` |
| `skills/test-design/SKILL.md` | `skills/workflow-test-design-kit` | `templates/skills/shared/test-design.template.md` | `templates/skills/{backend|frontend|mobile-android|mobile-ios}/test-design.template.md` |
| `skills/orchestration/SKILL.md` | `skills/workflow-orchestration-kit` | `templates/skills/shared/orchestration.template.md` | `templates/skills/{backend|frontend|mobile-android|mobile-ios}/orchestration.template.md` |
| `skills/unit-testing/SKILL.md` | `skills/workflow-orchestration-kit` validation phase | `templates/skills/shared/unit-testing.template.md` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/unit-tester.template.toml` |
| `skills/automation-test-writer/SKILL.md` | `skills/workflow-orchestration-kit` validation phase | `templates/skills/shared/automation-test-writing.template.md` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/automation-test-writer.template.toml` |
| `skills/automation-test-runner/SKILL.md` | `skills/workflow-orchestration-kit` validation phase | `templates/skills/shared/automation-test-running.template.md` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/automation-test-runner.template.toml` |
| `skills/us-quality/SKILL.md` | `skills/workflow-us-quality-assessment-kit` | package-local `resources/report-template.md` | n/a |

## Backend Specialized Skill Mapping

| Legacy Skill | New Package | Primary Backend Template |
|---|---|---|
| `skills/service-async-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/service-sync-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/rest-service-async-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/rest-service-sync-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/facade-async-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/facade-sync-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/enricher-async-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/enricher-sync-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/mapper-async-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/mapper-sync-implementing/SKILL.md` | `skills/backend-service-implementation-kit` | `skills/backend-service-implementation-kit/references/backend/service-implementation.template.md` |
| `skills/controller-async-implementing/SKILL.md` | `skills/backend-controller-implementation-kit` | `skills/backend-controller-implementation-kit/references/backend/controller-implementation.template.md` |
| `skills/controller-sync-implementing/SKILL.md` | `skills/backend-controller-implementation-kit` | `skills/backend-controller-implementation-kit/references/backend/controller-implementation.template.md` |

## Agent Configuration Mapping

| Legacy Agent Config | New Shared Template | Variant Overlay Templates |
|---|---|---|
| `agents/planner.toml` | `templates/agents/shared/planner.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/planner.template.toml` |
| `agents/architect.toml` | `templates/agents/shared/architect.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/architect.template.toml` |
| `agents/developer.toml` | `templates/agents/shared/developer.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/developer.template.toml` |
| `agents/test-designer.toml` | `templates/agents/shared/test-designer.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/test-designer.template.toml` |
| `agents/unit-tester.toml` | `templates/agents/shared/unit-tester.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/unit-tester.template.toml` |
| `agents/automation-test-writer.toml` | `templates/agents/shared/automation-test-writer.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/automation-test-writer.template.toml` |
| `agents/automation-test-runner.toml` | `templates/agents/shared/automation-test-runner.template.toml` | `templates/agents/{backend|frontend|mobile-android|mobile-ios}/automation-test-runner.template.toml` |

The installable entry points for this role layer are `skills/workflow-delivery-kit` and `skills/workflow-core-kit`.

## Additional Legacy Skills Pending Dedicated Packaging

The following legacy assets remain mapped at reference-level only and are candidates for dedicated packages if needed by delivery teams:

- `skills/document-portal-flow-state-machine/SKILL.md`
- `skills/state-machine-implementing/SKILL.md`
- `skills/state-machine-integration/SKILL.md`
- `skills/manage-profilation/SKILL.md`
- `skills/postman-temp-flow-tests/SKILL.md`

## Migration Sequence

1. migrate workflow-core skills into installable packages
2. isolate backend-specialized guidance from shared workflow templates
3. maintain frontend/mobile parity overlays for each shared workflow phase
4. wire scaffold and validation flows to shared-plus-variant conventions
5. finalize agent config bundle routing and installation docs
