# Skill Scanner

Utility skill per security assessment delle skill e del codice.

## Scopo

Scansiona skill e codice per:
- Potenziali vulnerabilità di sicurezza
- Pattern non sicuri
- Secrets esposti
- Dipendenze vulnerabili

## Security Checklist

### Code Scan
- [ ] Nessun API key o secret hardcoded
- [ ] Nessuna password o token in chiaro
- [ ] Input sanitization implementata
- [ ] Output encoding per prevenire XSS
- [ ] CSRF tokens dove necessario

### Dependencies
- [ ] `npm audit` non riporta vulnerabilità critiche
- [ ] Dipendenze aggiornate alle ultime versioni stabili
- [ ] No dipendenze non utilizzate

### Network
- [ ] API calls usano HTTPS
- [ ] Rate limiting implementato
- [ ] Timeout configurati per fetch

### Data
- [ ] Dati sensibili non loggati in console
- [ ] localStorage/sessionStorage usati solo per dati non sensibili
- [ ] Cookie security flags (Secure, HttpOnly, SameSite)

## Usage

```text
Use $skill-scanner to assess security of the newly created weather service implementation.
```

## Related

- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
- [Verification Before Completion](verification-before-completion/SKILL.md)
