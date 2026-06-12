# Documentation Quality Assessment Utility Design

## Summary

Create a new utility skill named `documentation-quality-assessment`.
The skill validates repository documentation created or maintained with `documentation-kit`, checks `AGENTS.md` files from an enterprise best-practice view, and produces a formal quality assessment report with hard gates, severity-ranked findings, evidence paths, and provider-aware fix planning guidance.

The skill is an assessment layer, not an authoring layer.
It should route remediation to existing documentation utilities and installed provider workflows instead of rewriting broad documentation by default.

## Goals

- Provide an enterprise-quality assessment workflow for repository documentation.
- Validate compliance with the Nexi documentation naming and structure standard.
- Check that documentation matches executable repository evidence such as manifests, scripts, CI, tests, source boundaries, and workflow artifacts.
- Review root and nested `AGENTS.md` files for correctness, contradiction risk, progressive disclosure, and managed-block safety.
- Produce a formal Markdown report with a clear result: `Pass`, `Pass with warnings`, or `Fail`.
- Make `documentation-kit` install this utility and `agents-md-refactor` transitively.
- End every assessment with a provider-aware recommendation to plan fixes through the installed development or planning provider.

## Non-Goals

- Do not implement documentation fixes inside the assessment workflow unless the user starts a separate remediation task.
- Do not replace `documentation-kit`, `documentation-design-kit`, `documentation-ubiquitous-language`, or `agents-md-refactor`.
- Do not edit provider skills under `packages/provider/`.
- Do not introduce CI scripts in the first implementation.
- Do not hardcode Codex-only installed-skill paths without also explaining Claude equivalents or using tool-neutral placeholders.

## Package And Install Model

Add a user-installable utility package:

- `packages/utility/documentation-quality-assessment/manifest.yaml`
- `packages/utility/documentation-quality-assessment/skill/SKILL.md`

Update `packages/utility/documentation-kit/manifest.yaml` so `documentation-kit` requires:

- `documentation-design-kit`
- `documentation-ubiquitous-language`
- `documentation-quality-assessment`
- `agents-md-refactor`

After this change, installing `documentation-kit` should install:

- `documentation-kit`
- `documentation-core`
- `documentation-design-kit`
- `documentation-ubiquitous-language`
- `documentation-quality-assessment`
- `agents-md-refactor`

Update user-facing guides so the umbrella documentation utility accurately describes the expanded install set and assessment workflow.

## Skill Responsibilities

`documentation-quality-assessment` should guide the agent through five phases.

1. Identify scope.
   Determine the target repository, whether the user wants a repository-wide assessment or a focused document assessment, and where to write the report.

2. Gather evidence.
   Inspect only relevant files and configuration. Evidence should include root docs, `docs/`, local boundary docs, manifests, package scripts, CI files, test entry points, installed skill lockfiles, `AGENTS.md`, and workflow artifacts when present.

3. Assess documentation quality.
   Compare documentation structure and content against the Nexi documentation standard and `documentation-core` templates. Prefer current repository state over existing prose when they conflict.

4. Assess agent instructions.
   Review `AGENTS.md` and equivalent local agent instruction files for progressive disclosure, contradictions, overbroad rules, unsafe managed-block edits, vague instructions, duplicated guidance, and consistency with installed provider, variant, contract, and utility skills.

5. Report and hand off.
   Write or present a formal assessment report with gate result, scores, findings, evidence, remediation ownership, and recommended fix planning prompt.

## Assessment Gate

The report must assign one overall result:

- `Pass`: no blocker, high, or medium findings; low-risk improvements only.
- `Pass with warnings`: no blocker or high findings, but medium findings require planned remediation.
- `Fail`: one or more blocker or high findings exist.

Severity definitions:

- `Blocker`: mandatory root docs are missing, `AGENTS.md` is unsafe or contradictory, documentation materially conflicts with executable repository state, managed skill guidance is wrong, or the report cannot establish enough evidence for safe use.
- `High`: required governance structure is violated, important commands or workflows are stale, architecture or ownership boundaries are materially incomplete, or workflow evidence cannot be followed.
- `Medium`: useful links are missing, local docs are created for arbitrary folders, documentation duplicates itself, ownership is unclear, or maintenance expectations are weak.
- `Low`: clarity, naming polish, section order, concise wording, or optional follow-up improvements.

The report should not hide critical failures inside numeric scores.
Severity findings determine the gate.

## Scored Categories

Score each category from 0 to 5 and include a short rationale:

