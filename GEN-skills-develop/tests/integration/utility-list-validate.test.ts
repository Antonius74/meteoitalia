import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { c as createTar } from "tar";
import YAML from "yaml";
import { beforeEach, describe, expect, it } from "vitest";
import { main } from "../../src/cli/main.js";
import { addSkillCommand } from "../../src/commands/add-skill.js";
import { installCommand } from "../../src/commands/install.js";
import { listCommand } from "../../src/commands/list.js";
import { removeSkillCommand } from "../../src/commands/remove-skill.js";
import { syncCommand } from "../../src/commands/sync.js";
import { validateCommand } from "../../src/commands/validate.js";
import { writeTreeFile } from "../../src/fs/file-tree.js";
import { sha256Text } from "../../src/hashing/sha256.js";
import { parseLockfile, type Lockfile } from "../../src/schemas/lockfile.js";
import { buildRegistry } from "../../scripts/build-registry.js";

const packagesRoot = path.resolve("packages");
const utilitySkillFile = path.join(".agents", "skills", "read-jira-issue", "SKILL.md");
const legacyJiraSummarySkillName = ["nexi", "jira", "summary"].join("-");
const legacyJiraSummaryPackage = `utility/${legacyJiraSummarySkillName}`;
const legacyJiraSummarySkillFile = path.join(".agents", "skills", legacyJiraSummarySkillName, "SKILL.md");
const syntheticUtilitySkillFile = path.join(".agents", "skills", "nexi-other-utility", "SKILL.md");
const dependencyParentSkillFile = path.join(".agents", "skills", "synthetic-parent-utility", "SKILL.md");
const dependencyChildSkillFile = path.join(".agents", "skills", "synthetic-child-utility", "SKILL.md");
const dependencyLeafSkillFile = path.join(".agents", "skills", "synthetic-leaf-utility", "SKILL.md");
const dependencyContractSkillFile = path.join(".agents", "skills", "synthetic-contract", "SKILL.md");
const documentationKitSkillFile = path.join(".agents", "skills", "documentation-kit", "SKILL.md");
const documentationDesignKitSkillFile = path.join(".agents", "skills", "documentation-design-kit", "SKILL.md");
const documentationLanguageSkillFile = path.join(
  ".agents",
  "skills",
  "documentation-ubiquitous-language",
  "SKILL.md",
);
const documentationQualityAssessmentSkillFile = path.join(
  ".agents",
  "skills",
  "documentation-quality-assessment",
  "SKILL.md",
);
const agentsMdRefactorSkillFile = path.join(".agents", "skills", "agents-md-refactor", "SKILL.md");
const documentationCoreSkillFile = path.join(".agents", "skills", "documentation-core", "SKILL.md");
const markitdownSkillFile = path.join(".agents", "skills", "markitdown", "SKILL.md");
const markitdownHelperFile = path.join(
  ".agents",
  "skills",
  "markitdown",
  "scripts",
  "convert_markitdown.py",
);
const cavemanUtilityNames = [
  "caveman",
  "caveman-commit",
  "caveman-compress",
  "caveman-help",
  "caveman-review",
  "caveman-stats",
  "cavecrew",
];
const officeUtilityNames = ["office-kit", "docx", "pdf", "pptx", "xlsx", "markitdown"];
const frontendE2eSkillFile = path.join(".agents", "skills", "frontend-react-e2e-test-implementation", "SKILL.md");
const backendJenkinsBuildSkillFile = path.join(".agents", "skills", "backend-jenkins-build", "SKILL.md");
const runtimeSkillFile = path.join(".agents", "skills", "nexi-frontend-react-runtime", "SKILL.md");
const lockfilePath = path.join(".agents", "nd-gen-skills.lock.yaml");
const frontendGrillMeUtility = {
  name: "grill-me",
  version: "0.1.0",
  requested: false,
  requiredBy: ["variant/frontend-react"],
};
const frontendReadJiraIssueUtility = {
  name: "read-jira-issue",
  version: "0.1.0",
  requested: false,
  requiredBy: ["variant/frontend-react"],
};
const frontendFigmaUtility = {
  name: "figma-use",
  version: "0.1.0",
  requested: false,
  requiredBy: ["variant/frontend-react"],
};
const frontendE2eUtility = {
  name: "frontend-react-e2e-test-implementation",
  version: "0.1.0",
  requested: false,
  requiredBy: ["variant/frontend-react"],
};
const frontendRequiredUtilities = [
  frontendGrillMeUtility,
  frontendReadJiraIssueUtility,
  frontendFigmaUtility,
  frontendE2eUtility,
];
const backendRequiredUtilities = [
  {
    name: "grill-me",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "read-jira-issue",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-service-implementation-kit",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-controller-implementation-kit",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-deployment-management",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-jenkins-build",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-jenkins-build-script",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-postman-flow-tests",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
  {
    name: "backend-run-collection",
    version: "0.1.0",
    requested: false,
    requiredBy: ["variant/backend-java"],
  },
];

describe("utility, list, and validate commands", () => {
  let registryRoot: string;
  let root: string;

  beforeEach(async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-utility-"));
    registryRoot = path.join(sandbox, "dist-registry");
    root = path.join(sandbox, "repo");
    await buildRegistry({ packagesRoot, outputRoot: registryRoot });
    await mkdir(root, { recursive: true });
  });

  it("add-skill installs a utility without a runtime", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    await expect(readText(path.join(".agents", "skills", "tdd", "SKILL.md"))).resolves.toContain(
      "Test-driven development",
    );
    const lockfile = await readLockfile();
    expect(lockfile.provider).toBeUndefined();
    expect(lockfile.variant).toBeUndefined();
    expect(lockfile.contracts).toEqual([]);
    expect(lockfile.utilities).toEqual([{ name: "tdd", version: "0.1.0", requested: true, requiredBy: [] }]);
    expect(lockfile.managedSkills).toEqual([{ name: "tdd", role: "utility", package: "utility/tdd" }]);
    const agents = await readText("AGENTS.md");
    expect(agents).toContain("This repository uses Nexi AI Skills utility packages.");
    expect(agents).toContain("Skill composition:");
    expect(agents).toContain("- Utility skills add focused capabilities.");
    expect(agents).toContain(
      "- Repository instructions and this managed block override installed skill instructions when they conflict.",
    );
    expect(agents).toContain("Human VCS Gate");
    expect(agents).not.toContain("Runtime entry point:");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- `tdd`:");
    expect(agents).not.toContain("- None");
    expect(agents).not.toContain("Provider skills guide workflow phases.");
  });

  it("add-skill installs the markitdown utility with its helper script", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "markitdown", ci: true, registry: registryRoot });

    await expect(readText(markitdownSkillFile)).resolves.toContain("Microsoft MarkItDown");
    await expect(readText(markitdownHelperFile)).resolves.toContain("convert_local");

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "markitdown", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
    expect(lockfile.managedSkills).toEqual([
      { name: "markitdown", role: "utility", package: "utility/markitdown" },
    ]);

    await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });
  });

  it("add-skill caveman installs the full caveman utility family", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "caveman", ci: true, registry: registryRoot });

    for (const utilityName of cavemanUtilityNames) {
      await expect(readText(path.join(".agents", "skills", utilityName, "SKILL.md"))).resolves.toContain(
        `name: ${utilityName}`,
      );
    }

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "caveman", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "caveman-commit",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/caveman"],
      },
      {
        name: "caveman-compress",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/caveman"],
      },
      {
        name: "caveman-help",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/caveman"],
      },
      {
        name: "caveman-review",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/caveman"],
      },
      {
        name: "caveman-stats",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/caveman"],
      },
      { name: "cavecrew", version: "0.1.0", requested: false, requiredBy: ["utility/caveman"] },
    ]);
  });

  it("add-skill office-kit installs the full office document utility family", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "office-kit", ci: true, registry: registryRoot });

    for (const utilityName of officeUtilityNames) {
      await expect(readText(path.join(".agents", "skills", utilityName, "SKILL.md"))).resolves.toContain(
        `name: ${utilityName}`,
      );
    }

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "office-kit", version: "0.1.0", requested: true, requiredBy: [] },
      { name: "docx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "pdf", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "pptx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "xlsx", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
      { name: "markitdown", version: "0.1.0", requested: false, requiredBy: ["utility/office-kit"] },
    ]);
  });

  it("add-skill rejects internal utilities that are only used by other skills", async () => {
    await expect(
      addSkillCommand({ root, tool: "codex", skill: "read-jira-issue", ci: true, registry: registryRoot }),
    ).rejects.toThrow("Utility skill is internal and cannot be installed directly: read-jira-issue");
  });

  it("remove-skill rejects internal utilities installed by a runtime", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(
      removeSkillCommand({ root, tool: "codex", skill: "read-jira-issue", ci: true, registry: registryRoot }),
    ).rejects.toThrow("Utility skill is internal and cannot be removed directly: read-jira-issue");
  });

  it("add-skill rejects a utility manifest with an unsafe skill name", async () => {
    const maliciousRegistryRoot = await buildMaliciousUtilityRegistry("../../pwn");

    await expect(
      addSkillCommand({ root, tool: "codex", skill: "read-jira-issue", ci: true, registry: maliciousRegistryRoot }),
    ).rejects.toThrow();

    await expect(readText(path.join("pwn", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("add-skill installs transitive utility dependencies and required contracts", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    await expect(readText(dependencyParentSkillFile)).resolves.toContain("Synthetic Parent Utility");
    await expect(readText(dependencyChildSkillFile)).resolves.toContain("Synthetic Child Utility");
    await expect(readText(dependencyLeafSkillFile)).resolves.toContain("Synthetic Leaf Utility");
    await expect(readText(dependencyContractSkillFile)).resolves.toContain("Synthetic Contract");

    const lockfile = await readLockfile();
    expect(lockfile.contracts).toEqual([{ name: "synthetic-contract", version: "0.1.0" }]);
    expect(lockfile.utilities).toEqual([
      { name: "synthetic-parent-utility", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "synthetic-child-utility",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/synthetic-parent-utility"],
      },
      {
        name: "synthetic-leaf-utility",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/synthetic-child-utility"],
      },
    ]);
  });

  it("add-skill and remove-skill documentation-kit manage transitive utilities and keep documentation-core", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "documentation-kit", ci: true, registry: registryRoot });

    await expect(readText(documentationKitSkillFile)).resolves.toContain("documentation");
    await expect(readText(documentationDesignKitSkillFile)).resolves.toContain("design");
    await expect(readText(documentationLanguageSkillFile)).resolves.toContain("ubiquitous language");
    await expect(readText(documentationQualityAssessmentSkillFile)).resolves.toContain(
      "Documentation Quality Assessment",
    );
    await expect(readText(agentsMdRefactorSkillFile)).resolves.toContain("AGENTS.md Refactor");
    await expect(readText(documentationCoreSkillFile)).resolves.toContain("Documentation Core");

    const lockfile = await readLockfile();
    expect(lockfile.contracts).toEqual([{ name: "documentation-core", version: "0.1.0" }]);
    expect(lockfile.utilities).toEqual([
      { name: "documentation-kit", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "documentation-design-kit",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "documentation-ubiquitous-language",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "documentation-quality-assessment",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "agents-md-refactor",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
    ]);

    const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    await removeSkillCommand({ root, tool: "codex", skill: "documentation-kit", ci: true, registry: registryRoot });

    await expect(readText(documentationKitSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(documentationDesignKitSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(documentationLanguageSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(documentationQualityAssessmentSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(agentsMdRefactorSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(documentationCoreSkillFile)).resolves.toContain("Documentation Core");

    const afterRemoveLockfile = await readLockfile();
    expect(afterRemoveLockfile.contracts).toEqual([{ name: "documentation-core", version: "0.1.0" }]);
    expect(afterRemoveLockfile.utilities).toEqual([]);

    const afterRemoveResult = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });
    expect(afterRemoveResult.valid).toBe(true);
    expect(afterRemoveResult.errors).toEqual([]);
  });

  it("remove-skill removes unused transitive utilities and keeps required contracts", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    await expect(readText(dependencyParentSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(dependencyChildSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(dependencyLeafSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(dependencyContractSkillFile)).resolves.toContain("Synthetic Contract");

    const lockfile = await readLockfile();
    expect(lockfile.contracts).toEqual([{ name: "synthetic-contract", version: "0.1.0" }]);
    expect(lockfile.utilities).toEqual([]);
  });

  it("explicitly adding a dependency utility preserves it when removing the parent", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-child-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    await expect(readText(dependencyParentSkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(dependencyChildSkillFile)).resolves.toContain("Synthetic Child Utility");
    await expect(readText(dependencyLeafSkillFile)).resolves.toContain("Synthetic Leaf Utility");
    await expect(readText(dependencyContractSkillFile)).resolves.toContain("Synthetic Contract");

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "synthetic-child-utility", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "synthetic-leaf-utility",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/synthetic-child-utility"],
      },
    ]);
  });

  it("list output remains readable for dependency metadata", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    const result = await listCommand({ root, tool: "codex", registry: dependencyRegistryRoot });
    const output = result.lines.join("\n");

    expect(output).toContain(
      "Utilities: synthetic-parent-utility@0.1.0, synthetic-child-utility@0.1.0, synthetic-leaf-utility@0.1.0",
    );
    expect(output).not.toContain("requested");
    expect(output).not.toContain("requiredBy");
  });

  it("install runtime then add utility keeps runtime guidance without listing utilities in AGENTS.md", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    const agents = await readText("AGENTS.md");
    expect(agents).toContain("nexi-frontend-react-runtime");
    expect(agents).toContain("Skill composition:");
    expect(agents).toContain("- Utility skills add focused capabilities.");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- `tdd`: Installed utility skill.");
  });

  it("add-skill marks an existing required utility as requested without dropping requiredBy", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await markFrontendE2eRequiredBySyntheticVariant();

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });

    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Frontend React E2E Test Implementation Skill");
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: true,
        requiredBy: ["variant/synthetic"],
      },
    ]);
  });

  it("remove-skill clears requested state while preserving a required utility", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await markFrontendE2eRequiredBySyntheticVariant();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });

    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Frontend React E2E Test Implementation Skill");
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: false,
        requiredBy: ["variant/synthetic"],
      },
    ]);
  });

  it("add-skill and remove-skill preserve a frontend variant required utility", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });

    let lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: true,
          requiredBy: ["variant/frontend-react"],
        },
      ]),
    );

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });

    lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
      ]),
    );
    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Frontend React E2E Test Implementation Skill");
  });

  it("add-skill and remove-skill preserve a backend variant required utility", async () => {
    await installCommand({ root, tool: "codex", variant: "backend-java", ci: true, registry: registryRoot });

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "backend-jenkins-build",
      ci: true,
      registry: registryRoot,
    });

    let lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(
      backendRequiredUtilities.map((utility) =>
        utility.name === "backend-jenkins-build" ? { ...utility, requested: true } : utility,
      ),
    );

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "backend-jenkins-build",
      ci: true,
      registry: registryRoot,
    });

    lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(backendRequiredUtilities);
    await expect(readText(backendJenkinsBuildSkillFile)).resolves.toContain("Jenkins Build");
  });

  it("remove-skill removes only the managed utility and preserves runtime/provider/contracts", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    await removeSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });

    await expect(readText(path.join(".agents", "skills", "tdd", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(runtimeSkillFile)).resolves.toContain("Nexi");
    await expect(readText(path.join(".agents", "skills", "brainstorming", "SKILL.md"))).resolves.toContain(
      "Brainstorming",
    );
    await expect(readText(path.join(".agents", "skills", "nexi-workflow-contracts", "SKILL.md"))).resolves.toContain(
      "Nexi Workflow Contracts",
    );

    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(frontendRequiredUtilities);
    expect(lockfile.variant?.name).toBe("frontend-react");
    expect(lockfile.provider?.name).toBe("superpowers");
    expect(lockfile.contracts).toEqual([{ name: "nexi-workflow-contracts", version: "0.1.0" }]);
    expect(lockfile.managedSkills).not.toContainEqual({
      name: "tdd",
      role: "utility",
      package: "utility/tdd",
    });
    const agents = await readText("AGENTS.md");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- `tdd`: Installed utility skill.");
  });

  it("remove-skill fails clearly when the utility is not installed", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(
      removeSkillCommand({ root, tool: "codex", skill: "documentation-kit", ci: true, registry: registryRoot }),
    ).rejects.toThrow("Utility skill is not installed: documentation-kit");
  });

  it("remove-skill can remove an installed removed utility package", async () => {
    await writeLegacyNexiJiraSummaryInstall();

    await removeSkillCommand({ root, tool: "codex", skill: legacyJiraSummarySkillName, ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([]);
    expect(lockfile.managedSkills).toEqual([]);
  });

  it("install drops the removed Jira summary utility from legacy lockfiles", async () => {
    await writeLegacyNexiJiraSummaryInstall();

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const lockfile = await readLockfile();
    expect(lockfile.variant?.name).toBe("frontend-react");
    expect(lockfile.utilities).toEqual(frontendRequiredUtilities);
  });

  it("sync drops the removed Jira summary utility from legacy utility-only lockfiles", async () => {
    await writeLegacyNexiJiraSummaryInstall();

    await syncCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const lockfile = await readLockfile();
    expect(lockfile.provider).toBeUndefined();
    expect(lockfile.variant).toBeUndefined();
    expect(lockfile.utilities).toEqual([]);
    expect(lockfile.managedSkills).toEqual([]);
  });

  it("add-skill drops the removed Jira summary utility from legacy lockfiles", async () => {
    await writeLegacyNexiJiraSummaryInstall();

    await addSkillCommand({ root, tool: "codex", skill: "documentation-kit", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([
      { name: "documentation-kit", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "documentation-design-kit",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "documentation-ubiquitous-language",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "documentation-quality-assessment",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
      {
        name: "agents-md-refactor",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/documentation-kit"],
      },
    ]);
  });

  it("add-skill drops the removed Jira summary utility even when its legacy file changed", async () => {
    await writeLegacyNexiJiraSummaryInstall();
    await writeFile(path.join(root, legacyJiraSummarySkillFile), "# Locally edited legacy summary\n", "utf8");

    await addSkillCommand({ root, tool: "codex", skill: "documentation-kit", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    const lockfile = await readLockfile();
    expect(lockfile.utilities.map((utility) => utility.name)).not.toContain(legacyJiraSummarySkillName);
  });

  it("remove-skill drops removed utilities while removing another installed utility", async () => {
    await writeLegacyNexiJiraSummaryInstall();
    await addSyntheticUtilityToLegacyLockfile();

    await removeSkillCommand({ root, tool: "codex", skill: "nexi-other-utility", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readText(syntheticUtilitySkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([]);
    expect(lockfile.managedSkills).toEqual([]);
  });

  it("remove-skill drops removed utilities even when the legacy file is already missing", async () => {
    await writeLegacyNexiJiraSummaryInstall();
    await addSyntheticUtilityToLegacyLockfile();
    await rm(path.join(root, legacyJiraSummarySkillFile), { force: true });

    await removeSkillCommand({ root, tool: "codex", skill: "nexi-other-utility", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readText(syntheticUtilitySkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual([]);
    expect(lockfile.managedSkills).toEqual([]);
  });

  it("install drops the removed Jira summary utility even when its legacy file changed", async () => {
    await writeLegacyNexiJiraSummaryInstall();
    await writeFile(path.join(root, legacyJiraSummarySkillFile), "# Locally edited legacy summary\n", "utf8");

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(readText(legacyJiraSummarySkillFile)).rejects.toMatchObject({ code: "ENOENT" });
    const lockfile = await readLockfile();
    expect(lockfile.utilities).toEqual(frontendRequiredUtilities);
  });

  it("add-skill and remove-skill do not update existing runtime, provider, or contract packages from a newer registry", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const beforeRuntime = await readText(runtimeSkillFile);
    const beforeProvider = await readText(path.join(".agents", "skills", "brainstorming", "SKILL.md"));
    const beforeContract = await readText(path.join(".agents", "skills", "nexi-workflow-contracts", "SKILL.md"));
    const beforeLockfile = await readLockfile();
    const nextRegistryRoot = await buildNextRegistry();

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: nextRegistryRoot,
    });

    await expect(readText(runtimeSkillFile)).resolves.toBe(beforeRuntime);
    await expect(readText(path.join(".agents", "skills", "brainstorming", "SKILL.md"))).resolves.toBe(beforeProvider);
    await expect(readText(path.join(".agents", "skills", "nexi-workflow-contracts", "SKILL.md"))).resolves.toBe(
      beforeContract,
    );
    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Utility registry marker: 0.2.0");
    let lockfile = await readLockfile();
    expect(lockfile.provider).toEqual(beforeLockfile.provider);
    expect(lockfile.variant).toEqual(beforeLockfile.variant);
    expect(lockfile.contracts).toEqual(beforeLockfile.contracts);
    expect(lockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.2.0",
        requested: true,
        requiredBy: ["variant/frontend-react"],
      },
    ]);

    await removeSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: nextRegistryRoot,
    });

    await expect(readText(runtimeSkillFile)).resolves.toBe(beforeRuntime);
    await expect(readText(path.join(".agents", "skills", "brainstorming", "SKILL.md"))).resolves.toBe(beforeProvider);
    await expect(readText(path.join(".agents", "skills", "nexi-workflow-contracts", "SKILL.md"))).resolves.toBe(
      beforeContract,
    );
    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Utility registry marker: 0.2.0");
    lockfile = await readLockfile();
    expect(lockfile.provider).toEqual(beforeLockfile.provider);
    expect(lockfile.variant).toEqual(beforeLockfile.variant);
    expect(lockfile.contracts).toEqual(beforeLockfile.contracts);
    expect(lockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.2.0",
        requested: false,
        requiredBy: ["variant/frontend-react"],
      },
    ]);
  });

  it("add-skill preserves existing utility files and versions when registry has newer unrelated utility content", async () => {
    const tddSkillFile = path.join(".agents", "skills", "tdd", "SKILL.md");
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });
    const beforeUtility = await readText(tddSkillFile);
    const nextRegistryRoot = await buildNextRegistryWithSyntheticDependency();

    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: nextRegistryRoot,
    });

    await expect(readText(tddSkillFile)).resolves.toBe(beforeUtility);
    await expect(readText(dependencyParentSkillFile)).resolves.toContain("Synthetic Parent Utility 0.2.0");
    await expect(readText(dependencyChildSkillFile)).resolves.toContain("Synthetic Child Utility 0.2.0");
    await expect(readText(dependencyLeafSkillFile)).resolves.toContain("Synthetic Leaf Utility 0.2.0");
    await expect(readText(dependencyContractSkillFile)).resolves.toContain("Synthetic Contract 0.2.0");

    const lockfile = await readLockfile();
    expect(lockfile.contracts).toEqual([{ name: "synthetic-contract", version: "0.2.0" }]);
    expect(lockfile.utilities).toEqual([
      { name: "tdd", version: "0.1.0", requested: true, requiredBy: [] },
      { name: "synthetic-parent-utility", version: "0.2.0", requested: true, requiredBy: [] },
      {
        name: "synthetic-child-utility",
        version: "0.2.0",
        requested: false,
        requiredBy: ["utility/synthetic-parent-utility"],
      },
      {
        name: "synthetic-leaf-utility",
        version: "0.2.0",
        requested: false,
        requiredBy: ["utility/synthetic-child-utility"],
      },
    ]);
  });

  it("list reports local lockfile packages and managed skill count", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const result = await listCommand({ root, tool: "codex", registry: registryRoot });

    expect(result.available).toBe(false);
    expect(result.lines).toEqual(
      expect.arrayContaining([
        "Tool: codex",
        "Provider: superpowers@0.1.0",
        "Variant: frontend-react@0.1.0 (runtime: nexi-frontend-react-runtime)",
        "Contracts: nexi-workflow-contracts@0.1.0",
        "Utilities: grill-me@0.1.0, read-jira-issue@0.1.0, figma-use@0.1.0, frontend-react-e2e-test-implementation@0.1.0",
        `Managed skills: ${readableManagedSkillCount(await readLockfile())}`,
      ]),
    );
  });

  it("list --available reports registry package ids and latest versions", async () => {
    const result = await listCommand({ root, tool: "codex", available: true, registry: registryRoot });

    expect(result.available).toBe(true);
    expect(result.lines).toEqual(
      expect.arrayContaining([
        "provider/superpowers@0.1.0",
        "contract/nexi-workflow-contracts@0.1.0",
        "variant/frontend-react@0.1.0",
        "utility/documentation-kit@0.1.0",
        "utility/markitdown@0.1.0",
      ]),
    );
    expect(result.lines).not.toContain("utility/read-jira-issue@0.1.0");
  });

  it("validate passes after install", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validate accepts the previous runtime AGENTS.md sentence for backward compatibility", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeTreeFile(
      root,
      "AGENTS.md",
      [
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "For implementation, debugging, testing, review, and maintenance work in this repository, start with `nexi-frontend-react-runtime`.",
        "",
        "This repository uses Nexi AI Skills installed for the `frontend-react` variant.",
        "",
        "Human VCS Gate:",
        "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
        "",
        "Installed utility skills:",
        "- `grill-me`: Installed utility skill.",
        "- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.",
        "- `figma-use`: Installed utility skill.",
        "- `frontend-react-e2e-test-implementation`: Installed utility skill.",
        "<!-- nd-gen-skills:end -->",
        "",
      ].join("\n"),
    );

    const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validate accepts installed utilities without AGENTS.md utility inventory", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    expect((await readLockfile()).utilities.length).toBeGreaterThan(0);

    await writeTreeFile(
      root,
      "AGENTS.md",
      [
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "Runtime entry point:",
        "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
        "",
        "Skill composition:",
        "- The runtime skill is the repository-level entry point.",
        "- Provider skills guide workflow phases.",
        "- Utility skills add focused capabilities.",
        "- Repository instructions and this managed block override provider instructions when they conflict.",
        "",
        "Human VCS Gate:",
        "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
        "- Read-only Git inspection is allowed.",
        "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
        "<!-- nd-gen-skills:end -->",
        "",
      ].join("\n"),
    );

    const result = await validateCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validate --ci fails after editing a managed file", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(path.join(root, runtimeSkillFile), "# locally edited\n", "utf8");

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      `Managed file changed locally: ${runtimeSkillFile}`,
    );
  });

  it("validate local mode reports modified managed files without failing", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(path.join(root, runtimeSkillFile), "# locally edited\n", "utf8");

    const result = await validateCommand({ root, tool: "codex", ci: false, registry: registryRoot });

    expect(result.valid).toBe(false);
    expect(result.warnings).toContain(`Managed file changed locally: ${runtimeSkillFile}`);
    expect(result.errors).toEqual([]);
  });

  it("validate fails if the runtime AGENTS.md block is missing", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(path.join(root, "AGENTS.md"), "# Repo instructions\n", "utf8");

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      "AGENTS.md managed block is missing.",
    );
  });

  it("validate --ci fails if the managed AGENTS block is structurally corrupted", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(
      path.join(root, "AGENTS.md"),
      [
        "<!-- nd-gen-skills:start -->",
        "nexi-frontend-react-runtime",
        "read-jira-issue",
        "<!-- nd-gen-skills:end -->",
        "",
      ].join("\n"),
      "utf8",
    );

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      "AGENTS.md managed block is invalid.",
    );
  });

  it("validate --ci fails if the utility-only AGENTS.md block is missing", async () => {
    await addSkillCommand({ root, tool: "codex", skill: "tdd", ci: true, registry: registryRoot });
    await writeFile(path.join(root, "AGENTS.md"), "# Repo instructions\n", "utf8");

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      "AGENTS.md managed block is missing.",
    );
  });

  it("validate fails when a required utility dependency is missing from the lockfile", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });
    const lockfile = await readLockfile();
    lockfile.utilities = lockfile.utilities.filter((utility) => utility.name !== "synthetic-child-utility");
    lockfile.managedSkills = lockfile.managedSkills.filter((skill) => skill.name !== "synthetic-child-utility");
    await writeLockfile(lockfile);

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: dependencyRegistryRoot })).rejects.toThrow(
      "Utility synthetic-parent-utility requires utility synthetic-child-utility, but it is not installed.",
    );
  });

  it("validate fails when a required utility contract is missing from the lockfile", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry();
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });
    const lockfile = await readLockfile();
    lockfile.contracts = lockfile.contracts.filter((contract) => contract.name !== "synthetic-contract");
    lockfile.managedSkills = lockfile.managedSkills.filter((skill) => skill.name !== "synthetic-contract");
    await writeLockfile(lockfile);

    await expect(validateCommand({ root, tool: "codex", ci: true, registry: dependencyRegistryRoot })).rejects.toThrow(
      "Utility synthetic-parent-utility requires contract synthetic-contract, but it is not installed.",
    );
  });

  it("validate reports utility and variant contract errors together", async () => {
    const dependencyRegistryRoot = await buildNextRegistryWithSyntheticDependency();
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: dependencyRegistryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });
    const lockfile = await readLockfile();
    lockfile.utilities = lockfile.utilities.filter((utility) => utility.name !== "synthetic-child-utility");
    lockfile.contracts = lockfile.contracts.filter((contract) => contract.name !== "nexi-workflow-contracts");
    await writeLockfile(lockfile);

    const result = await validateCommand({ root, tool: "codex", ci: false, registry: dependencyRegistryRoot });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Utility synthetic-parent-utility requires utility synthetic-child-utility, but it is not installed.",
        "Variant frontend-react requires contract nexi-workflow-contracts, but it is not installed.",
      ]),
    );
  });

  it("validate reports missing provider and variant required utilities", async () => {
    const requiredUtilityRegistryRoot = await buildSelectedRuntimeRequiredUtilityRegistry();
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      ci: true,
      registry: requiredUtilityRegistryRoot,
    });
    const lockfile = await readLockfile();
    lockfile.utilities = lockfile.utilities.filter((utility) => !["tdd", "figma-use"].includes(utility.name));
    lockfile.managedSkills = lockfile.managedSkills.filter((skill) => !["tdd", "figma-use"].includes(skill.name));
    await writeLockfile(lockfile);

    const result = await validateCommand({ root, tool: "codex", ci: false, registry: requiredUtilityRegistryRoot });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Provider superpowers requires utility tdd, but it is not installed.",
        "Variant frontend-react requires utility figma-use, but it is not installed.",
      ]),
    );
  });

  it("add-skill with force rejects unrelated runtime drift and does not rebaseline the runtime hash", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const beforeLockfile = await readLockfile();
    const beforeRuntimeHash = managedFileHash(beforeLockfile, runtimeSkillFile);
    await writeFile(path.join(root, runtimeSkillFile), "# locally edited runtime\n", "utf8");

    await expect(
      addSkillCommand({
        root,
        tool: "codex",
        skill: "frontend-react-e2e-test-implementation",
        force: true,
        ci: true,
        registry: registryRoot,
      }),
    ).rejects.toThrow(`Managed file changed locally: ${runtimeSkillFile}`);

    const afterLockfile = await readLockfile();
    expect(managedFileHash(afterLockfile, runtimeSkillFile)).toBe(beforeRuntimeHash);
    expect(afterLockfile.utilities).toEqual(frontendRequiredUtilities);
  });

  it("add-skill with force rejects unrelated utility drift and does not rebaseline that utility hash", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSyntheticUtility();
    const beforeLockfile = await readLockfile();
    const beforeSyntheticHash = managedFileHash(beforeLockfile, syntheticUtilitySkillFile);
    await writeFile(path.join(root, syntheticUtilitySkillFile), "# locally edited synthetic utility\n", "utf8");

    await expect(
      addSkillCommand({
        root,
        tool: "codex",
        skill: "frontend-react-e2e-test-implementation",
        force: true,
        ci: true,
        registry: registryRoot,
      }),
    ).rejects.toThrow(`Managed file changed locally: ${syntheticUtilitySkillFile}`);

    const afterLockfile = await readLockfile();
    expect(managedFileHash(afterLockfile, syntheticUtilitySkillFile)).toBe(beforeSyntheticHash);
    expect(afterLockfile.utilities).toEqual([
      ...frontendRequiredUtilities,
      { name: "nexi-other-utility", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
  });

  it("remove-skill with force rejects unrelated runtime drift and does not rebaseline the runtime hash", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });
    const beforeLockfile = await readLockfile();
    const beforeRuntimeHash = managedFileHash(beforeLockfile, runtimeSkillFile);
    await writeFile(path.join(root, runtimeSkillFile), "# locally edited runtime\n", "utf8");

    await expect(
      removeSkillCommand({
        root,
        tool: "codex",
        skill: "frontend-react-e2e-test-implementation",
        force: true,
        ci: true,
        registry: registryRoot,
      }),
    ).rejects.toThrow(`Managed file changed locally: ${runtimeSkillFile}`);

    const afterLockfile = await readLockfile();
    expect(managedFileHash(afterLockfile, runtimeSkillFile)).toBe(beforeRuntimeHash);
    expect(afterLockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: true,
        requiredBy: ["variant/frontend-react"],
      },
    ]);
  });

  it("remove-skill with force rejects unrelated utility drift and does not rebaseline that utility hash", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "frontend-react-e2e-test-implementation",
      ci: true,
      registry: registryRoot,
    });
    await addSyntheticUtility();
    const beforeLockfile = await readLockfile();
    const beforeSyntheticHash = managedFileHash(beforeLockfile, syntheticUtilitySkillFile);
    await writeFile(path.join(root, syntheticUtilitySkillFile), "# locally edited synthetic utility\n", "utf8");

    await expect(
      removeSkillCommand({
        root,
        tool: "codex",
        skill: "frontend-react-e2e-test-implementation",
        force: true,
        ci: true,
        registry: registryRoot,
      }),
    ).rejects.toThrow(`Managed file changed locally: ${syntheticUtilitySkillFile}`);

    const afterLockfile = await readLockfile();
    expect(managedFileHash(afterLockfile, syntheticUtilitySkillFile)).toBe(beforeSyntheticHash);
    expect(afterLockfile.utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: true,
        requiredBy: ["variant/frontend-react"],
      },
      { name: "nexi-other-utility", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
  });

  it("CLI prints readable output for list and validate", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const messages: string[] = [];

    const listExit = await inRoot(() =>
      main(["list", "--registry", registryRoot], {
        info: (message) => messages.push(message),
        warn: (message) => messages.push(message),
        error: (message) => messages.push(message),
      }),
    );
    const validateExit = await inRoot(() =>
      main(["validate", "--ci", "--registry", registryRoot], {
        info: (message) => messages.push(message),
        warn: (message) => messages.push(message),
        error: (message) => messages.push(message),
      }),
    );

    expect(listExit).toBe(0);
    expect(validateExit).toBe(0);
    expect(messages.join("\n")).toContain("Tool: codex");
    expect(messages.join("\n")).toContain("Validation passed.");
    expect(messages.join("\n")).not.toContain('"command"');
  });

  it("CLI prints workflow next steps for install and sync", async () => {
    const messages: string[] = [];
    const output = {
      info: (message: string) => messages.push(message),
      warn: (message: string) => messages.push(message),
      error: (message: string) => messages.push(message),
    };

    const installExit = await inRoot(() =>
      main(["install", "--variant", "frontend-react", "--registry", registryRoot, "--ci"], output),
    );
    const syncExit = await inRoot(() => main(["sync", "--registry", registryRoot, "--ci"], output));

    expect(installExit).toBe(0);
    expect(syncExit).toBe(0);
    expect(messages.join("\n")).toContain("Installed Nexi AI Skills variant frontend-react for codex.");
    expect(messages.join("\n")).toContain("Synced Nexi AI Skills for codex.");
    expect(messages.join("\n")).toContain("Read AGENTS.md for the managed workflow entry point.");
    expect(messages.join("\n")).toContain("Start from the runtime skill listed there.");
    expect(messages.join("\n")).toContain("VCS write actions require explicit user approval.");
  });

  it("CLI routes add-skill and remove-skill", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const messages: string[] = [];

    const addExit = await inRoot(() =>
      main(["add-skill", "frontend-react-e2e-test-implementation", "--registry", registryRoot, "--ci"], {
        info: (message) => messages.push(message),
        warn: (message) => messages.push(message),
        error: (message) => messages.push(message),
      }),
    );

    expect(addExit).toBe(0);
    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Frontend React E2E Test Implementation Skill");
    expect((await readLockfile()).utilities).toEqual([
      frontendGrillMeUtility,
      frontendReadJiraIssueUtility,
      frontendFigmaUtility,
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: true,
        requiredBy: ["variant/frontend-react"],
      },
    ]);

    const removeExit = await inRoot(() =>
      main(["remove-skill", "frontend-react-e2e-test-implementation", "--registry", registryRoot, "--ci"], {
        info: (message) => messages.push(message),
        warn: (message) => messages.push(message),
        error: (message) => messages.push(message),
      }),
    );

    expect(removeExit).toBe(0);
    await expect(readText(frontendE2eSkillFile)).resolves.toContain("Frontend React E2E Test Implementation Skill");
    expect((await readLockfile()).utilities).toEqual(frontendRequiredUtilities);
    expect(messages.join("\n")).toContain(
      "Installed utility skill frontend-react-e2e-test-implementation for codex.",
    );
    expect(messages.join("\n")).toContain("Removed utility skill frontend-react-e2e-test-implementation for codex.");
    expect(messages.join("\n")).toContain("Read AGENTS.md for repository-level managed instructions.");
    expect(messages.join("\n")).not.toContain("Read AGENTS.md for the managed utility skill list.");
    expect(messages.join("\n")).toContain("Use installed utility skills only when the current workflow calls for them.");
    expect(messages.join("\n")).toContain("VCS write actions require explicit user approval.");
  });

  async function readText(relativePath: string): Promise<string> {
    return readFile(path.join(root, relativePath), "utf8");
  }

  async function readLockfile(): Promise<Lockfile> {
    return parseLockfile(YAML.parse(await readText(lockfilePath)));
  }

  async function writeLockfile(lockfile: Lockfile): Promise<void> {
    await writeTreeFile(root, lockfilePath, YAML.stringify(lockfile));
  }

  async function addSyntheticUtility(): Promise<void> {
    const content = "# Synthetic Utility\n";
    await writeTreeFile(root, syntheticUtilitySkillFile, content);
    const lockfile = await readLockfile();
    lockfile.utilities = [
      ...lockfile.utilities,
      { name: "nexi-other-utility", version: "0.1.0", requested: true, requiredBy: [] },
    ];
    lockfile.managedSkills = [
      ...lockfile.managedSkills,
      { name: "nexi-other-utility", role: "utility", package: "utility/nexi-other-utility" },
    ];
    lockfile.managedFiles = [
      ...lockfile.managedFiles,
      {
        path: syntheticUtilitySkillFile,
        package: "utility/nexi-other-utility",
        sha256: sha256Text(content),
      },
    ];
    await writeLockfile(lockfile);
  }

  async function addSyntheticUtilityToLegacyLockfile(): Promise<void> {
    const content = "# Synthetic Utility\n";
    await writeTreeFile(root, syntheticUtilitySkillFile, content);
    const lockfile = await readLockfile();
    lockfile.utilities = [
      ...lockfile.utilities,
      { name: "nexi-other-utility", version: "0.1.0", requested: true, requiredBy: [] },
    ];
    lockfile.managedSkills = [
      ...lockfile.managedSkills,
      { name: "nexi-other-utility", role: "utility", package: "utility/nexi-other-utility" },
    ];
    lockfile.managedFiles = [
      ...lockfile.managedFiles,
      {
        path: syntheticUtilitySkillFile,
        package: "utility/nexi-other-utility",
        sha256: sha256Text(content),
      },
    ];
    await writeLockfile(lockfile);
  }

  async function writeLegacyNexiJiraSummaryInstall(): Promise<void> {
    const content = "# Legacy Jira Summary\n";
    await writeTreeFile(root, legacyJiraSummarySkillFile, content);
    await writeLockfile({
      apiVersion: "nd-gen-skills.nexidigital.com/v1",
      tool: "codex",
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
      contracts: [],
      utilities: [{ name: legacyJiraSummarySkillName, version: "0.1.0", requested: true, requiredBy: [] }],
      managedSkills: [{ name: legacyJiraSummarySkillName, role: "utility", package: legacyJiraSummaryPackage }],
      managedFiles: [
        {
          path: legacyJiraSummarySkillFile,
          package: legacyJiraSummaryPackage,
          sha256: sha256Text(content),
        },
      ],
    });
    await writeTreeFile(
      root,
      "AGENTS.md",
      [
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "This repository uses Nexi AI Skills utility packages.",
        "",
        "Installed utility skills:",
        `- \`${legacyJiraSummarySkillName}\`: Legacy Jira summary.`,
        "<!-- nd-gen-skills:end -->",
        "",
      ].join("\n"),
    );
  }

  async function markFrontendE2eRequiredBySyntheticVariant(): Promise<void> {
    const lockfile = await readLockfile();
    lockfile.utilities = lockfile.utilities.map((utility) =>
      utility.name === "frontend-react-e2e-test-implementation"
        ? {
            name: "frontend-react-e2e-test-implementation",
            version: "0.1.0",
            requested: false,
            requiredBy: ["variant/synthetic"],
          }
        : utility,
    );
    await writeLockfile(lockfile);
  }

  async function inRoot<T>(callback: () => Promise<T>): Promise<T> {
    const previous = process.cwd();
    process.chdir(root);
    try {
      return await callback();
    } finally {
      process.chdir(previous);
      await rm(path.join(root, ".tmp-noop"), { force: true });
    }
  }

  async function buildNextRegistry(): Promise<string> {
    const nextPackagesRoot = path.join(path.dirname(registryRoot), "packages-next");
    const nextRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-next");
    await cp(packagesRoot, nextPackagesRoot, { recursive: true });
    await writeFile(
      path.join(nextPackagesRoot, "variant", "frontend-react", "manifest.yaml"),
      frontendReactManifest("0.2.0"),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "variant", "frontend-react", "runtime", "SKILL.md"),
      "# Updated Frontend Runtime\n\nRuntime registry marker: 0.2.0\n",
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "provider", "superpowers", "manifest.yaml"),
      superpowersManifest("0.2.0"),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "provider", "superpowers", "skills", "brainstorming", "SKILL.md"),
      "# Updated Brainstorming\n\nProvider registry marker: 0.2.0\n",
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "contract", "nexi-workflow-contracts", "manifest.yaml"),
      contractManifest("0.2.0"),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "contract", "nexi-workflow-contracts", "skill", "SKILL.md"),
      "# Updated Contracts\n\nContract registry marker: 0.2.0\n",
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "utility", "frontend-react-e2e-test-implementation", "manifest.yaml"),
      utilityManifestForName({
        name: "frontend-react-e2e-test-implementation",
        version: "0.2.0",
        description: "Generate one Playwright React E2E scenario from selected TC-E2E cases.",
      }),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "utility", "frontend-react-e2e-test-implementation", "skill", "SKILL.md"),
      "# Updated Frontend React E2E Test Implementation\n\nUtility registry marker: 0.2.0\n",
      "utf8",
    );
    await buildRegistry({ packagesRoot: nextPackagesRoot, outputRoot: nextRegistryRoot });
    return nextRegistryRoot;
  }

  async function buildNextRegistryWithSyntheticDependency(): Promise<string> {
    const nextPackagesRoot = path.join(path.dirname(registryRoot), "packages-next-dependencies");
    const nextRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-next-dependencies");
    await cp(packagesRoot, nextPackagesRoot, { recursive: true });
    await writeFile(
      path.join(nextPackagesRoot, "utility", "tdd", "manifest.yaml"),
      utilityManifestForName({
        name: "tdd",
        version: "0.2.0",
        description: "Apply test-driven development with behavior-focused red-green-refactor cycles.",
      }),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "utility", "tdd", "skill", "SKILL.md"),
      "# Updated TDD\n\nUtility registry marker: 0.2.0\n",
      "utf8",
    );

    await writeSyntheticPackage({
      root: path.join(nextPackagesRoot, "contract", "synthetic-contract"),
      manifest: contractManifestForName("synthetic-contract", "0.2.0"),
      title: "Synthetic Contract 0.2.0",
    });
    await writeSyntheticPackage({
      root: path.join(nextPackagesRoot, "utility", "synthetic-parent-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-parent-utility",
        version: "0.2.0",
        description: "Synthetic parent utility.",
        requiresContracts: ["synthetic-contract"],
        requiresUtilities: ["synthetic-child-utility"],
      }),
      title: "Synthetic Parent Utility 0.2.0",
    });
    await writeSyntheticPackage({
      root: path.join(nextPackagesRoot, "utility", "synthetic-child-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-child-utility",
        version: "0.2.0",
        description: "Synthetic child utility.",
        requiresUtilities: ["synthetic-leaf-utility"],
      }),
      title: "Synthetic Child Utility 0.2.0",
    });
    await writeSyntheticPackage({
      root: path.join(nextPackagesRoot, "utility", "synthetic-leaf-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-leaf-utility",
        version: "0.2.0",
        description: "Synthetic leaf utility.",
      }),
      title: "Synthetic Leaf Utility 0.2.0",
    });

    await buildRegistry({ packagesRoot: nextPackagesRoot, outputRoot: nextRegistryRoot });
    return nextRegistryRoot;
  }

  async function buildMaliciousUtilityRegistry(skillName: string): Promise<string> {
    const maliciousRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-malicious");
    const maliciousPackageRoot = path.join(path.dirname(registryRoot), "utility-malicious-package");
    await cp(registryRoot, maliciousRegistryRoot, { recursive: true });
    await mkdir(path.join(maliciousPackageRoot, "skill"), { recursive: true });
    await writeFile(
      path.join(maliciousPackageRoot, "manifest.yaml"),
      utilityManifest("0.1.0", skillName),
      "utf8",
    );
    await writeFile(path.join(maliciousPackageRoot, "skill", "SKILL.md"), "# Malicious Utility\n", "utf8");
    await createTar(
      {
        cwd: maliciousPackageRoot,
        file: path.join(maliciousRegistryRoot, "packages", "utility-read-jira-issue-0.1.0.tgz"),
        gzip: true,
        noMtime: true,
        portable: true,
      },
      ["manifest.yaml", "skill"],
    );
    return maliciousRegistryRoot;
  }

  async function buildSyntheticDependencyRegistry(): Promise<string> {
    const dependencyPackagesRoot = path.join(path.dirname(registryRoot), "packages-dependencies");
    const dependencyRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-dependencies");
    await Promise.all(
      ["provider", "variant", "contract", "utility"].map((kind) =>
        mkdir(path.join(dependencyPackagesRoot, kind), { recursive: true }),
      ),
    );

    await writeSyntheticPackage({
      root: path.join(dependencyPackagesRoot, "contract", "synthetic-contract"),
      manifest: contractManifestForName("synthetic-contract"),
      title: "Synthetic Contract",
    });
    await writeSyntheticPackage({
      root: path.join(dependencyPackagesRoot, "utility", "synthetic-parent-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-parent-utility",
        description: "Synthetic parent utility.",
        requiresContracts: ["synthetic-contract"],
        requiresUtilities: ["synthetic-child-utility"],
      }),
      title: "Synthetic Parent Utility",
    });
    await writeSyntheticPackage({
      root: path.join(dependencyPackagesRoot, "utility", "synthetic-child-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-child-utility",
        description: "Synthetic child utility.",
        requiresUtilities: ["synthetic-leaf-utility"],
      }),
      title: "Synthetic Child Utility",
    });
    await writeSyntheticPackage({
      root: path.join(dependencyPackagesRoot, "utility", "synthetic-leaf-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-leaf-utility",
        description: "Synthetic leaf utility.",
      }),
      title: "Synthetic Leaf Utility",
    });

    await buildRegistry({ packagesRoot: dependencyPackagesRoot, outputRoot: dependencyRegistryRoot });
    return dependencyRegistryRoot;
  }

  async function buildSelectedRuntimeRequiredUtilityRegistry(): Promise<string> {
    const requiredPackagesRoot = path.join(path.dirname(registryRoot), "packages-runtime-required-utilities");
    const requiredRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-runtime-required-utilities");
    await cp(packagesRoot, requiredPackagesRoot, { recursive: true });
    await writeFile(
      path.join(requiredPackagesRoot, "provider", "superpowers", "manifest.yaml"),
      superpowersManifestWithRequiredUtilities("0.1.0"),
      "utf8",
    );
    await writeFile(
      path.join(requiredPackagesRoot, "variant", "frontend-react", "manifest.yaml"),
      frontendReactManifestWithRequiredUtilities("0.1.0"),
      "utf8",
    );
    await writeSyntheticPackage({
      root: path.join(requiredPackagesRoot, "utility", "tdd"),
      manifest: utilityManifestForName({
        name: "tdd",
        description: "Synthetic TDD utility.",
      }),
      title: "Synthetic TDD Utility",
    });
    await writeSyntheticPackage({
      root: path.join(requiredPackagesRoot, "utility", "figma-use"),
      manifest: utilityManifestForName({
        name: "figma-use",
        description: "Synthetic Figma utility.",
      }),
      title: "Synthetic Figma Utility",
    });
    await buildRegistry({ packagesRoot: requiredPackagesRoot, outputRoot: requiredRegistryRoot });
    return requiredRegistryRoot;
  }
});

