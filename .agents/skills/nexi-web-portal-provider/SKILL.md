# Nexi Web Portal Provider

Provider per lo sviluppo di portali web moderni con stack Node.js/Next.js.

## Capabilities

| Capability | Skill | Use when |
|------------|-------|----------|
| Requirements and design | `brainstorming` | Trasformare un'idea in design/spec approvato. |
| Implementation planning | `writing-plans` | Creare piano di implementazione task-by-task. |
| Isolated work | `using-git-worktrees` | Iniziare feature work senza disturbare workspace. |
| Execution | `executing-plans` o `subagent-driven-development` | Implementare piano scritto. |
| Test-first work | `test-driven-development` | Aggiungere comportamento con disciplina red-green-refactor. |
| Debugging | `systematic-debugging` | Investigare fallimenti prima di proporre fix. |
| Review | `requesting-code-review` e `receiving-code-review` | Verificare lavoro o gestire feedback review. |
| Completion | `verification-before-completion` | Verificare output prima di dichiarare completamento. |
| Branch finish | `finishing-a-development-branch` | Decidere come fare merge, PR, o pulizia. |

## Runtime Variant

Il provider supporta la variante:
- `web-portal-frontend` - Portali web con Next.js, React, TypeScript, Tailwind CSS.

## Direct Prompt Examples

Start design:
```text
Use $brainstorming to refine this portal feature idea considering the installed runtime variant:
Aggiungi una pagina di ricerca meteo avanzata con filtri per regione, tipo di previsione, e range temporale.
```

Create implementation plan:
```text
Use $writing-plans to create the implementation plan from docs/superpowers/specs/2026-06-12-weather-search-design.md.
```

Execute approved plan:
```text
Use $subagent-driven-development to execute docs/superpowers/plans/2026-06-12-weather-search.md.
Follow the installed runtime guidance and keep VCS writes gated for developer review.
```

Debug a failure:
```text
Use $systematic-debugging to investigate this failing command:
npm test -- tests/weather-search.test.ts
```

Verify completed work:
```text
Use $verification-before-completion to verify the completed work before final response.
```

## Output Locations

| Artifact | Path |
|----------|------|
| Design/spec documents | `docs/superpowers/specs/` |
| Implementation plans | `docs/superpowers/plans/` |
| Optional brainstorming artifacts | `.superpowers/brainstorm/` |

## Related

- [Runtime variant](web-portal-frontend-runtime/SKILL.md)
- [Weather utility](meteo-weather-kit/SKILL.md)
- [Map utility](meteo-map-kit/SKILL.md)
- [SEO utility](meteo-seo-kit/SKILL.md)
