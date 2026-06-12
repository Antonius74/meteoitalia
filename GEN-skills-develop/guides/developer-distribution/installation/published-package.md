# Install From The Published Package

## Registry

The package is published to the Nexi Artifactory npm registry:

```text
https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

## Configure npm

```bash
export NPM_TOKEN="<your-artifactory-npm-token>"
npm config set registry https://registry.npmjs.org/ --location=user
npm config set @nexidigital:registry https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local --location=user
npm config set //artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local/:_authToken "\${NPM_TOKEN}" --location=user
```

This keeps public npm as the default registry for unscoped dependencies and uses Nexi Artifactory only for the `@nexidigital` scope. The user-level `.npmrc` should contain:

```ini
registry=https://registry.npmjs.org/
@nexidigital:registry=https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
//artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local/:_authToken=${NPM_TOKEN}
```

Do not add `export NPM_TOKEN=...` to `.npmrc`; export it in the shell and reference it as `${NPM_TOKEN}` in npm configuration.

## Verify Access

```bash
npm view @nexidigital/nd-gen-skills version
```

## Install The Default Superpowers Setup

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

## Install Workflow Stack When Needed

```bash
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Validate And Inspect

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills list
npx -y @nexidigital/nd-gen-skills list --available
```

## Optional Global CLI

```bash
npm install -g @nexidigital/nd-gen-skills
nd-gen-skills install --variant frontend-react
```

Use mirrored registry values only when your team explicitly provides a different registry URL and token source.
