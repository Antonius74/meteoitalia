import { describe, expect, it } from "vitest";
import { runtimeUtilityRequests } from "../../src/commands/runtime-utility-requirements.js";
import { buildDesiredState } from "../../src/installer/desired-state.js";
import { planInstall } from "../../src/installer/planner.js";
import type {
  ContractManifest,
  ProviderManifest,
  UtilityManifest,
  VariantManifest,
} from "../../src/schemas/manifests.js";
import type { Lockfile } from "../../src/schemas/lockfile.js";

const apiVersion = "nd-gen-skills.nexidigital.com/v1";
const generatedBy = "@nexidigital/nd-gen-skills@0.1.0";

const provider: ProviderManifest = {
  apiVersion,
  kind: "provider",
  name: "superpowers",
  version: "0.1.0",
  requiresUtilities: [],
  capabilities: {
    planning: { skill: "brainstorming" },
    tdd: { skill: "test-driven-development" },
    review: { skills: ["requesting-code-review", "receiving-code-review"] },
  },
  skills: [
    { name: "brainstorming", role: "workflow", source: "skills/brainstorming" },
    { name: "test-driven-development", role: "workflow", source: "skills/test-driven-development" },
    { name: "requesting-code-review", role: "workflow", source: "skills/requesting-code-review" },
    { name: "receiving-code-review", role: "workflow", source: "skills/receiving-code-review" },
  ],
};

const contract: ContractManifest = {
  apiVersion,
  kind: "contract",
  name: "nexi-workflow-contracts",
  version: "0.1.0",
  skill: { name: "nexi-workflow-contracts", source: "skill" },
};

const variant: VariantManifest = {
  apiVersion,
  kind: "variant",
  name: "frontend-react",
  version: "0.1.0",
  requiresProviderCapabilities: ["planning", "tdd"],
  requiresContracts: ["nexi-workflow-contracts"],
  requiresUtilities: [],
  runtime: {
    skillName: "nexi-frontend-react-runtime",
    source: "runtime",
    references: ["nexi-workflow-contracts", "brainstorming", "test-driven-development"],
  },
};

const utility: UtilityManifest = {
  apiVersion,
  kind: "utility",
  name: "read-jira-issue",
  version: "0.1.0",
  description: "Read Jira issue evidence.",
  skill: { name: "read-jira-issue", source: "skill" },
};

const existingLockfile: Lockfile = {
  apiVersion,
  tool: "codex",
  generatedBy,
  provider: { name: "superpowers", version: "0.1.0" },
  variant: { name: "frontend-react", version: "0.1.0", runtimeSkill: "nexi-frontend-react-runtime" },
  contracts: [],
  utilities: [],
  managedSkills: [],
  managedFiles: [],
};

