---
name: documentation-ubiquitous-language
description: Extract a DDD-style ubiquitous language glossary from the current conversation, flagging ambiguities and proposing canonical terms.
---

# Ubiquitous Language

Extract and formalize domain terminology from the current conversation and relevant repository evidence into a consistent repository-level glossary saved to `docs/UBIQUITOUS_LANGUAGE.md`.

## Process

1. Scan the conversation for domain-relevant nouns, verbs, and concepts.
2. Inspect existing repository documentation when it may already define domain terminology.
3. Identify ambiguity, synonyms, vague terms, and overloaded words.
4. Propose canonical term choices with aliases to avoid.
5. Write or update `docs/UBIQUITOUS_LANGUAGE.md` at the repository root, creating `docs/` if needed.
6. Output a concise summary in chat.

## Output Format

Write the file with this structure:

```md
# Ubiquitous Language

## [Domain Area]

| Term | Definition | Aliases to avoid |
|---|---|---|
| **[Term]** | [One-sentence definition.] | [aliases] |

## Relationships

- **[Term]** relates to **[Other Term]** by [relationship].

## Example dialogue

> **Dev:** "[question using canonical terms]"
> **Domain expert:** "[answer using canonical terms]"

## Flagged ambiguities

- "[word]" was used to mean both **[Term A]** and **[Term B]**. Use **[Term A]** for [meaning] and **[Term B]** for [meaning].
```

## Rules

- Be opinionated. When multiple words exist for the same concept, pick the best one and list the others as aliases to avoid.
- Flag conflicts explicitly with a clear recommendation.
- Only include terms relevant for domain experts.
- Skip generic programming concepts unless they have domain-specific meaning.
- Keep definitions tight: one sentence max, defining what the term is.
- Show relationships with bold term names and cardinality where obvious.
- Always write the artifact at repository scope as `docs/UBIQUITOUS_LANGUAGE.md`.
- Do not create local boundary glossary files.
- Group local terms in the repository file when bounded contexts or local subdomains have distinct language.
- Group terms into multiple tables when natural clusters emerge.
- Include a short example dialogue using the terms precisely.

## Re-running

When invoked again:

1. Read the existing `docs/UBIQUITOUS_LANGUAGE.md`.
2. Incorporate new terms from subsequent discussion.
3. Update definitions if understanding has evolved.
4. Re-flag new ambiguities.
5. Rewrite the example dialogue when needed to reflect current canonical language.
