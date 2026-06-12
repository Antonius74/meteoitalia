# Superpowers Provider Closure Design

Date: 2026-05-13

## Context

The `frontend-react` runtime was installed into `/Users/marcofasanella/Projects/portal-paas` from the local
`@nexidigital/nd-gen-skills` tarball. The structural installer validation passed, but a content audit found that the
installed `writing-plans` and `executing-plans` skills reference Superpowers workflow skills that are not packaged in
the `superpowers` provider bundle:

- `superpowers:subagent-driven-development`
- `superpowers:using-git-worktrees`

Those skills exist in the downloaded upstream Superpowers directory at
`/Users/marcofasanella/.agents/vendor/superpowers/skills/`, but the GEN-skills provider package currently imports only
a subset of the upstream workflow skills.

The user constraint is that downloaded Superpowers skills must remain untouched. The package may vendor Superpowers
skills, but it must not hand-edit their content because the user may download a new upstream Superpowers version and
resync the provider bundle.

## Goals

- Keep original Superpowers skill names exactly.
- Import the missing workflow skills into the `superpowers` provider bundle.
- Keep all vendored Superpowers skill content unchanged.
- Make future Superpowers updates repeatable with a sync script instead of manual edits.
- Add regression coverage so packaged Superpowers skill references resolve to packaged provider skills.
- Keep Nexi-specific orchestration in Nexi-owned runtime, contract, manifest, and test files only.
- Reinstall and validate the fixed frontend runtime in `portal-paas`.

## Non-Goals

- Rename Superpowers skills.
- Patch `writing-plans`, `executing-plans`, or other vendored Superpowers skill bodies.
- Add aliases such as `nexi-subagent-driven-development`.
- Introduce a generic provider skill dependency resolver in V1.
- Change utility dependency semantics.
- Make `.agents/` tracked in `portal-paas`; that remains controlled by the target repository.

## Approved Direction

Use a vendored upstream snapshot model.

`packages/provider/superpowers/skills/` contains exact copies of selected upstream Superpowers skill directories. The
provider manifest lists those copied directories by their original names. If a future upstream download changes a skill,
maintainers rerun a sync script and review the resulting vendor diff instead of editing copied files manually.

Nexi-owned files may describe how to orchestrate those skills for Nexi workflows, but they do not modify the upstream
skill content.

## Provider Bundle Shape

The provider bundle should add these upstream skill directories unchanged:

```text
packages/provider/superpowers/skills/subagent-driven-development/
  SKILL.md
  implementer-prompt.md
  spec-reviewer-prompt.md
  code-quality-reviewer-prompt.md

packages/provider/superpowers/skills/using-git-worktrees/
  SKILL.md
```

The provider manifest should list both skills with their original names:

```yaml
skills:
  - name: subagent-driven-development
    role: workflow
    source: skills/subagent-driven-development
  - name: using-git-worktrees
    role: workflow
    source: skills/using-git-worktrees
```

The existing skills remain unchanged and keep their current names:

```text
brainstorming
executing-plans
finishing-a-development-branch
receiving-code-review
requesting-code-review
systematic-debugging
test-driven-development
verification-before-completion
writing-plans
```

## Capabilities

The current provider capabilities can keep their existing public contract:

```yaml
requirements-design:
  skill: brainstorming
planning:
  skill: writing-plans
execution:
  skill: executing-plans
tdd:
  skill: test-driven-development
debugging:
  skill: systematic-debugging
verification:
  skill: verification-before-completion
code-review:
  skills:
    - requesting-code-review
    - receiving-code-review
finishing:
  skill: finishing-a-development-branch
```

Two optional capabilities may be added if useful for runtime validation and discoverability:

```yaml
workspace-isolation:
  skill: using-git-worktrees
subagent-execution:
  skill: subagent-driven-development
```

If adding capabilities causes unnecessary variant churn, this can be deferred. The essential behavior is that both
skills are packaged and available by their original names.

## Runtime References

Every runtime variant that currently references planning and execution should reference the full workflow closure:

```yaml
runtime:
  references:
    - nexi-workflow-contracts
    - brainstorming
    - writing-plans
    - using-git-worktrees
    - subagent-driven-development
    - executing-plans
    - test-driven-development
    - systematic-debugging
    - verification-before-completion
    - requesting-code-review
    - receiving-code-review
    - finishing-a-development-branch
```

This should apply consistently to:

- `frontend-react`
- `backend-java`
- `mobile-ios`
- `mobile-android`

