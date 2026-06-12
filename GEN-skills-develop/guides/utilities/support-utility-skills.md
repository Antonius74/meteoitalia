# Support Utility Skills

Support utility skills add focused capabilities to a repository without changing the active provider or runtime variant.

Use this guide when a team needs a specific helper such as documentation generation, design documentation, terminology extraction, TDD guidance, Figma operations, E2E test implementation, backend deployment support, or mobile layout inspection.

## How Utility Installs Work

`add-skill` installs one user-facing utility skill and any required dependencies. It can run after a full runtime install or by itself in a repository that only needs utility support.

For Codex, utilities are installed under `.agents/skills` and tracked in `.agents/nd-gen-skills.lock.yaml`.

For Claude, utilities are installed under `.claude/skills` and tracked in `.claude/nd-gen-skills.lock.yaml`.

The installer also updates the managed Nexi block in root `AGENTS.md` so the installed utility is discoverable by the agent.

## List Available Utilities

From the target repository:

```bash
npx -y @nexidigital/nd-gen-skills list --available
```

For Claude:

```bash
npx -y @nexidigital/nd-gen-skills list --available --tool claude
```

Only user-installable utilities should be installed directly. Some utilities, such as `read-jira-issue`, are internal support packages and are installed automatically only when a provider or runtime requires them.

## Install A Specific Utility

Install a Codex utility from the published package:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

Install the same utility for Claude:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit --tool claude
```

Validate the managed state after installation:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

Remove a utility when it is no longer needed:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

For Claude removal:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit --tool claude
```

Use `--force` only when intentionally overwriting locally changed managed skill files.

## Install From A Local Tarball

When testing unpublished changes, build a tarball from this repository first:

```bash
npm ci
npm run prepare
mkdir -p dist
npm run pack
```

Set an absolute tarball path:

```bash
TARBALL="$(ls -t "$PWD"/dist/nexidigital-nd-gen-skills-*.tgz | head -n 1)"
```

From the target repository, install a utility from that tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

For Claude:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit --tool claude
```

## Common User-Installable Utilities

| Utility | Use case | Typical install |
| --- | --- | --- |
| `documentation-kit` | Umbrella documentation workflow for README, architecture, workflow docs, plans, and routing to documentation companions. | `npx -y @nexidigital/nd-gen-skills add-skill documentation-kit` |
| `documentation-design-kit` | Design-to-code documentation for UI repositories, including `docs/DESIGN.md` and Figma/code mapping evidence. | `npx -y @nexidigital/nd-gen-skills add-skill documentation-design-kit` |
| `documentation-ubiquitous-language` | DDD-style glossary and canonical terminology in `docs/UBIQUITOUS_LANGUAGE.md`. | `npx -y @nexidigital/nd-gen-skills add-skill documentation-ubiquitous-language` |
| `documentation-quality-assessment` | Formal quality gate for repository documentation and `AGENTS.md`, including scores, severity findings, and provider-aware fix planning guidance. | `npx -y @nexidigital/nd-gen-skills add-skill documentation-quality-assessment` |
| `office-kit` | Umbrella office-document workflow for Word, PDF, PowerPoint, and spreadsheet tasks. | `npx -y @nexidigital/nd-gen-skills add-skill office-kit` |
| `markitdown` | Convert explicit local documents to Markdown with Microsoft MarkItDown for LLM and text-analysis workflows. | `npx -y @nexidigital/nd-gen-skills add-skill markitdown` |
| `agents-md-refactor` | Refactor `AGENTS.md` into a minimal root file with linked progressive-disclosure instruction files. | `npx -y @nexidigital/nd-gen-skills add-skill agents-md-refactor` |
| `grill-me` | Plan and design challenge sessions before committing to an implementation path. | `npx -y @nexidigital/nd-gen-skills add-skill grill-me` |
| `tdd` | Behavior-focused red-green-refactor development loops. | `npx -y @nexidigital/nd-gen-skills add-skill tdd` |
| `figma-use` | Safe Figma Plugin API usage when runtime guidance permits Figma read/write work. | `npx -y @nexidigital/nd-gen-skills add-skill figma-use` |
| `frontend-react-e2e-test-implementation` | Generate a Playwright React E2E scenario from selected test cases. | `npx -y @nexidigital/nd-gen-skills add-skill frontend-react-e2e-test-implementation` |
| `mobile-android-layout-inspector` | Android layout inspection and ADB capture workflows. | `npx -y @nexidigital/nd-gen-skills add-skill mobile-android-layout-inspector` |

## Documentation Utility Examples

### Repository Documentation

Install the umbrella documentation utility:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

Then ask the agent to create or refresh repository docs from the local source of truth:

```text
Use $documentation-kit in this repository to refresh README.md and ARCHITECTURE.md from the current source tree.
Keep the README navigational, link existing guides, and report any commands or ownership details that need confirmation.
```

`documentation-kit` installs `documentation-core` plus the documentation companion utilities it needs:

- `documentation-design-kit`
- `documentation-ubiquitous-language`
- `documentation-quality-assessment`
- `agents-md-refactor`

Documentation work from this utility should also follow the governance standard in [Standard: Documentation Naming and Structure - AI Engineering Governance - Confluence](../developer-distribution/documentation/AIGOV-Standard_%20Documentation%20Naming%20and%20Structure.pdf).

If you later remove `documentation-kit`, dependency utilities are removed only when they are not still required or explicitly requested.

For a focused install and usage guide, see [Documentation Kit](documentation-kit.md).

### Design-To-Code Documentation

Install only the design documentation utility when the repository needs durable design mapping docs:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-design-kit
```

