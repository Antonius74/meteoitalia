---
name: backend-deployment-management
description: "Run documented backend deployment workflows from repository source-of-truth instructions."
---

# Deployment Management

## Overview

Use this skill to perform documented deployment workflows safely. The goal is to deploy by following the repository's own documentation, scripts, and pipeline definitions instead of hardcoding environment rules or reproducing manual steps from memory.

## When To Use

Use this skill when the user asks:

- deploy a service, application, or component
- trigger a Jenkins deployment pipeline
- sync an Argo CD application
- refresh or roll out a workload in a target environment
- verify deployment state before or after a release
- create or update deployment documentation based on verified repository behavior

## Workflow

### 1. Discover the source of truth

Start by locating the deployment instructions already owned by the repository. Check the most likely entry points first:

- `DEPLOYMENT.md`
- `README.md`
- `ARCHITECTURE.md`
- service-local or module-local docs
- repo-owned helper scripts referenced by those docs
- pipeline definitions such as Jenkinsfiles

If multiple documents disagree, prefer the most specific deployment document or the pipeline/script that is actually executed.

### 2. Identify the deployment path

Determine which mechanism the repository expects for the requested target:

- Argo CD or another GitOps sync flow
- Jenkins or another CI/CD pipeline trigger
- a repo-owned deployment helper script
- another documented platform-specific workflow

Do not substitute a different mechanism just because it seems faster. If the docs say to use a pipeline, run the pipeline. If the docs say to use a helper script, prefer the helper script over reimplementing its logic inline.

### 3. Resolve target inputs from documentation

Extract the deployment inputs from the repository documentation and definitions, such as:

- project or application family
- environment name
- namespace or cluster target
- service identifier
- pipeline parameters
- application naming or matching rules
- health, rollout, or sync expectations

If a required input cannot be discovered reliably, pause and ask the user only for the missing source-of-truth detail. Do not invent namespace mappings, URLs, or parameter values.

### 4. Execute the documented flow

For GitOps flows:

- authenticate using the repo-approved method or documented helper
- inspect the current application and target workload state first
- follow the documented refresh, sync, prune, or rollout sequence
- wait until the operation completes and the documented healthy state is reached

For pipeline-driven flows:

- read the pipeline definition and deployment docs
- trigger the documented pipeline rather than reproducing the pipeline's internals manually
- pass only the parameters supported by the pipeline definition
- monitor the job to a clear final state and collect the important result details

### 5. Report outcome clearly

Always return:

- the selected deployment target
- the mechanism used
- the exact application, namespace, or pipeline chosen
- whether the deployment completed successfully
- any remaining health or rollout state still in progress

If execution fails, report the failing step, the observable error, and the smallest next action needed to unblock.

## Operating Rules

- Prefer repository documentation over memory.
- Prefer repository helper scripts over one-off ad hoc commands.
- Prefer pipeline execution over manual reproduction of pipeline behavior.
- Verify pre-deployment state before mutating anything when the docs require checks.
- Treat TLS, authentication, and environment-specific rules as repository-defined behavior, not global defaults.
- When documentation is missing but the deployment behavior is discovered during the task, update the repository documentation if the user asked for documentation work or if the missing doc is the main blocker.

## Documentation Maintenance

When asked to build or fix deployment docs:

- keep the documentation generic to the repository, not limited to one single service unless the repo structure requires that
- extract facts from the real pipeline definitions, helper scripts, manifests, and verified runtime behavior
- avoid documenting hidden implementation steps that users should not run manually if the supported path is a pipeline or script
- record the source of truth, required inputs, target selection rules, and expected completion signals

## Output Expectations

A good result from this skill usually includes:

- an executed deployment or sync
- verification of the final state
- updated deployment documentation when needed
- a concise summary of what was deployed and how it was verified
