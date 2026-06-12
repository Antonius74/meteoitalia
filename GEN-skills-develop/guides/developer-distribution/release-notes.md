# Release Notes

## GEN-skills 1.2.2 Local Shareable Developer Artifact

Artifact date: 2026-06-09

Version `1.2.2` is a local shareable developer artifact built from `develop` after merging the `feat/relaease-skill` branch. It has not been recorded in `CHANGELOG.md` as an official package release. GitHub Actions still owns official publication from `main`.

## At A Glance

This artifact keeps the official `1.2.1` package line and adds two workflow fixes for developers and release maintainers:

| Area | What changed | Why it matters |
| --- | --- | --- |
| Runtime artifact naming | Runtime variants now prefer Jira Epic keys for Superpowers spec and plan filenames when Jira-backed work has a parent Epic. | Related Jira stories can produce stable artifact names grouped by Epic instead of date-only filenames. |
| Build artifact versioning | The build skill now chooses patch, minor, or user-requested major artifacts from explicit release intent. | Local shareable builds no longer treat every build as next patch when the user has confirmed a stable non-existing-skill change, while existing skill modifications remain patch fixes. |

## Runtime Artifact Naming

The `frontend-react`, `backend-java`, `mobile-android`, and `mobile-ios` runtime skills now include a Superpowers artifact naming rule for Jira-backed work.

When a provided Jira story has a parent Epic, the runtime tells agents to use the Epic issue key as the filename prefix while keeping a short topic slug:

| Artifact | Filename pattern |
| --- | --- |
| Spec | `docs/superpowers/specs/<EPIC-KEY>-<topic>-design.md` |
| Plan | `docs/superpowers/plans/<EPIC-KEY>-<topic>.md` |

If multiple provided Jira stories share one Epic, the runtime uses that Epic key. If provided stories belong to different Epics, the runtime uses the explicit story keys or another user-approved scope slug. If no Epic is provided or discoverable, it keeps the default Superpowers date-based filename.

This behavior is packaged into all four runtime variant archives in the generated registry.

## Build Version Policy

The build skill now documents a concrete shareable version policy:

| User and change signal | Local artifact version behavior |
| --- | --- |
| User explicitly says the release is major | Use the next or requested major version, such as `2.0.0`. |
| Change modifies previous existing skills | Use the next patch version, such as `1.2.2` after `1.2.1`. |
| User confirms the build is stable and the scope is not only existing-skill modifications | Use the next minor version, such as `1.3.0` after `1.2.1`. |
| No stable confirmation and no major request | Use the next patch version. |

Documentation-only repository improvements, such as `README.md`, `docs/`, or `guides/`, qualify for the minor path only after the user explicitly confirms the build is stable. Documentation edits inside existing skills still count as existing-skill modifications and use the patch path unless the user explicitly requests a major release.

## Install From This Local Artifact

Install a utility skill from the local tarball with npm:

```bash
cd /path/to/target-repo
npm exec --yes --package /Users/marcofasanella/Projects/GEN-skills/dist/codex-shareable/gen-skills-1.2.2.tgz -- \
  nd-gen-skills add-skill documentation-kit --tool codex
```

For Claude target repositories, use the same command with `--tool claude`.

The generated runner is also available for Codex utility installs:

```bash
node /Users/marcofasanella/Projects/GEN-skills/dist/codex-shareable/run-codex-install.js documentation-kit /path/to/target-repo
```

The runner is fixed to Codex and always delegates to `npm exec` with `--tool codex`, so npm must be available in the runtime `PATH`.

## Validation Coverage

This local artifact was validated with:

| Check | Result |
| --- | --- |
| `npm ci` | Completed with zero vulnerabilities reported during install. |
| `git diff --check` | Passed. |
| `npm audit --audit-level=moderate` | Found zero vulnerabilities. |
| `npm test` | 16 test files passed, 231 tests passed. |
| `npm run prepare` | TypeScript build and registry build completed. |
| `npm run build:codex-shareable` | Built `gen-skills-1.2.2.tgz` and `run-codex-install.js`. |
| `npm run release:dry-run` | Completed with compatible Node `v24.14.0`; no official release was predicted because the dry run was on `develop`, not `main`. |
| Tarball smoke test | `nd-gen-skills list --available` ran from the `.tgz` and listed packaged registry entries. |
| Runner smoke test | Installed `documentation-kit` into a temporary Codex target and verified `.agents/skills/documentation-kit/SKILL.md`. |
| Build skill security scan | Reported zero findings. |

The official next package version remains controlled by semantic-release on `main`; this note describes the local shareable artifact only.
