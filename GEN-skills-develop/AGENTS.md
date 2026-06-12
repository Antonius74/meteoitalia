# Repository Guidelines

## Project Structure & Module Organization

This repository builds `@nexidigital/nd-gen-skills`, a Node 20 TypeScript CLI for installing managed AI skills. Core source lives in `src/`: CLI entry points are in `src/bin` and `src/cli`, command handlers in `src/commands`, installation logic in `src/installer`, registry handling in `src/registry`, and tool adapters in `src/adapters`. Tests are split into `tests/unit` and `tests/integration`. Installable skill packages live under `packages/{provider,variant,contract,utility}`; generated registry output lives in `dist-registry`. User-facing docs and workflow plans live in `README.md`, `ARCHITECTURE.md`, `guides/`, and `docs/`.

## Build, Test, and Development Commands

- `npm ci`: install locked dependencies.
- `npm run build`: compile TypeScript sources and scripts into `dist`.
- `npm run build:registry`: regenerate `dist-registry/index.yaml` and packaged registry artifacts.
- `npm test`: run the full Vitest suite once.
- `npm run test:watch`: run Vitest in watch mode during development.
- `npm run prepare`: build code and registry before packaging.
- `npm pack --pack-destination dist --ignore-scripts`: create a local tarball for target-repository testing.

## Coding Style & Naming Conventions

Use strict TypeScript with two-space indentation and named exports where practical. This is an ESM/NodeNext project: relative imports in TypeScript should use the emitted `.js` suffix, for example `import { parseArgs } from "./args.js"`. Keep file names lowercase and hyphenated, such as `install-support.ts` or `path-safety.ts`. There is no separate lint script, so rely on `npm run build` and focused review for style enforcement.

## Testing Guidelines

Vitest runs in the Node environment and discovers `tests/**/*.test.ts`. Place small pure-function coverage in `tests/unit` and filesystem or CLI workflow coverage in `tests/integration`. Name tests after the behavior under test, for example `install-planner.test.ts` or `cli-e2e.test.ts`. Add or update tests for any installer, registry, adapter, lockfile, or CLI behavior change, then run `npm test`.

## Commit & Pull Request Guidelines

Recent history uses conventional prefixes such as `feat:`, `fix:`, `docs:`, `test:`, `build:`, and `chore:`. Keep commits focused and describe the observable change. Pull requests should include a short purpose statement, linked issue or plan when applicable, test results, and any registry or package artifacts intentionally refreshed.

## Agent-Specific Instructions

Use the `$grill-me` skill when planning or suggesting an implementation plan or idea. When implementing a fix or doing development, including modifying or creating skills, deeply verify that the change is consistent with all available provider framework skills and will fit once installed and glued together with provider skills. When completing, adding, or modifying a skill, perform a security assessment with the `$skill-scanner` skill before considering the work complete. Never edit provider skills under `packages/provider/`; they are upstream skills and should stay consistent through provider package updates.

When creating or modifying utility skills, keep them tool-agnostic by default. Do not hardcode Codex-only paths such as `.agents/skills` in reusable skill guidance, scripts, or examples unless the text also explains the equivalent path for every supported tool. Skills must work after installation for both Codex and Claude, so examples that reference installed skill files should either use a tool-neutral placeholder such as `SKILL_DIR` or explicitly map Codex to `.agents/skills/...` and Claude to `.claude/skills/...`. Add regression coverage when a skill includes tool-specific install paths or helper-script examples.

# Repository Instructions

- Use the `$grill-me` skill when planning or suggesting an implementation plan or idea.
- When making code changes, including modifying or creating skills, deeply verify that the change is consistent with all available provider framework skills and will fit once installed and glued together with provider skills.
- When completing, adding, or modifying a skill, perform a security assessment with the `$skill-scanner` skill before considering the work complete.
- When implementing a fix or doing development, never edit provider skills under `packages/provider/`. They are open-source upstream skills that are already tested, versioned, and kept consistent through provider package updates.
- When creating or modifying utility skills, keep them tool-agnostic by default. Do not hardcode Codex-only paths such as `.agents/skills` in reusable skill guidance, scripts, or examples unless the text also explains the equivalent path for every supported tool. Skills must work after installation for both Codex and Claude, so examples that reference installed skill files should either use a tool-neutral placeholder such as `SKILL_DIR` or explicitly map Codex to `.agents/skills/...` and Claude to `.claude/skills/...`. Add regression coverage when a skill includes tool-specific install paths or helper-script examples.
