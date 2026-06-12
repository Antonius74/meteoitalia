# Nexi AI Skills Developer Guide

## Start Here

Use this guide pack to install and use `@nexidigital/nd-gen-skills` in Codex repositories.

## Choose Your Install Path

| Situation | Start here |
| --- | --- |
| You received a prebuilt `.tgz` package archive | [Install from a local tarball](installation/local-tarball.md) |
| You have access to Nexi Artifactory and an npm token | [Install from the published package](installation/published-package.md) |

## What To Do Next

| Need | Guide |
| --- | --- |
| Choose the default provider and runtime variant | [Choose provider and variant](workflow/choose-provider-and-variant.md) |
| Use Superpowers for a TDD development stream | [Use Superpowers with TDD](workflow/superpowers-tdd.md) |
| Run and adapt Codex subagents with Superpowers | [Codex subagents with Superpowers](workflow/codex-subagents-superpowers.md) |
| Understand provider skills and future providers | [Provider skills](workflow/provider-skills.md) |
| Document a codebase | [Documentation guide](documentation/README.md) |
| Install one utility skill | [Utility skills](utility-skills.md) |
| Review the latest skill additions and improvements | [Release notes](release-notes.md) |

## Default Recommendation

For normal Codex development, install the default `superpowers` provider with the runtime variant that matches the target repository.

## What The Installer Writes

For Codex, the installer writes managed skills under `.agents/skills`, records ownership in `.agents/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in root `AGENTS.md`.

## Safety Rules

Do not manually edit managed skill files or the managed Nexi block in `AGENTS.md`. Put repository-specific instructions outside the managed block.
