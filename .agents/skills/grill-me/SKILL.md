# Grill Me

Utility skill per revisione e challenge delle idee di implementazione.

## Scopo

Prima di iniziare qualsiasi implementazione, usare $grill-me per:
- Verificare completezza del piano
- Identificare edge cases
- Valutare alternative tecniche
- Assicurare coerenza con pattern del runtime

## Usage

```text
Use $grill-me to review this implementation plan for the weather search feature:

Plan:
1. Add search API route
2. Create SearchBar component
3. Add autocomplete dropdown
4. Integrate with Open-Meteo geocoding API
5. Add recent searches to localStorage

Concerns:
- How to handle rate limiting?
- What about mobile UX?
- Should we debounce the input?
```

## Expected Output

Grill-me risponde con:
1. **Missing considerations** - Cosa manca nel piano
2. **Technical risks** - Rischi tecnici identificati
3. **Suggested improvements** - Miglioramenti proposti
4. **Validation checklist** - Lista di verifica prima dell'implementazione

## Portal-Specific Checks

- Mobile responsiveness del componente
- Accessibility (ARIA labels, keyboard navigation)
- Performance (bundle size, lazy loading)
- SEO impact (crawlable search results)
- Caching strategy per API calls
- Error states e fallback UI

## Related

- [Frontend Runtime](nexi-web-portal-frontend-runtime/SKILL.md)
- [Weather Kit](meteo-weather-kit/SKILL.md)