function readableManagedSkillCount(lockfile: Lockfile): string {
  return String(lockfile.managedSkills.length);
}

function managedFileHash(lockfile: Lockfile, filePath: string): string {
  const managedFile = lockfile.managedFiles.find((file) => file.path === filePath);
  if (!managedFile) {
    throw new Error(`Managed file not found in lockfile: ${filePath}`);
  }
  return managedFile.sha256;
}

function frontendReactManifest(version: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: variant
name: frontend-react
version: ${version}

requiresProviderCapabilities:
  - requirements-design
  - planning
  - execution
  - tdd
  - debugging
  - verification
  - code-review

requiresContracts:
  - nexi-workflow-contracts

runtime:
  skillName: nexi-frontend-react-runtime
  source: runtime
  references:
    - nexi-workflow-contracts
    - brainstorming
    - writing-plans
    - executing-plans
    - test-driven-development
    - systematic-debugging
    - verification-before-completion
    - requesting-code-review
    - receiving-code-review
`;
}

function frontendReactManifestWithRequiredUtilities(version: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: variant
name: frontend-react
version: ${version}

requiresProviderCapabilities:
  - requirements-design
  - planning
  - execution
  - tdd
  - debugging
  - verification
  - code-review

requiresContracts:
  - nexi-workflow-contracts

requiresUtilities:
  - figma-use

runtime:
  skillName: nexi-frontend-react-runtime
  source: runtime
  references:
    - nexi-workflow-contracts
    - brainstorming
    - writing-plans
    - executing-plans
    - test-driven-development
    - systematic-debugging
    - verification-before-completion
    - requesting-code-review
    - receiving-code-review
`;
}

