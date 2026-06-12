---
name: documentation-quality-assessment
description: Assess repository documentation and AGENTS.md quality against enterprise documentation standards, then produce a formal findings report with provider-aware fix planning guidance.
---

# Documentation Quality Assessment

Use this skill to assess repository documentation quality after documentation has been created or refreshed with `documentation-kit`, or when a repository needs an enterprise documentation and `AGENTS.md` quality gate.

This skill reviews and reports. It does not rewrite documentation by default.
Route remediation to the installed documentation utilities and provider workflow.

## First Questions

Before assessing, identify:

- the repository path to scan
- whether the assessment is repository-wide or focused on named files
- the output report path

If the user does not provide a report path, write the report to:

```text
docs/quality/documentation-quality-assessment.md
```

Use the repository path as the starting point for an evidence scan.
Inspect only files and configuration relevant to the requested scope.
Do not blindly read every file.

## Evidence Sources

Prefer executable repository evidence over existing prose when they conflict.
Use this priority order:

1. Repository manifests, package scripts, build files, CI configuration, test entry points, source boundaries, public APIs, and generated artifact rules.
2. Installed skill lockfiles and managed skill blocks for Codex and Claude.
3. Root `README.md`, root `ARCHITECTURE.md`, `docs/`, local boundary docs, ADRs, workflow docs, testing docs, deployment docs, release docs, and formal interface artifacts.
4. Workflow Stack artifacts under `.workflows/` when present, using `workflow-state.yml` as the source for canonical artifact paths.
5. User-provided tickets, standards, or review criteria.

For Codex installs, managed skills and lockfiles normally live under `.agents/`.
For Claude installs, managed skills and lockfiles normally live under `.claude/`.
When writing reusable examples, prefer a tool-neutral placeholder such as `SKILL_DIR` or explicitly map both paths.

## Documentation Standard Checks

Assess documentation against the installed `documentation-core` templates and the Nexi documentation naming and structure standard.

Check that:

- root `README.md` exists and acts as the concise repository entry point
- root `ARCHITECTURE.md` exists and describes repository-level architecture, boundaries, integrations, constraints, and formal contract links where relevant
- `docs/` exists only when deeper repository-wide context is justified
- `docs/WORKFLOW.md` exists when repository-wide workflows are meaningful
- local docs exist only for meaningful feature, capability, service, integration, or ownership boundaries
- local `README.md` and local `docs/WORKFLOW.md` are used consistently where local documentation is justified
- ADRs, workflow files, integration docs, testing docs, deployment docs, and release docs are named and placed predictably
- documentation remains concise, navigational, close to owning boundaries, and not an uncontrolled knowledge base
- commands, paths, package names, variants, providers, runtime assumptions, and generated-artifact rules match repository evidence

## AGENTS.md Best-Practice Checks

Assess root and nested `AGENTS.md` files, plus equivalent root instruction files such as `CLAUDE.md` when present.

Check that:

- the managed Nexi block is present when managed skills are installed
- the managed Nexi block is not manually edited or contradicted by custom instructions
- repository-specific guidance sits outside managed blocks
- root `AGENTS.md` is concise, universal, and navigational
- detailed task-specific rules live in linked files where useful
- instructions are actionable, non-duplicative, and not generic software-engineering advice
- build, test, generated artifact, provider, variant, and forbidden-path rules match repository evidence
- tool-specific examples map Codex and Claude paths or use a tool-neutral placeholder such as `SKILL_DIR`
- provider skills under `packages/provider/` are not modified by repository-specific guidance

Recommend `agents-md-refactor` when restructuring is needed.

## Gate Result

Every assessment report must assign one overall result:

- `Pass`: no Blocker, High, or Medium findings; Low findings may remain.
- `Pass with warnings`: no Blocker or High findings, but one or more Medium findings require planned remediation.
- `Fail`: one or more Blocker or High findings exist.

Severity definitions:

- `Blocker`: mandatory root docs are missing, `AGENTS.md` is unsafe or contradictory, documentation materially conflicts with executable repository state, managed skill guidance is wrong, or the report cannot establish enough evidence for safe use.
- `High`: required governance structure is violated, important commands or workflows are stale, architecture or ownership boundaries are materially incomplete, or workflow evidence cannot be followed.
- `Medium`: useful links are missing, local docs are created for arbitrary folders, documentation duplicates itself, ownership is unclear, or maintenance expectations are weak.
- `Low`: clarity, naming polish, section order, concise wording, or optional follow-up improvements.

Severity determines the gate.
Numeric scores guide prioritization and must not hide Blocker or High findings.

## Scored Categories

Score each category from 0 to 5 and include a one-sentence rationale:

- documentation structure and naming
- README entry-point quality
- architecture documentation quality
- workflow and delivery documentation quality
- local documentation boundaries
- traceability to source, tests, contracts, and workflow artifacts
- `AGENTS.md` correctness and best practices
- provider, variant, contract, and utility consistency
- maintainability and progressive disclosure

## Report Format

Write a Markdown report with these sections:

1. Executive Summary
2. Overall Gate Result
3. Scope And Evidence
4. Category Scores
5. Findings By Severity
6. AGENTS.md Assessment
7. Documentation Standard Compliance
8. Provider And Installed-Skill Consistency
9. Remediation Routing
10. Recommended Fix Planning Prompt

Each finding must include:

- stable finding ID, such as `DQA-001`
- severity
- title
- category
- evidence path or command
- reason it matters
- recommended remediation
- suggested owner skill

## Remediation Routing

Route fixes to existing utilities:

- `documentation-kit` for README, architecture, workflow, and general documentation fixes
- `documentation-design-kit` for `DESIGN.md` and design-to-code traceability fixes
- `documentation-ubiquitous-language` for terminology and glossary fixes
- `agents-md-refactor` for `AGENTS.md` restructuring and progressive-disclosure fixes

Do not perform broad rewrites inside this assessment unless the user explicitly starts a separate remediation task.

## Provider-Aware Handoff

End every report with a `Recommended Fix Planning Prompt`.

If Superpowers is installed, recommend the appropriate Superpowers planning workflow before edits.
Use `brainstorming` when fix scope or trade-offs need design decisions.
Use `writing-plans` when the report already defines clear remediation requirements.

If Workflow Stack is installed, recommend Workflow Stack planning artifacts before development.
Use `workflow-planning-kit` when findings need requirements clarification.
Use `workflow-architecture-kit` when findings are already clear enough for a fix plan.

If no provider is detectable, ask the user which planning workflow to use before fixes begin.

Use this default prompt when the default report path is used:

```text
Use the installed provider workflow to plan fixes for the findings in docs/quality/documentation-quality-assessment.md.
Start with Blocker and High findings, preserve managed skill blocks, and route documentation rewrites through the installed documentation utilities.
```

## Final Report In Chat

After writing the report, summarize:

- report path
- overall gate result
- count of Blocker, High, Medium, and Low findings
- top remediation owner skills
- the recommended fix planning prompt
