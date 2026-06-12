# Workflow Orchestration Kit

Kit di orchestrazione per workflow strutturati nel portale meteo.

## Scopo

Coordinare fasi di sviluppo con gates espliciti e artifact tracking.

## Workflow State

```yaml
# .workflows/{RUN_ID}/workflow-state.yml
workflow:
  run_id: "weather-search-v1"
  status: "in_progress"  # planned, in_progress, completed, failed
  variant: "web-portal-frontend"
  provider: "nexi-web-portal-provider"
  
  artifacts:
    requirements: "requirements.md"
    implementation_plan: "implementation-plan.md"
    test_cases: "test-cases.md"
    
  phases:
    - name: "requirements"
      status: "completed"
      artifact: "requirements.md"
    - name: "architecture"
      status: "completed"
      artifact: "implementation-plan.md"
    - name: "test_design"
      status: "in_progress"
      artifact: "test-cases.md"
    - name: "development"
      status: "pending"
      artifact: null
    - name: "verification"
      status: "pending"
      artifact: null
```

## Phase Gates

1. **Requirements**: Design spec approvato
2. **Architecture**: Implementation plan approvato
3. **Test Design**: Test cases definiti
4. **Development**: Codice implementato e testato
5. **Verification**: Verifica completa superata

## Usage

```text
Use $workflow-orchestration-kit to coordinate a full workflow run for the weather-map feature using the installed runtime variant.
```

## Scripts

### Init Orchestration

```bash
python3 .agents/skills/workflow-orchestration-kit/scripts/init_orchestration.py \
  --issues PROJ-101 \
  --branch feature/weather-map \
  --run weather-map-v1
```

### Phase Transition

```bash
python3 .agents/skills/workflow-orchestration-kit/scripts/transition_phase.py \
  --workflow-dir .workflows/weather-map-v1 \
  --phase development \
  --status completed
```

## Related

- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
- [Weather Kit](meteo-weather-kit/SKILL.md)
