# Login To Artifactory And Install

Use this guide when a developer needs to authenticate to the Nexi Artifactory npm registry and install `@nexidigital/nd-gen-skills` from a target repository.

The package is published to:

```text
https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

## Prerequisites

- Node.js 20 or newer.
- npm access to the Nexi Artifactory registry.
- An Artifactory npm access token or an `NPM_TOKEN` value provided by the Nexi platform or repository maintainers.
- A target repository where the managed skills should be installed.

Do not commit personal registry tokens to a repository. Put user credentials in your user-level npm configuration or export them as environment variables.

## Configure npm With A Token

Set the token for your current shell:

```bash
export NPM_TOKEN="<your-artifactory-npm-token>"
```

Keep the normal public npm registry as the default for unscoped packages, and route only the Nexi scope to Artifactory:

```bash
npm config set registry https://registry.npmjs.org/ --location=user
npm config set @nexidigital:registry https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local --location=user
npm config set //artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local/:_authToken "\${NPM_TOKEN}" --location=user
```

This two-registry setup lets npm fetch public dependencies such as `commander` from `https://registry.npmjs.org/` while fetching `@nexidigital/nd-gen-skills` from the Nexi Artifactory registry. It also keeps the token value outside the target repository and lets npm resolve the token from the `NPM_TOKEN` environment variable.

The resulting user-level `.npmrc` should look like this:

```ini
registry=https://registry.npmjs.org/
@nexidigital:registry=https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
//artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local/:_authToken=${NPM_TOKEN}
```

Do not put shell syntax such as `export NPM_TOKEN=...` in `.npmrc`. Export environment variables in your shell profile or current terminal session, and reference them from `.npmrc` with `${NPM_TOKEN}`.

## Alternative: Interactive npm Login

If your Artifactory account supports npm login, run:

```bash
npm login \
  --scope=@nexidigital \
  --registry=https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

Use your Artifactory username and token or password according to your Nexi access setup.

## Verify Access

Confirm npm can see the package:

```bash
npm view @nexidigital/nd-gen-skills version
```

If this fails with `401`, `403`, or `404`, verify that `NPM_TOKEN` is exported in the current shell and that your Artifactory account has access to the `@nexidigital` scope.

## Install Skills In A Repository

Most users can run the package directly with `npx`; this downloads the package from Artifactory and executes it without adding it to the target repository dependencies.

From the repository that should receive the managed skills, install the default Codex setup:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Install the governed Workflow Stack provider when the work needs Jira or requirement evidence, workflow artifacts, and traceable delivery:

```bash
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

For Claude repository-local skills, add `--tool claude`:

```bash
npx -y @nexidigital/nd-gen-skills install --tool claude --variant frontend-react
```

## Optional: Install The CLI Globally

To install the remote package once on a developer machine and make the `nd-gen-skills` command available outside a single repository, use the npm global flag:

```bash
npm install -g @nexidigital/nd-gen-skills
```

After the global install, run commands from the repository that should receive managed skills:

```bash
nd-gen-skills install --variant frontend-react
nd-gen-skills validate --ci
```

Use `-g` for this machine-wide CLI install. A plain `npm install @nexidigital/nd-gen-skills` installs the package only in the current repository.

## Optional: Add The Package Dependency

If the target repository should keep `nd-gen-skills` as a local dependency, install it after authentication:

```bash
npm install --save-dev @nexidigital/nd-gen-skills
```

For Yarn projects, configure the same registry scope in `.yarnrc.yml` or user-level Yarn configuration before installing:

```yaml
npmScopes:
  nexidigital:
    npmRegistryServer: "https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local"
    npmAuthToken: "${NPM_TOKEN}"
```

Then run:

```bash
yarn add --dev @nexidigital/nd-gen-skills
```

## Validate The Installation

Run:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills list
```

For Claude installs, add `--tool claude` to both commands.

## Related Guides

- [Installer guide](README.md)
- [Published package install](published-package.md)
- [Runtime variants](../variants.md)
- [Superpowers provider](../providers/superpowers.md)
- [Workflow Stack provider](../providers/workflow-stack.md)
