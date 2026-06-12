# Workflow Stack Provider

`workflow-stack` is the governed enterprise provider installed by `@nexidigital/nd-gen-skills`.

Use it when a Nexi team needs Jira or requirement evidence, explicit workflow gates, structured architecture and test artifacts, and traceable delivery records.

## Install

```bash
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Typical Flow

| Phase | Skill | Output |
| --- | --- | --- |
| Readiness check | `workflow-us-quality-assessment-kit` | Quality assessment and missing-evidence notes. |
| Orchestration | `workflow-orchestration-kit` | Coordinated run state and phase gates. |
| Requirements | `workflow-planning-kit` | `requirements.md`. |
| Architecture | `workflow-architecture-kit` | `implementation-plan.md` and optional `api-contract.md`. |
| Test design | `workflow-test-design-kit` | `test-cases.md`. |
| Development | `workflow-development-kit` | Code, tests, fixes, and verification notes. |
| Shared support | `workflow-core-kit` | Templates, schemas, references, and role contracts. |

Workflow Stack also installs `grill-me` and `tdd` as required utilities.

Runtime variants add their own required utilities, such as Jira, Figma, E2E, backend, or mobile helpers.

## Direct Prompt Examples

Check readiness:

```text
Use $workflow-us-quality-assessment-kit to evaluate whether JIRA PROJ-101 is ready for planning.
```

Start a full run:

```text
Use $workflow-orchestration-kit to coordinate a full workflow-stack run for JIRA PROJ-101 using the installed runtime variant.
```

Extract requirements:

```text
Use $workflow-planning-kit to extract requirements for JIRA PROJ-101 using the installed runtime variant.
Write the output in a new workflow run directory under .workflows/PROJ-101_beneficiary-search.
```

Create architecture:

```text
Use $workflow-architecture-kit to create the implementation plan from .workflows/PROJ-101_beneficiary-search/requirements.md.
```

Create test design:

```text
Use $workflow-test-design-kit to create test-cases.md from .workflows/PROJ-101_beneficiary-search/requirements.md.
```

Develop from approved artifacts:

```text
Use $workflow-development-kit to implement .workflows/PROJ-101_beneficiary-search/implementation-plan.md with the approved test cases.
```

## Scaffold Commands

For Codex installs, scripts live under `.agents/skills`. For Claude installs, replace `.agents/skills` with `.claude/skills`.

Initialize a full workflow run:

```bash
python3 .agents/skills/workflow-orchestration-kit/scripts/init_orchestration.py \
  --issues PROJ-101 \
  --branch feature/proj-101 \
  --run PROJ-101_beneficiary-search
```

Scaffold requirements:

```bash
python3 .agents/skills/workflow-planning-kit/scripts/init_planning.py \
  --workflow-dir .workflows/PROJ-101_beneficiary-search \
  --issues PROJ-101
```

Scaffold architecture:

```bash
python3 .agents/skills/workflow-architecture-kit/scripts/init_architecture.py \
  --workflow-dir .workflows/PROJ-101_beneficiary-search
```

Scaffold architecture with an API contract:

```bash
python3 .agents/skills/workflow-architecture-kit/scripts/init_architecture.py \
  --workflow-dir .workflows/PROJ-101_beneficiary-search \
  --include-api-contract
```

Scaffold test design:

```bash
python3 .agents/skills/workflow-test-design-kit/scripts/init_test_design.py \
  --workflow-dir .workflows/PROJ-101_beneficiary-search \
  --variant frontend-react
```

## Documentation Use Cases

Workflow Stack creates a governed evidence trail:

- `workflow-state.yml` records run state and canonical artifact paths;
- `requirements.md` captures Jira or requirement evidence;
- `implementation-plan.md` records architecture and file-level execution decisions;
- `api-contract.md` records producer or consumer API handoff details when relevant;
- `test-cases.md` records unit, integration, E2E, and manual validation coverage;
- automation reports record execution evidence.

Use this provider when delivery must be auditable across requirements, implementation, test design, and verification.

## Output Locations

Workflow Stack writes run artifacts under `.workflows/RUN_ID/`. The scaffold commands create the main workflow artifacts:

- `workflow-state.yml`
- `requirements.md`
- `implementation-plan.md`
- `api-contract.md`
- `test-cases.md`

Later workflow phases may add automation files, including:

- `automation-test-data.md`
- `automation-test-report.md`

Agents should read canonical artifact paths from `workflow-state.yml` instead of assuming root-level files.

## Related Guides

- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Superpowers provider](superpowers.md)
- [Runtime variants](../variants.md)
