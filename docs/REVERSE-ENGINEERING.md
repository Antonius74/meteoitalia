# Reverse Engineering - GEN-skills-develop → MeteoItalia Portal

## Panoramica

Questo documento descrive il reverse engineering completo della piattaforma GEN-skills-develop (framework Nexi per skill management) adattato al contesto del portale meteo "MeteoItalia".

## Mapping Pattern GEN-skills → Portal Skills

### Provider Pattern

| GEN-skills Originale | Portal Adaptation | Descrizione |
|---------------------|-------------------|-------------|
| `superpowers` | `nexi-web-portal-provider` | Provider base per workflow di sviluppo web |
| `workflow-stack` | `workflow-orchestration-kit` | Orchestrazione con phase gates |

### Variant Pattern

| GEN-skills Originale | Portal Adaptation | Stack |
|---------------------|-------------------|-------|
| `frontend-react` | `web-portal-frontend-runtime` | Next.js 16, React 19, Tailwind CSS 4 |
| `backend-java` | N/A | Non applicabile per frontend-only portal |

### Utility Pattern

| GEN-skills Originale | Portal Adaptation | Scopo |
|---------------------|-------------------|-------|
| `grill-me` | `grill-me` | Review implementazione (identico) |
| `verification-before-completion` | `verification-before-completion` | Quality gates (identico) |
| `skill-scanner` | `skill-scanner` | Security assessment (identico) |
| `read-jira-issue` | `meteo-weather-kit` | Integrazione dati meteo (domain-specific) |
| `figma-use` | `meteo-map-kit` | Integrazione mappe (domain-specific) |
| `frontend-react-e2e-test` | `meteo-seo-kit` | SEO optimization (domain-specific) |

### Contract Pattern

| GEN-skills Originale | Portal Adaptation | Contenuto |
|---------------------|-------------------|-----------|
| `contract-documentation-core` | `nexi-web-portal-contracts` | API contracts, component props, style contracts |

## Struttura Directory Adattata

### GEN-skills Standard
```
.agents/skills/
├── {provider}/           # Provider package
├── {variant}/            # Runtime variant
├── {contract}/           # Shared contracts
└── {utility}/            # Utility skills

```

### Portal Meteo Adaptation
```
.agents/skills/
├── nexi-web-portal-provider/           # Provider base
│   ├── SKILL.md                        # Workflow capabilities
│   └── manifest.yaml                   # Package manifest
├── web-portal-frontend-runtime/        # Next.js runtime
│   ├── SKILL.md                        # Stack conventions
│   └── manifest.yaml
├── nexi-web-portal-contracts/          # Shared contracts
│   ├── SKILL.md                        # API contracts
│   ├── shared-patterns.md              # Design patterns
│   ├── api-contracts.md                # API specs
│   └── manifest.yaml
├── meteo-weather-kit/                  # Weather utility
│   ├── SKILL.md                        # Data fetching patterns
│   └── manifest.yaml
├── meteo-map-kit/                      # Map utility
│   ├── SKILL.md                        # Leaflet integration
│   └── manifest.yaml
├── meteo-seo-kit/                      # SEO utility
│   ├── SKILL.md                        # SEO patterns
│   └── manifest.yaml
├── grill-me/                           # Review utility
│   └── SKILL.md
├── verification-before-completion/     # Quality utility
│   └── SKILL.md
├── skill-scanner/                      # Security utility
│   └── SKILL.md
└── workflow-orchestration-kit/         # Orchestration
    └── SKILL.md

```

## Lockfile Model

### GEN-skills Lockfile
```yaml
version: "1.0"
tool: "codex"
provider: "superpowers"
variant: "frontend-react"
packages:
  provider:
    name: "superpowers"
  variant:
    name: "frontend-react"
  contracts:
    - name: "documentation-core"
  utilities:
    - name: "grill-me"
    - name: "tdd"
managed_files:
  - path: "AGENTS.md"
    hash: "sha256:..."
```

