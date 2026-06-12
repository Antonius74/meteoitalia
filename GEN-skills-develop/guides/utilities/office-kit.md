# Office Kit

Use this guide when a repository needs non-coding office document support with `office-kit`.

`office-kit` is the umbrella utility for Word, PDF, PowerPoint, spreadsheet, and document-to-Markdown workflows. Install it when you want one entry point for common office document tasks, or install one leaf utility when the repository only needs a single format.

## What It Installs

The full bundle installs:

- `office-kit`
- `docx`
- `pdf`
- `pptx`
- `xlsx`
- `markitdown`

`office-kit` is a lightweight routing skill. The format-specific utilities contain the detailed workflows, scripts, and references for each document type.

## Install The Full Bundle

From the target repository, install the full bundle for Codex:

```bash
npx -y @nexidigital/nd-gen-skills add-skill office-kit
```

Install the same bundle for Claude:

```bash
npx -y @nexidigital/nd-gen-skills add-skill office-kit --tool claude
```

Validate the managed state after install:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

For Claude validation:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci --tool claude
```

## Install One Specific Skill

Install only the utility needed for the target format:

```bash
npx -y @nexidigital/nd-gen-skills add-skill docx
npx -y @nexidigital/nd-gen-skills add-skill pdf
npx -y @nexidigital/nd-gen-skills add-skill pptx
npx -y @nexidigital/nd-gen-skills add-skill xlsx
npx -y @nexidigital/nd-gen-skills add-skill markitdown
```

For Claude installs, use `--tool claude`:

```bash
npx -y @nexidigital/nd-gen-skills add-skill docx --tool claude
npx -y @nexidigital/nd-gen-skills add-skill pdf --tool claude
npx -y @nexidigital/nd-gen-skills add-skill pptx --tool claude
npx -y @nexidigital/nd-gen-skills add-skill xlsx --tool claude
npx -y @nexidigital/nd-gen-skills add-skill markitdown --tool claude
```

## Install From A Local Tarball

Build the tarball from this repository:

```bash
npm ci
npm run prepare
mkdir -p dist
npm run pack
```

Set an absolute tarball path:

```bash
TARBALL="$(ls -t "$PWD"/dist/nexidigital-nd-gen-skills-*.tgz | head -n 1)"
```

From the target repository, install the full bundle from that tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill office-kit
```

Install one specific skill from the same tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill docx
```

For Claude installs, add `--tool claude` to the `add-skill` command.

## How To Use It

Use the format-specific skills when the requested work clearly targets one file type:

```text
Use $docx to review contract.docx, preserve tracked changes, and add comments for clauses that need legal confirmation.
```

```text
Use $pdf to extract the fillable fields from onboarding-form.pdf and create a completed copy from the supplied values.
```

```text
Use $pptx to update quarterly-review.pptx, refresh the speaker notes, and verify the deck renders correctly.
```

```text
Use $xlsx to analyze forecast.xlsx, recalculate formulas, and add a summary worksheet with the key variance drivers.
```

```text
Use $markitdown to convert the local source documents into Markdown for LLM review.
```

Use `office-kit` when the request spans multiple office formats or when the best leaf utility should be selected by the agent:

```text
Use $office-kit to convert the source briefing into a Word handout, a PowerPoint summary deck, and a spreadsheet of action items.
```

## Related Guides

- [Support utility skills](support-utility-skills.md)
- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Release process](../install/release-process.md)