The runtime `SKILL.md` files are Nexi-owned and can be updated to describe the preferred orchestration order without
changing vendored Superpowers content.

## Runtime Orchestration Guidance

Runtime skills should make the intended workflow explicit:

1. Use `nexi-workflow-contracts` for command discovery, test design, e2e applicability, traceability, manual tester
   scenarios, skipped verification, and residual risk reporting.
2. Use `brainstorming` for behavior-changing, UX, or creative work.
3. Use `writing-plans` when a multi-step implementation plan is needed.
4. Use `using-git-worktrees` before executing implementation plans when workspace isolation is needed.
5. Prefer `subagent-driven-development` when subagents are available and the plan can be decomposed into independent
   tasks.
6. Use `executing-plans` for inline or fallback plan execution.
7. Use `test-driven-development` before production code for behavior changes.
8. Use `systematic-debugging` for failing tests, build errors, runtime defects, and unexpected behavior.
9. Use `verification-before-completion` before claiming completion.
10. Use `requesting-code-review` and `receiving-code-review` for review workflows.
11. Use `finishing-a-development-branch` when implementation is complete and integration choices are needed.

The runtime must not rewrite Superpowers instructions. It only sequences them and adds Nexi evidence expectations from
`nexi-workflow-contracts`.

## Superpowers Sync Script

Add a maintainer script that copies an explicit whitelist from an upstream Superpowers skills directory into the
provider package.

Example command:

```bash
npm run sync:superpowers-provider -- --source /Users/marcofasanella/.agents/vendor/superpowers/skills
```

The script should:

1. Accept `--source <path>` pointing to an upstream Superpowers `skills/` directory.
2. Keep a hardcoded or repository-owned whitelist of skill names used by the provider bundle.
3. Validate that every whitelisted source directory exists.
4. Remove and replace only whitelisted destination skill directories under `packages/provider/superpowers/skills/`.
5. Preserve upstream file contents and relative paths exactly.
6. Fail if a copied skill directory lacks `SKILL.md`.
7. Print a concise summary of copied skills.

The script should not edit vendored files after copying. Any Nexi adaptation belongs outside the vendored directories.

## Regression Tests

Automated tests should cover the content-level closure that installer validation does not currently catch:

- The provider manifest lists every directory under `packages/provider/superpowers/skills/`.
- Every provider manifest skill source exists.
- Every `superpowers:<skill-name>` reference in vendored provider Markdown resolves to a skill listed in the provider
  manifest, unless the reference is explicitly allowlisted as external.
- Runtime manifest references resolve to managed provider skills or required contract skills.
- Runtime references include `subagent-driven-development`, `using-git-worktrees`, and
  `finishing-a-development-branch`.
- The provider archive produced by `build-registry` contains the newly imported skill directories and prompt files.

The reference-closure test is the key guard. It prevents a future partial import from passing lockfile validation while
leaving skill content with unresolved workflow references.

## Portal PaaS Validation

After implementation:

1. Rebuild the local package tarball.
2. Reinstall `frontend-react` into `/Users/marcofasanella/Projects/portal-paas`.
3. Run `nd-gen-skills validate --ci` in `portal-paas`.
4. Run `nd-gen-skills list` and verify the managed skill count increased to include the two added workflow skills.
5. Re-run the content audit:
   - no unresolved `superpowers:<skill-name>` references
   - runtime references resolve
   - `AGENTS.md` points to `nexi-frontend-react-runtime`

The target repo already ignores `.agents/`, so installed skill content remains local-only unless that repository changes
its `.gitignore` policy.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Upstream Superpowers changes break local expectations | Sync script produces a normal git diff for review before packaging |
| Provider bundle grows too large | The two added skills are workflow-critical and small enough for the provider package |
| Runtime references become too broad | Keep references limited to skills the runtime actually orchestrates |
| Future Superpowers skill references another unimported skill | Reference-closure test fails before packaging |
| Maintainers accidentally edit vendored files | Document vendored directories as upstream snapshots and review diffs from the sync script |

## Self-Review

- Placeholder scan: no placeholders or TODOs remain.
- Internal consistency: the design keeps Superpowers content unchanged while allowing Nexi runtime files to orchestrate
  the workflow.
- Scope check: this is focused on provider closure and runtime reference integrity, not generic dependency modeling.
- Ambiguity check: the approved behavior is explicit: import missing skills unchanged, keep original names, and add a
  sync script plus tests.
