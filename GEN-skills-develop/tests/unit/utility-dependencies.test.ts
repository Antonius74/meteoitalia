import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildRegistry } from "../../scripts/build-registry.js";
import { resolveUtilityDependencyClosure } from "../../src/commands/utility-dependencies.js";

describe("resolveUtilityDependencyClosure", () => {
  it("recursively resolves utility dependencies and required contracts", async () => {
    const registry = await buildSyntheticRegistry({
      contracts: ["documentation-alpha", "documentation-beta", "documentation-zeta"],
      utilities: [
        {
          name: "documentation-kit",
          requiresContracts: ["documentation-zeta", "documentation-alpha"],
          requiresUtilities: ["documentation-design-kit", "documentation-ubiquitous-language"],
        },
        {
          name: "documentation-design-kit",
          requiresContracts: ["documentation-beta"],
          requiresUtilities: ["documentation-shared-kit"],
        },
        {
          name: "documentation-ubiquitous-language",
          requiresUtilities: ["documentation-shared-kit"],
        },
        { name: "documentation-other-kit", requiresUtilities: ["documentation-shared-kit"] },
        { name: "documentation-shared-kit" },
      ],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      requestedUtilities: ["documentation-kit", "documentation-other-kit"],
    });

    expect(closure.contracts.map((contractPackage) => contractPackage.manifest.name)).toEqual([
      "documentation-alpha",
      "documentation-beta",
      "documentation-zeta",
    ]);
    expect(
      closure.utilities.map((utility) => ({
        name: utility.package.manifest.name,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    ).toEqual([
      { name: "documentation-kit", requested: true, requiredBy: [] },
      { name: "documentation-design-kit", requested: false, requiredBy: ["utility/documentation-kit"] },
      {
        name: "documentation-shared-kit",
        requested: false,
        requiredBy: [
          "utility/documentation-design-kit",
          "utility/documentation-other-kit",
          "utility/documentation-ubiquitous-language",
        ],
      },
      { name: "documentation-ubiquitous-language", requested: false, requiredBy: ["utility/documentation-kit"] },
      { name: "documentation-other-kit", requested: true, requiredBy: [] },
    ]);
  });

  it("resolves provider and variant required utilities as non-requested roots", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [{ name: "grill-me" }, { name: "tdd" }, { name: "figma-use" }],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      utilities: [
        { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
      ],
    });

    expect(
      closure.utilities.map((utility) => ({
        name: utility.package.manifest.name,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    ).toEqual([
      { name: "grill-me", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
      { name: "figma-use", requested: false, requiredBy: ["variant/frontend-react"] },
    ]);
  });

  it("merges requested and required utility roots for the same package", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [{ name: "tdd" }],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      utilities: [
        { name: "tdd", requested: false, requiredBy: ["provider/workflow-stack"] },
        { name: "tdd", requested: true, requiredBy: [] },
      ],
    });

    expect(closure.utilities).toHaveLength(1);
    expect(closure.utilities[0].requested).toBe(true);
    expect(closure.utilities[0].requiredBy).toEqual(["provider/workflow-stack"]);
  });

  it("marks a transitive utility as requested when it is also requested directly", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [
        { name: "documentation-kit", requiresUtilities: ["documentation-design-kit"] },
        { name: "documentation-design-kit" },
      ],
    });

    const closure = await resolveUtilityDependencyClosure({
      registry,
      requestedUtilities: ["documentation-kit", "documentation-design-kit"],
    });

    expect(
      closure.utilities.map((utility) => ({
        name: utility.package.manifest.name,
        requested: utility.requested,
        requiredBy: utility.requiredBy,
      })),
    ).toEqual([
      { name: "documentation-kit", requested: true, requiredBy: [] },
      { name: "documentation-design-kit", requested: true, requiredBy: ["utility/documentation-kit"] },
    ]);
  });

  it("detects circular utility dependencies", async () => {
    const registry = await buildSyntheticRegistry({
      utilities: [
        { name: "documentation-kit", requiresUtilities: ["documentation-design-kit"] },
        { name: "documentation-design-kit", requiresUtilities: ["documentation-kit"] },
      ],
    });

    await expect(
      resolveUtilityDependencyClosure({ registry, requestedUtilities: ["documentation-kit"] }),
    ).rejects.toThrow("Circular utility dependency detected: documentation-kit -> documentation-design-kit -> documentation-kit");
  });
});

interface SyntheticUtility {
  name: string;
  requiresContracts?: string[];
  requiresUtilities?: string[];
}

async function buildSyntheticRegistry(input: {
  contracts?: string[];
  utilities: SyntheticUtility[];
}): Promise<string> {
  const sandbox = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-resolver-"));
  const packagesRoot = path.join(sandbox, "packages");
  const registryRoot = path.join(sandbox, "dist-registry");

  await Promise.all(
    ["provider", "variant", "contract", "utility"].map((kind) => mkdir(path.join(packagesRoot, kind), { recursive: true })),
  );

  for (const contractName of input.contracts ?? []) {
    await writePackage({
      root: path.join(packagesRoot, "contract", contractName),
      manifest: contractManifest(contractName),
      skillName: contractName,
    });
  }

  for (const utility of input.utilities) {
    await writePackage({
      root: path.join(packagesRoot, "utility", utility.name),
      manifest: utilityManifest(utility),
      skillName: utility.name,
    });
  }

  await buildRegistry({ packagesRoot, outputRoot: registryRoot });
  return registryRoot;
}

async function writePackage(input: { root: string; manifest: string; skillName: string }): Promise<void> {
  await mkdir(path.join(input.root, "skill"), { recursive: true });
  await writeFile(path.join(input.root, "manifest.yaml"), input.manifest, "utf8");
  await writeFile(path.join(input.root, "skill", "SKILL.md"), `# ${input.skillName}\n`, "utf8");
}

function contractManifest(name: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: contract
name: ${name}
version: 0.1.0

skill:
  name: ${name}
  source: skill
`;
}

function utilityManifest(input: SyntheticUtility): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: ${input.name}
version: 0.1.0
description: Synthetic utility.
requiresContracts:
${yamlList(input.requiresContracts ?? [])}
requiresUtilities:
${yamlList(input.requiresUtilities ?? [])}

skill:
  name: ${input.name}
  source: skill
`;
}

function yamlList(values: string[]): string {
  if (values.length === 0) {
    return "  []";
  }

  return values.map((value) => `  - ${value}`).join("\n");
}
