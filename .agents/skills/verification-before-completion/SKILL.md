# Verification Before Completion

Utility skill per verifica finale prima di dichiarare un task completato.

## Scopo

Assicurarsi che il lavoro soddisfi tutti i criteri di qualità prima del completamento.

## Verification Checklist

### Build Verification
- [ ] `npm run build` passa senza errori
- [ ] `npx tsc --noEmit` passa senza errori di tipo
- [ ] Nessun warning critico in console

### Code Quality
- [ ] Componenti seguono naming conventions
- [ ] Types TypeScript sono completi e accurati
- [ ] Nessun `any` implicito o non giustificato
- [ ] Codice segue principi DRY e SOLID

### Testing
- [ ] Unit test passano (`npm test`)
- [ ] Coverage > 80% per nuovo codice
- [ ] Edge cases sono coperti
- [ ] Integration test verificano flussi end-to-end

### UI/UX
- [ ] Responsive design verificato (mobile, tablet, desktop)
- [ ] Dark mode funziona correttamente
- [ ] Loading states implementati
- [ ] Error states implementati
- [ ] Accessibility verificata (WCAG 2.1 AA)

### Performance
- [ ] Lighthouse score > 90
- [ ] Nessun memory leak
- [ ] Images ottimizzate
- [ ] Bundle size verificato

### Documentation
- [ ] README aggiornato
- [ ] AGENTS.md aggiornato
- [ ] Commenti per logica complessa
- [ ] JSDoc per funzioni pubbliche

### Security
- [ ] No secrets in codice
- [ ] Input validation implementata
- [ ] XSS prevention verificata
- [ ] CSRF protection dove applicabile

## Usage

```text
Use $verification-before-completion to verify the weather map implementation before final response.
```

## Related

- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
- [Grill Me](grill-me/SKILL.md)
