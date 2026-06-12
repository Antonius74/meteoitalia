<!-- template-id: readme-repository -->

# [Repository Name]

> Canonical repository-level entry point for humans and AI-assisted workflows.
> Keep this file short, stable, and navigational. Put deep detail in linked documents.

## Scope of This File

- **Scope type:** `repository-wide`
- **This file exists to:** explain what the repository is, what it owns, how it is structured, how to work in it, and where deeper documentation lives.
- **This file must not:** become detailed documentation for specific features, services, workflows, integrations, or delivery plans.

## Purpose

- **What this repository is:** [one-sentence description]
- **Business or domain purpose:** [what capability this repository delivers]
- **Execution or distribution form:** [how this repository is built, run, packaged, or consumed]
- **Primary users or consumers:** [teams, systems, or customers]
- **Out of scope:** [what this repository does not own]

## Repository Structure

| Path | Purpose | Notes |
|---|---|---|
| `/src` | [main implementation area] | [key boundaries or layers] |
| `/tests` | [test suites] | [unit, integration, e2e, contract, performance] |
| `/docs` | [shared repository documentation] | [workflow, ADRs, contracts, testing, deployment] |
| `/scripts` | [automation or developer scripts] | [build, release, migration, validation] |

## Key Documentation

- **Canonical architecture document:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Repository workflow entry point:** [`docs/WORKFLOW.md`](./docs/WORKFLOW.md)
- **Design-to-code mapping:** [`docs/DESIGN.md`](./docs/DESIGN.md)
- **Architectural decisions:** [`docs/adr/`](./docs/adr/)

## Important Local Boundaries

| Boundary | Owns | Local Entry Point | Notes |
|---|---|---|---|
| [path or area] | [local responsibility] | `{{local_boundary_readme_path}}` | [notes] |

## How to Work in This Repository

### Prerequisites

- [runtime or language version]
- [package manager or build tool]
- [local services or dependencies]

### Setup

```bash
[setup command]
```

### Run

```bash
[run command]
```

### Build

```bash
[build command]
```

### Test

```bash
[test command]
```

## Maintenance Rule

Update this file when repository purpose, structure, setup, commands, or key documentation links materially change.