describe("install planner", () => {
  it("derives provider, variant, and requested utility roots for runtime installs", () => {
    const requests = runtimeUtilityRequests({
      provider: {
        ...provider,
        name: "workflow-stack",
        requiresUtilities: ["grill-me", "tdd"],
      },
      variant: {
        ...variant,
        requiresUtilities: ["figma-use"],
      },
      existingUtilities: [
        { name: "read-jira-issue", version: "0.1.0", requested: true, requiredBy: [] },
      ],
    });

    expect(requests).toEqual([
      { name: "read-jira-issue", requested: true, requiredBy: [] },
      { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
    ]);
  });

  it("includes provider skills, contracts, selected variant runtime, and utilities in managedSkills and lockfile", () => {
    const desired = buildDesiredState({
      tool: "codex",
      generatedBy,
      provider,
      contracts: [contract],
      variant,
      utilities: [utility],
      files: new Map([[".agents/skills/read-jira-issue/SKILL.md", Buffer.from("utility")]]),
    });

    expect(desired.files.get(".agents/skills/read-jira-issue/SKILL.md")?.toString()).toBe("utility");
    expect(desired.managedSkills).toEqual([
      { name: "brainstorming", role: "provider", package: "provider/superpowers" },
      { name: "test-driven-development", role: "provider", package: "provider/superpowers" },
      { name: "requesting-code-review", role: "provider", package: "provider/superpowers" },
      { name: "receiving-code-review", role: "provider", package: "provider/superpowers" },
      { name: "nexi-workflow-contracts", role: "contract", package: "contract/nexi-workflow-contracts" },
      { name: "nexi-frontend-react-runtime", role: "runtime", package: "variant/frontend-react" },
      { name: "read-jira-issue", role: "utility", package: "utility/read-jira-issue" },
    ]);
    expect(desired.lockfile).toMatchObject({
      tool: "codex",
      generatedBy,
      provider: { name: "superpowers", version: "0.1.0" },
      variant: { name: "frontend-react", version: "0.1.0", runtimeSkill: "nexi-frontend-react-runtime" },
      contracts: [{ name: "nexi-workflow-contracts", version: "0.1.0" }],
      utilities: [{ name: "read-jira-issue", version: "0.1.0" }],
      managedSkills: desired.managedSkills,
      managedFiles: [],
    });
  });

  it("validates missing required provider capability and throws a clear error", () => {
    expect(() =>
      buildDesiredState({
        tool: "codex",
        generatedBy,
        provider: { ...provider, capabilities: { planning: { skill: "brainstorming" } } },
        contracts: [contract],
        variant,
        utilities: [],
        files: new Map(),
      }),
    ).toThrow("Variant frontend-react requires provider capability tdd, but provider superpowers does not declare it.");
  });

  it("validates missing required contract and throws a clear error", () => {
    expect(() =>
      buildDesiredState({
        tool: "codex",
        generatedBy,
        provider,
        contracts: [],
        variant,
        utilities: [],
        files: new Map(),
      }),
    ).toThrow("Variant frontend-react requires contract nexi-workflow-contracts, but it was not provided.");
  });

  it("validates runtime references resolve to managed or installed skills and throws a clear error when missing", () => {
    expect(() =>
      buildDesiredState({
        tool: "codex",
        generatedBy,
        provider,
        contracts: [contract],
        variant: { ...variant, runtime: { ...variant.runtime, references: ["missing-skill"] } },
        utilities: [],
        files: new Map(),
      }),
    ).toThrow("Runtime nexi-frontend-react-runtime references missing-skill, but it is not in desired managed skills.");
  });

  it("allows runtime references to omit concrete provider skill names when capabilities resolve through provider", () => {
    const workflowStackProvider: ProviderManifest = {
      ...provider,
      name: "workflow-stack",
      requiresUtilities: ["grill-me", "tdd"],
      capabilities: {
        planning: { skill: "workflow-architecture-kit" },
        tdd: { skill: "workflow-development-kit" },
      },
      skills: [
        { name: "workflow-architecture-kit", role: "workflow", source: "skills/workflow-architecture-kit" },
        { name: "workflow-development-kit", role: "workflow", source: "skills/workflow-development-kit" },
      ],
    };

    expect(() =>
      buildDesiredState({
        tool: "codex",
        generatedBy,
        provider: workflowStackProvider,
        contracts: [contract],
        variant: {
          ...variant,
          requiresProviderCapabilities: ["planning", "tdd"],
          runtime: { ...variant.runtime, references: ["nexi-workflow-contracts"] },
        },
        utilities: [],
        files: new Map(),
      }),
    ).not.toThrow();
  });

  it("rejects different installed variant without replace flag using the exact message from the plan", () => {
    expect(() =>
      planInstall({
        desiredVariant: "backend-java",
        replaceVariant: false,
        existingLockfile,
      }),
    ).toThrow("A different variant is already installed: frontend-react. Use --replace-variant to install backend-java.");
  });

  it("allows same variant and allows different variant with replace flag", () => {
    expect(() =>
      planInstall({
        desiredVariant: "frontend-react",
        replaceVariant: false,
        existingLockfile,
      }),
    ).not.toThrow();
    expect(() =>
      planInstall({
        desiredVariant: "backend-java",
        replaceVariant: true,
        existingLockfile,
      }),
    ).not.toThrow();
  });

  it("allows utility-only desired state without provider or variant", () => {
    const desired = buildDesiredState({
      tool: "claude",
      generatedBy,
      utilities: [utility],
      files: new Map(),
    });

    expect(desired.lockfile.provider).toBeUndefined();
    expect(desired.lockfile.variant).toBeUndefined();
    expect(desired.lockfile.contracts).toEqual([]);
    expect(desired.lockfile.utilities).toEqual([
      { name: "read-jira-issue", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
    expect(desired.lockfile.managedSkills).toEqual([
      { name: "read-jira-issue", role: "utility", package: "utility/read-jira-issue" },
    ]);
  });
});