- Documentation structure and naming.
- README entry-point quality.
- Architecture documentation quality.
- Workflow and delivery documentation quality.
- Local documentation boundaries.
- Traceability to source, tests, contracts, and workflow artifacts.
- `AGENTS.md` correctness and best practices.
- Provider, variant, contract, and utility consistency.
- Maintainability and progressive disclosure.

Scores guide prioritization.
They do not override the severity gate.

## Report Shape

The default report should be a Markdown document.
When the user does not specify a path, use:

```text
docs/quality/documentation-quality-assessment.md
```

Report sections:

- Executive summary.
- Overall gate result.
- Scope and evidence inspected.
- Category score table.
- Findings by severity.
- `AGENTS.md` assessment.
- Documentation standard compliance.
- Provider and installed-skill consistency.
- Remediation routing.
- Recommended fix planning prompt.

Each finding should include:

- ID, severity, title, and category.
- Evidence path or command.
- Why it matters.
- Recommended remediation.
- Suggested owner skill.

## Remediation Routing

The assessment skill should route fixes to existing utilities:

- `documentation-kit` for README, architecture, workflow, and general documentation fixes.
- `documentation-design-kit` for `DESIGN.md` and design-to-code traceability fixes.
- `documentation-ubiquitous-language` for terminology and glossary fixes.
- `agents-md-refactor` for `AGENTS.md` restructuring and progressive-disclosure fixes.

It should route implementation planning through the installed provider workflow:

- If Superpowers is installed, recommend the appropriate Superpowers planning flow before edits.
- If Workflow Stack is installed, recommend Workflow Stack planning artifacts before development.
- If no provider is detectable, ask the user which planning workflow to use.

The report must end with a reusable planning prompt similar to:

```text
Use the installed provider workflow to plan fixes for the findings in <report-path>.
Start with Blocker and High findings, preserve managed skill blocks, and route documentation rewrites through the installed documentation utilities.
```

## AGENTS.md Best-Practice Checks

The skill should verify:

- The managed Nexi block is present when managed skills are installed.
- The managed Nexi block is not manually edited or contradicted by custom instructions.
- Repository-specific guidance sits outside managed blocks.
- Root `AGENTS.md` is concise, universal, and navigational.
- Detailed task-specific rules live in linked files where useful.
- Instructions are actionable, non-duplicative, and not generic advice.
- Build, test, generated artifact, provider, variant, and forbidden-path rules are consistent with repository evidence.
- Tool-specific examples map Codex and Claude paths or use a tool-neutral placeholder such as `SKILL_DIR`.

The skill should recommend `agents-md-refactor` when restructuring is needed.

## Documentation Standard Checks

The skill should verify:

- Root `README.md` exists and acts as the repository entry point.
- Root `ARCHITECTURE.md` exists and describes repository-level architecture and boundaries.
- `docs/` exists only when deeper repository-wide context is justified.
- `docs/WORKFLOW.md` exists when repository-wide workflows are meaningful.
- Local docs exist only for meaningful feature, capability, service, or integration boundaries.
- Local `README.md` and local `docs/WORKFLOW.md` are used consistently where local documentation is justified.
- ADRs, workflow files, integration docs, test docs, deployment docs, and release docs are named and placed predictably.
- Documentation remains concise, navigational, close to owning boundaries, and not an uncontrolled knowledge base.

## Testing Strategy

Add or update tests for:

- Utility manifest parsing for `documentation-quality-assessment`.
- Package content expectations for the new skill.
- `documentation-kit` dependency expectations, including `documentation-quality-assessment` and `agents-md-refactor`.
- Integration behavior showing `add-skill documentation-kit` installs the expanded transitive utility set.
- Guide or package assertions that prevent documentation-kit docs from omitting the new dependencies.

The first implementation can validate skill behavior through static package tests rather than executable assessment scripts.

## Security And Safety

Because this creates or modifies a skill, run the `skill-scanner` security assessment before considering implementation complete.

Expected security posture:

- The skill contains guidance only, with no script execution in the first version.
- It instructs agents to inspect repository-local files and avoid broad, blind reads.
- It forbids provider skill edits.
- It preserves managed blocks.
- It avoids Codex-only paths unless Claude equivalents are included.
- It routes changes to existing utilities and provider workflows instead of encouraging uncontrolled rewrites.

## Future Extension

Deterministic helper scripts for CI-style checks are intentionally deferred.
The first implementation should be a guidance-only skill with static package and dependency tests.
