## Variant Overlay: Frontend

- frontend: [`../workflow-core-kit/templates/skills/frontend/architecture.template.md`](../workflow-core-kit/templates/skills/frontend/architecture.template.md)
- API consumer contract: [`../workflow-core-kit/references/api-consumer-contract.md`](../workflow-core-kit/references/api-consumer-contract.md)
- backend API handoff artifact: `artifacts.api_contract` from `<run_dir>/workflow-state.yml` or an explicitly provided `api-contract.md`
- frontend architecture consumes `api-contract.md` when available; it must not create or regenerate that backend-owned handoff artifact
