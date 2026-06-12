# Superpowers Provider

`superpowers` is the default provider installed by `@nexidigital/nd-gen-skills`.

Use it when a Nexi team needs a lightweight but disciplined loop for feature design, implementation planning, TDD, debugging, review, and completion.

## Install

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --provider superpowers --variant frontend-react
```

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider superpowers --variant frontend-react
```

## Typical Flow

| Phase | Skill | Use when |
| --- | --- | --- |
| Requirements and design | `brainstorming` | Turning an idea into an approved design/spec. |
| Implementation planning | `writing-plans` | Creating a task-by-task implementation plan from an approved spec. |
| Isolated work | `using-git-worktrees` | Starting feature work without disturbing the current workspace. |
| Execution | `executing-plans` or `subagent-driven-development` | Implementing a written plan. |
| Test-first work | `test-driven-development` | Adding behavior with red-green-refactor discipline. |
| Debugging | `systematic-debugging` | Investigating failures before proposing a fix. |
| Review | `requesting-code-review` and `receiving-code-review` | Checking work or handling review feedback. |
| Completion | `verification-before-completion` | Verifying command output before claiming completion. |
| Branch finish | `finishing-a-development-branch` | Deciding how to merge, PR, or clean up completed work. |

## Direct Prompt Examples

Start design:

```text
Use $brainstorming to refine this feature idea considering the installed runtime variant:
Add a saved beneficiary search filter that remembers the user's last query.
```

Create an implementation plan after the spec is approved:

```text
Use $writing-plans to create the implementation plan from docs/superpowers/specs/2026-05-18-beneficiary-search-design.md.
```

Execute an approved plan with Codex subagents:

```text
Use $subagent-driven-development to execute docs/superpowers/plans/2026-05-18-beneficiary-search.md.
First confirm Codex subagent spawning is enabled for this session.
Follow the installed runtime guidance and keep VCS writes gated for developer review.
```

Debug a failure:

```text
Use $systematic-debugging to investigate this failing command:
npm test -- tests/beneficiary-search.test.ts
```

Verify completed work:

```text
Use $verification-before-completion to verify the completed work before final response.
```

## Documentation Use Cases

Superpowers durable artifacts are limited to the files a skill, plan, or user explicitly asks to create:

- design decisions live in `docs/superpowers/specs/`;
- implementation plans live in `docs/superpowers/plans/`;
- optional brainstorming companion artifacts live in `.superpowers/brainstorm/`.

Debugging, verification, and review skills still capture process evidence, but that evidence normally stays in the working conversation unless a plan or user request asks for durable files.

Use this provider when the team needs traceable reasoning without the heavier Workflow Stack artifact set.

## Output Locations

| Artifact | Path |
| --- | --- |
| Design/spec documents | `docs/superpowers/specs/` |
| Implementation plans | `docs/superpowers/plans/` |
| Optional brainstorming companion artifacts | `.superpowers/brainstorm/` |

## Related Guides

- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Codex subagents with Superpowers](../developer-distribution/workflow/codex-subagents-superpowers.md)
- [Workflow Stack provider](workflow-stack.md)
- [Runtime variants](../variants.md)
