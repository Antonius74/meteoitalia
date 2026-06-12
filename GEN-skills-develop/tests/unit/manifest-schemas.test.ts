import { describe, expect, it } from "vitest";
import { parsePackageManifest } from "../../src/schemas/manifests.js";

const apiVersion = "nd-gen-skills.nexidigital.com/v1";

describe("parsePackageManifest", () => {
  it("parses a provider manifest with declared capabilities and skills", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "superpowers",
      version: "0.1.0",
      capabilities: {
        planning: { skill: "writing-plans" },
        "code-review": { skills: ["requesting-code-review", "receiving-code-review"] },
      },
      skills: [{ name: "writing-plans", role: "workflow", source: "skills/writing-plans" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.name).toBe("superpowers");
    expect(manifest.skills[0].source).toBe("skills/writing-plans");
  });

  it("parses provider required utilities", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "workflow-stack",
      version: "0.1.0",
      requiresUtilities: ["grill-me", "tdd"],
      capabilities: {
        planning: { skill: "workflow-architecture-kit" },
      },
      skills: [{ name: "workflow-architecture-kit", role: "workflow", source: "skills/workflow-architecture-kit" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual(["grill-me", "tdd"]);
  });

  it("defaults provider required utilities to an empty array", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "provider",
      name: "superpowers",
      version: "0.1.0",
      capabilities: {
        planning: { skill: "writing-plans" },
      },
      skills: [{ name: "writing-plans", role: "workflow", source: "skills/writing-plans" }],
    });

    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual([]);
  });

  it("parses a variant manifest and runtime references", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "frontend-react",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      runtime: {
        skillName: "nexi-frontend-react-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts", "writing-plans"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.runtime.skillName).toBe("nexi-frontend-react-runtime");
    expect(manifest.runtime.references).toEqual(["nexi-workflow-contracts", "writing-plans"]);
  });

  it("parses variant required utilities", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "frontend-react",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      requiresUtilities: ["figma-use"],
      runtime: {
        skillName: "nexi-frontend-react-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts", "figma-use"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.requiresUtilities).toEqual(["figma-use"]);
  });

  it("defaults variant required utilities to an empty array", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "variant",
      name: "backend-java",
      version: "0.1.0",
      requiresProviderCapabilities: ["planning", "tdd"],
      requiresContracts: ["nexi-workflow-contracts"],
      runtime: {
        skillName: "nexi-backend-java-runtime",
        source: "runtime",
        references: ["nexi-workflow-contracts"],
      },
    });

    expect(manifest.kind).toBe("variant");
    expect(manifest.requiresUtilities).toEqual([]);
  });

  it("parses a contract manifest", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "contract",
      name: "nexi-workflow-contracts",
      version: "0.1.0",
      skill: { name: "nexi-workflow-contracts", source: "skill" },
    });

    expect(manifest.kind).toBe("contract");
    expect(manifest.skill.source).toBe("skill");
  });

  it("parses a utility manifest", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "utility",
      name: "read-jira-issue",
      version: "0.1.0",
      description: "Read Jira issue evidence.",
      skill: { name: "read-jira-issue", source: "skill" },
    });

    expect(manifest.kind).toBe("utility");
    expect(manifest.description).toBe("Read Jira issue evidence.");
  });

  it("parses internal-only utility manifests", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "utility",
      name: "read-jira-issue",
      version: "0.1.0",
      description: "Read Jira issue evidence.",
      userInstallable: false,
      skill: { name: "read-jira-issue", source: "skill" },
    });

    expect(manifest.kind).toBe("utility");
    expect(manifest.userInstallable).toBe(false);
  });

  it("parses utility manifest dependencies", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "utility",
      name: "documentation-kit",
      version: "0.1.0",
      description: "Create and maintain repository documentation.",
      requiresContracts: ["documentation-core"],
      requiresUtilities: [
        "documentation-design-kit",
        "documentation-ubiquitous-language",
        "documentation-quality-assessment",
        "agents-md-refactor",
      ],
      skill: { name: "documentation-kit", source: "skill" },
    });

    expect(manifest.kind).toBe("utility");
    expect(manifest.requiresContracts).toEqual(["documentation-core"]);
    expect(manifest.requiresUtilities).toEqual([
      "documentation-design-kit",
      "documentation-ubiquitous-language",
      "documentation-quality-assessment",
      "agents-md-refactor",
    ]);
  });

  it("defaults utility manifest dependencies to empty arrays", () => {
    const manifest = parsePackageManifest({
      apiVersion,
      kind: "utility",
      name: "read-jira-issue",
      version: "0.1.0",
      description: "Read Jira issue evidence.",
      skill: { name: "read-jira-issue", source: "skill" },
    });

    expect(manifest.kind).toBe("utility");
    expect(manifest.requiresContracts).toEqual([]);
    expect(manifest.requiresUtilities).toEqual([]);
  });

  it("rejects invalid api versions", () => {
    expect(() =>
      parsePackageManifest({
        apiVersion: "v0",
        kind: "utility",
        name: "read-jira-issue",
        version: "0.1.0",
        description: "Read Jira issue evidence.",
        skill: { name: "read-jira-issue", source: "skill" },
      }),
    ).toThrow();
  });

  it.each(["../pwn", "..", "nested/skill", "nested\\skill", ".hidden", ""])(
    "rejects unsafe provider skill name %j",
    (unsafeName) => {
      expect(() =>
        parsePackageManifest({
          apiVersion,
          kind: "provider",
          name: "superpowers",
          version: "0.1.0",
          capabilities: {
            planning: { skill: "writing-plans" },
          },
          skills: [{ name: unsafeName, role: "workflow", source: "skills/writing-plans" }],
        }),
      ).toThrow();
    },
  );

  it.each(["../pwn", "..", "nested/skill", "nested\\skill", ".hidden", ""])(
    "rejects unsafe variant runtime skillName %j",
    (unsafeName) => {
      expect(() =>
        parsePackageManifest({
          apiVersion,
          kind: "variant",
          name: "frontend-react",
          version: "0.1.0",
          requiresProviderCapabilities: ["planning"],
          requiresContracts: ["nexi-workflow-contracts"],
          runtime: {
            skillName: unsafeName,
            source: "runtime",
            references: ["nexi-workflow-contracts"],
          },
        }),
      ).toThrow();
    },
  );

  it.each(["../pwn", "..", "nested/skill", "nested\\skill", ".hidden", ""])(
    "rejects unsafe variant runtime reference %j",
    (unsafeName) => {
      expect(() =>
        parsePackageManifest({
          apiVersion,
          kind: "variant",
          name: "frontend-react",
          version: "0.1.0",
          requiresProviderCapabilities: ["planning"],
          requiresContracts: ["nexi-workflow-contracts"],
          runtime: {
            skillName: "nexi-frontend-react-runtime",
            source: "runtime",
            references: [unsafeName],
          },
        }),
      ).toThrow();
    },
  );

  it.each(["../pwn", "..", "nested/skill", "nested\\skill", ".hidden", ""])(
    "rejects unsafe contract skill name %j",
    (unsafeName) => {
      expect(() =>
        parsePackageManifest({
          apiVersion,
          kind: "contract",
          name: "nexi-workflow-contracts",
          version: "0.1.0",
          skill: { name: unsafeName, source: "skill" },
        }),
      ).toThrow();
    },
  );

  it.each(["../pwn", "..", "nested/skill", "nested\\skill", ".hidden", ""])(
    "rejects unsafe utility skill name %j",
    (unsafeName) => {
      expect(() =>
        parsePackageManifest({
          apiVersion,
          kind: "utility",
          name: "read-jira-issue",
          version: "0.1.0",
          description: "Read Jira issue evidence.",
          skill: { name: unsafeName, source: "skill" },
        }),
      ).toThrow();
    },
  );
});
