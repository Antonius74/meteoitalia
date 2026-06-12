# Provider Skills

Provider skills define the workflow phases Codex can use after installation. The selected runtime variant adapts those workflows to the repository type.

| Provider | Role |
| --- | --- |
| `superpowers` | Default provider for design, plans, TDD, debugging, review, and verification. |
| `workflow-stack` | Governed provider for evidence-heavy delivery, workflow state, requirements, architecture, test design, and traceability. |

Future providers should be documented under this `workflow/` folder. Add a provider section with its install command, when to use it, main workflow skills, and expected artifacts.

For default development, continue with [Superpowers TDD](superpowers-tdd.md).