### Portal Lockfile
```yaml
version: "1.0"
tool: "codex"
provider: "nexi-web-portal-provider"
variant: "web-portal-frontend-runtime"
packages:
  provider:
    name: "nexi-web-portal-provider"
    version: "1.0.0"
    path: ".agents/skills/nexi-web-portal-provider"
  variant:
    name: "web-portal-frontend-runtime"
    version: "1.0.0"
    path: ".agents/skills/web-portal-frontend-runtime"
  contracts:
    - name: "nexi-web-portal-contracts"
      version: "1.0.0"
      path: ".agents/skills/nexi-web-portal-contracts"
  utilities:
    - name: "meteo-weather-kit"
      version: "1.0.0"
      path: ".agents/skills/meteo-weather-kit"
    - name: "meteo-map-kit"
      version: "1.0.0"
      path: ".agents/skills/meteo-map-kit"
    - name: "meteo-seo-kit"
      version: "1.0.0"
      path: ".agents/skills/meteo-seo-kit"
    - name: "grill-me"
      version: "1.0.0"
      path: ".agents/skills/grill-me"
    - name: "verification-before-completion"
      version: "1.0.0"
      path: ".agents/skills/verification-before-completion"
    - name: "skill-scanner"
      version: "1.0.0"
      path: ".agents/skills/skill-scanner"
managed_files:
  - path: "AGENTS.md"
    hash: "sha256:..."
    block_start: "<!-- BEGIN:nextjs-agent-rules -->"
    block_end: "<!-- END:nextjs-agent-rules -->"
```

## Capability Mapping

### GEN-skills Capabilities → Portal Capabilities

| Capability | GEN-skills Skill | Portal Skill | Note |
|-----------|-----------------|--------------|------|
| Brainstorming | `$brainstorming` | `$brainstorming` | Identico |
| Planning | `$writing-plans` | `$writing-plans` | Identico |
| Execution | `$executing-plans` | `$executing-plans` | Identico |
| TDD | `$test-driven-development` | `$test-driven-development` | Identico |
| Debugging | `$systematic-debugging` | `$systematic-debugging` | Identico |
| Review | `$requesting-code-review` | `$requesting-code-review` | Identico |
| Verification | `$verification-before-completion` | `$verification-before-completion` | Identico |
| Weather Data | N/A | `$meteo-weather-kit` | Nuovo, domain-specific |
| Map Integration | N/A | `$meteo-map-kit` | Nuovo, domain-specific |
| SEO | N/A | `$meteo-seo-kit` | Nuovo, domain-specific |

## Artifact Locations

### GEN-skills Standard
| Artifact | Path |
|----------|------|
| Design specs | `docs/superpowers/specs/` |
| Implementation plans | `docs/superpowers/plans/` |
| Brainstorm artifacts | `.superpowers/brainstorm/` |
| Workflow runs | `.workflows/RUN_ID/` |

### Portal Adaptation
| Artifact | Path | Note |
|----------|------|------|
| Design specs | `docs/superpowers/specs/` | Identico |
| Implementation plans | `docs/superpowers/plans/` | Identico |
| Brainstorm artifacts | `.superpowers/brainstorm/` | Identico |
| Workflow runs | `.workflows/RUN_ID/` | Identico |
| Weather schemas | `.agents/skills/meteo-weather-kit/` | Domain-specific |
| Map schemas | `.agents/skills/meteo-map-kit/` | Domain-specific |
| SEO schemas | `.agents/skills/meteo-seo-kit/` | Domain-specific |

## Safety Model

Il safety model è mantenuto identico:
- Solo managed skill folders sono modificabili
- Lockfile traccia hash dei managed files
- `--force` richiesto per overwrite in CI
- Variant switches richiedono `--replace-variant`

## Extension Points

### Adding a New City
```bash
# 1. Update constants
# 2. Regenerate static params
# 3. Rebuild
```

### Adding a New Feature
```bash
# 1. Use $brainstorming for design
# 2. Use $writing-plans for implementation plan
# 3. Use $executing-plans with $web-portal-frontend-runtime
# 4. Use $verification-before-completion for quality check
# 5. Use $skill-scanner for security assessment
```

### Adding a New Utility
```bash
# 1. Create utility package in .agents/skills/
# 2. Add manifest.yaml
# 3. Add SKILL.md with tool-agnostic guidance
# 4. Update lockfile
# 5. Run validation
```

## Build & Verification

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build

# Test
npm test

# Type check
npx tsc --noEmit

# Validate skills
# npx -y @nexidigital/nd-gen-skills validate --ci
```

## Conclusione

Il reverse engineering ha prodotto una struttura completa di skill che:
1. Mantiene la struttura e i pattern del framework GEN-skills-develop
2. Adatta le capability al contesto specifico di un portale web meteo
3. Preserva la safety model e il lockfile system
4. Aggiunge utility domain-specific per dati meteo, mappe e SEO
5. Supporta sia Codex che Claude con path tool-agnostic

Il portale è ora governato dallo stesso workflow discipline del framework Nexi originale.
