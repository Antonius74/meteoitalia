---
name: caveman-stats
description: Use when the user asks for caveman token stats or savings metrics and the active environment may expose compatible stats data.
---

# Caveman Stats

Show real token usage and estimated savings when the active toolchain exposes caveman stats data.

## Rules

- Prefer exact tool-provided numbers over guesses.
- If the environment already injected the stats, surface them directly.
- If no compatible hook or stats source exists in the current environment, say that clearly.
- Do not invent savings numbers.

## Boundaries

- This skill does not compute token stats from scratch.
- This skill does not read proprietary logs unless the toolchain already makes them available.
