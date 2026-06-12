# Codex Subagents With Superpowers

Use this guide when a Codex repository has the `superpowers` provider installed and a written implementation plan is ready to execute with delegated agents.

Subagents are a Codex execution capability. Superpowers defines the workflow that tells the controller agent when to delegate, what prompt shape to use, and which reviews must happen before a task is considered complete.

## Enable Codex Subagents First

Before running `$subagent-driven-development`, make sure the Codex session can spawn subagents.

Enable multi-agent support in the Codex configuration:

```toml
[features]
multi_agent = true
```

In Codex, the controller agent needs access to the multi-agent tools, including:

- `spawn_agent`
- `wait_agent`
- `send_input`
- `close_agent`

If those tools are not visible in the session, enable the Codex subagents or multi-agent capability for the workspace/session before starting the workflow. If the environment exposes tool discovery, ask Codex to discover subagent tools before execution:

```text
Enable or discover Codex subagent tools before using $subagent-driven-development.
Confirm that spawn_agent, wait_agent, send_input, and close_agent are available.
```

If Codex cannot expose a subagent spawn tool in the current environment, do not pretend the workflow can delegate. Use `$executing-plans` or direct controller-led implementation instead, and note that subagent execution is unavailable in that Codex session.

## When To Use Subagents

Use `$subagent-driven-development` when all of these are true:

- Codex subagent spawning is enabled for the session;
- there is an approved implementation plan, usually under `docs/superpowers/plans/`;
- the plan has tasks that can be executed independently or in a clear sequence;
- each delegated task can be described with exact requirements, affected files, and acceptance criteria;
- the controller agent can keep coordinating the session while subagents work.

Do not use subagents for vague discovery, broad architecture decisions, or tightly coupled changes where every step depends on the previous edit. Use `$executing-plans` or direct implementation instead when the work needs one continuous context.

## Installed Skill Locations

For Codex installs, managed Superpowers skills live under:

```text
.agents/skills/
```

For Claude installs, the same managed skills live under:

```text
.claude/skills/
```

In this source repository, the bundled upstream provider content lives under:

```text
packages/provider/superpowers/skills/
```

Do not edit managed installed skill files in target repositories. They are owned by `nd-gen-skills` and can be replaced by `sync`, `install`, or `--force` operations.

## Run A Subagent Workflow

Start from the target repository after installing the default provider:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Use the runtime variant that matches the repository. Then create or identify the approved plan and ask Codex to execute it:

```text
Use $subagent-driven-development to execute docs/superpowers/plans/<plan-file>.md.
Follow the installed runtime guidance and keep VCS writes gated for developer review.
```

The controller agent should:

1. Read the plan once and extract each task with full task text.
2. Create a task list for the whole run.
3. Dispatch one fresh implementer subagent per task.
4. Give the subagent the full task text, local context, working directory, expected tests, and boundaries.
5. Review the implementer's result with a spec-compliance subagent.
6. Review the approved implementation with a code-quality subagent.
7. Require fixes and re-review until both reviews pass.
8. Continue through the plan without asking "should I continue?" unless it is genuinely blocked.

## Prompt Shape

Superpowers ships three prompt templates inside the `subagent-driven-development` skill:

| Template | Purpose |
| --- | --- |
| `implementer-prompt.md` | Gives one subagent the exact task, context, test expectations, escalation rules, and report format. |
| `spec-reviewer-prompt.md` | Checks whether the implementation matches the task requirements exactly. |
| `code-quality-reviewer-prompt.md` | Checks maintainability, tests, decomposition, and review quality after spec compliance passes. |

When using Codex subagent tools directly, keep the same structure even if the tool UI differs:

```text
Role: worker
Task: Implement Task N: <task name>
Context: <why this task exists, related files, constraints>
Requirements: <full task text copied from the plan>
Ownership: <files or modules this subagent may change>
Rules:
- You are not alone in the codebase; do not revert other edits.
- Ask before implementation if requirements or dependencies are unclear.
- Follow the repository runtime guidance and existing patterns.
- Verify the change and report exact commands and results.
Report:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Files changed
- Tests run
- Self-review findings
```