function superpowersManifest(version: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: provider
name: superpowers
version: ${version}

capabilities:
  requirements-design:
    skill: brainstorming
  planning:
    skill: writing-plans
  execution:
    skill: executing-plans
  tdd:
    skill: test-driven-development
  debugging:
    skill: systematic-debugging
  verification:
    skill: verification-before-completion
  code-review:
    skills:
      - requesting-code-review
      - receiving-code-review
  finishing:
    skill: finishing-a-development-branch

skills:
  - name: brainstorming
    role: workflow
    source: skills/brainstorming
  - name: executing-plans
    role: workflow
    source: skills/executing-plans
  - name: finishing-a-development-branch
    role: workflow
    source: skills/finishing-a-development-branch
  - name: receiving-code-review
    role: workflow
    source: skills/receiving-code-review
  - name: requesting-code-review
    role: workflow
    source: skills/requesting-code-review
  - name: systematic-debugging
    role: workflow
    source: skills/systematic-debugging
  - name: test-driven-development
    role: workflow
    source: skills/test-driven-development
  - name: verification-before-completion
    role: workflow
    source: skills/verification-before-completion
  - name: writing-plans
    role: workflow
    source: skills/writing-plans
`;
}

function superpowersManifestWithRequiredUtilities(version: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: provider
name: superpowers
version: ${version}

requiresUtilities:
  - tdd

capabilities:
  requirements-design:
    skill: brainstorming
  planning:
    skill: writing-plans
  execution:
    skill: executing-plans
  tdd:
    skill: test-driven-development
  debugging:
    skill: systematic-debugging
  verification:
    skill: verification-before-completion
  code-review:
    skills:
      - requesting-code-review
      - receiving-code-review
  finishing:
    skill: finishing-a-development-branch

skills:
  - name: brainstorming
    role: workflow
    source: skills/brainstorming
  - name: executing-plans
    role: workflow
    source: skills/executing-plans
  - name: finishing-a-development-branch
    role: workflow
    source: skills/finishing-a-development-branch
  - name: receiving-code-review
    role: workflow
    source: skills/receiving-code-review
  - name: requesting-code-review
    role: workflow
    source: skills/requesting-code-review
  - name: systematic-debugging
    role: workflow
    source: skills/systematic-debugging
  - name: test-driven-development
    role: workflow
    source: skills/test-driven-development
  - name: verification-before-completion
    role: workflow
    source: skills/verification-before-completion
  - name: writing-plans
    role: workflow
    source: skills/writing-plans
`;
}

function contractManifest(version: string): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: contract
name: nexi-workflow-contracts
version: ${version}

skill:
  name: nexi-workflow-contracts
  source: skill
`;
}

function contractManifestForName(name: string, version = "0.1.0"): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: contract
name: ${name}
version: ${version}

skill:
  name: ${name}
  source: skill
`;
}

function utilityManifest(version: string, skillName = "read-jira-issue"): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: read-jira-issue
version: ${version}
description: Read Jira issue evidence for workflow skills in read-only mode.
userInstallable: false

skill:
  name: ${skillName}
  source: skill
`;
}

async function writeSyntheticPackage(input: { root: string; manifest: string; title: string }): Promise<void> {
  await mkdir(path.join(input.root, "skill"), { recursive: true });
  await writeFile(path.join(input.root, "manifest.yaml"), input.manifest, "utf8");
  await writeFile(path.join(input.root, "skill", "SKILL.md"), `# ${input.title}\n`, "utf8");
}

function utilityManifestForName(input: {
  name: string;
  version?: string;
  description: string;
  requiresContracts?: string[];
  requiresUtilities?: string[];
}): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: ${input.name}
version: ${input.version ?? "0.1.0"}
description: ${input.description}
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
