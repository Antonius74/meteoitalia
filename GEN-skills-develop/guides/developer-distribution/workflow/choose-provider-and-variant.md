# Choose Provider And Variant

## Provider

| Provider | Default | Use when | Install shape |
| --- | --- | --- | --- |
| `superpowers` | Yes | Normal design, planning, TDD, debugging, review, and verification. | Omit `--provider` or pass `--provider superpowers`. |
| `workflow-stack` | No | Governed Jira or evidence-heavy delivery with traceable artifacts. | Pass `--provider workflow-stack`. |

## Variant

| Variant | Use when |
| --- | --- |
| `frontend-react` | React frontend repositories. |
| `backend-java` | Java backend repositories. |
| `mobile-ios` | iOS repositories. |
| `mobile-android` | Android repositories. |

## Local Tarball Examples

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Published Package Examples

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --variant backend-java
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Validate

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills validate --ci
```