For reviewer subagents, provide the task requirements, the implementer's report, and the concrete diff or commit range to inspect. The reviewer should verify code, not trust the implementer report.

## Codex Subagent Roles

Codex may expose different subagent roles depending on the session. Use them this way:

| Role | Use for |
| --- | --- |
| `explorer` | Specific read-only codebase questions that can run in parallel with local work. |
| `worker` | Bounded implementation or test changes with a clear file/module ownership scope. |
| `default` | General delegated work when no specialized role is available. |

Prefer no explicit model override unless the user requested one or the task clearly needs it. Use smaller/faster models only for mechanical, isolated tasks. Use stronger models for cross-file integration, architectural judgment, or review.

## VCS Gate In Nexi Runtime Skills

Upstream Superpowers guidance can ask implementer subagents to commit their work. Nexi runtime skills add a Human VCS Gate on top of that behavior.

In repositories installed through `nd-gen-skills`, reinterpret any provider or subagent instruction to run `git add`, `git commit`, `git push`, PR creation, merge, rebase, cherry-pick, branch deletion, or worktree cleanup as:

1. verify the change;
2. summarize the diff and test evidence;
3. stop for developer review.

Only perform VCS write actions after the user explicitly requests that specific action.

## Modify Subagent Behavior Safely

Use one of these approaches instead of editing managed skill files:

| Need | Preferred change |
| --- | --- |
| Add repository-specific rules | Put instructions outside the managed Nexi block in root `AGENTS.md`. |
| Narrow a single delegated task | Add constraints to the controller prompt for that run. |
| Change task ownership | Specify exact files or modules in the subagent dispatch prompt. |
| Change review depth | Add explicit review criteria to the reviewer prompt for that run. |
| Test a new subagent pattern | Save an unmanaged experimental prompt under the repository's own docs or tooling folder, then reference it from the controller prompt. |
| Change the bundled Superpowers provider | Request or prepare an upstream provider update instead of editing installed managed copies. |

When a change should apply to both Codex and Claude users, write it in tool-neutral language. Use placeholders such as `SKILL_DIR`, or explicitly map Codex to `.agents/skills/...` and Claude to `.claude/skills/...`.

## Good Delegation Boundaries

Good subagent tasks are concrete:

```text
Implement Task 2 from docs/superpowers/plans/search-filter.md.
Ownership: src/features/search/filter-state.ts and tests/unit/filter-state.test.ts.
Do not edit UI components.
Acceptance: persisted query is restored on reload, invalid saved state is ignored, unit tests cover both paths.
```

Poor subagent tasks are ambiguous:

```text
Improve the search feature and make it nicer.
```

For implementation work, assign disjoint write scopes. Do not dispatch multiple worker subagents that may edit the same files unless the controller can serialize and integrate the work deliberately.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Subagent asks for context | Provide the missing context and re-dispatch; do not force it to guess. |
| Subagent is blocked | Break the task down, provide more code context, or rerun with a stronger model. |
| Spec reviewer finds missing or extra behavior | Send the findings back to the implementer and require a fix before code-quality review. |
| Code reviewer finds maintainability issues | Fix and re-review; do not move to the next task with open review findings. |
| Subagent edited outside its scope | Review the diff, revert only the out-of-scope edits if the user permits, then tighten future ownership prompts. |
| Managed skill changes disappear after sync | Move local customizations out of `.agents/skills` or `.claude/skills`; managed files are intentionally refreshed. |

## Related Guides

- [Use Superpowers with TDD](superpowers-tdd.md)
- [Provider skills](provider-skills.md)
- [Choose provider and variant](choose-provider-and-variant.md)
- [Superpowers provider](../../providers/superpowers.md)