Example prompt:

```text
Use $documentation-design-kit to create docs/DESIGN.md for this React repository.
Map the provided Figma file and node IDs to routes, screens, and reusable components under src/.
Keep unresolved mapping gaps in the final chat report, not in the document.
```

Use this for UI-bearing repositories. Do not use it for backend-only repositories or for writing changes back to Figma.

### Ubiquitous Language Documentation

Install the terminology utility:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-ubiquitous-language
```

Example prompt:

```text
Use $documentation-ubiquitous-language to create docs/UBIQUITOUS_LANGUAGE.md from this repository and the current conversation.
Pick canonical terms, list aliases to avoid, and flag overloaded words that need product confirmation.
```

Use this when domain terms are inconsistent across tickets, docs, code, or stakeholder conversation.

### MarkItDown Document Conversion

Install the MarkItDown utility:

```bash
npx -y @nexidigital/nd-gen-skills add-skill markitdown
```

Example prompt:

```text
Use $markitdown to convert ./docs/source.pdf into Markdown under ./docs/converted.
Use local files only and do not overwrite existing output.
```

This utility follows Microsoft MarkItDown's official README and defaults to local file conversion. Remote inputs, YouTube links, and archives require explicit user approval.

## Backend-Specific Utilities

Backend Java repositories can also install focused backend utilities when needed:

```bash
npx -y @nexidigital/nd-gen-skills add-skill backend-service-implementation-kit
npx -y @nexidigital/nd-gen-skills add-skill backend-controller-implementation-kit
npx -y @nexidigital/nd-gen-skills add-skill backend-deployment-management
npx -y @nexidigital/nd-gen-skills add-skill backend-jenkins-build
npx -y @nexidigital/nd-gen-skills add-skill backend-jenkins-build-script
npx -y @nexidigital/nd-gen-skills add-skill backend-postman-flow-tests
npx -y @nexidigital/nd-gen-skills add-skill backend-run-collection
```

## Recommended Documentation Flow

For broad repository documentation work:

1. Install `documentation-kit`.
2. Ask for `README.md` first.
3. Ask for `ARCHITECTURE.md` next if maintainers need technical detail.
4. Add `docs/DESIGN.md` only for UI-bearing repositories with reliable design evidence.
5. Add `docs/UBIQUITOUS_LANGUAGE.md` when domain terminology is unclear or strategically important.
6. Run `validate --ci` before committing the managed skill state.

## Related Guides

- [Documentation Kit](documentation-kit.md)
- [Office Kit](office-kit.md)
- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Release process](../install/release-process.md)
- [Runtime variants](../variants.md)
- [Superpowers provider](../providers/superpowers.md)
- [Workflow Stack provider](../providers/workflow-stack.md)
