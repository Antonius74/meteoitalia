import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import {
  parsePackageManifest,
  type ContractManifest,
  type PackageManifest,
  type ProviderManifest,
  type UtilityManifest,
  type VariantManifest,
} from "../../src/schemas/manifests.js";

const packageRoots = [
  "packages/provider/superpowers",
  "packages/provider/workflow-stack",
  "packages/contract/nexi-workflow-contracts",
  "packages/variant/frontend-react",
  "packages/variant/backend-java",
  "packages/variant/mobile-ios",
  "packages/variant/mobile-android",
  "packages/utility/frontend-react-e2e-test-implementation",
  "packages/utility/backend-service-implementation-kit",
  "packages/utility/backend-controller-implementation-kit",
  "packages/utility/backend-deployment-management",
  "packages/utility/backend-jenkins-build",
  "packages/utility/backend-jenkins-build-script",
  "packages/utility/backend-postman-flow-tests",
  "packages/utility/backend-run-collection",
  "packages/utility/mobile-android-layout-inspector",
  "packages/utility/docx",
  "packages/utility/pdf",
  "packages/utility/pptx",
  "packages/utility/xlsx",
  "packages/utility/office-kit",
  "packages/utility/read-jira-issue",
  "packages/contract/documentation-core",
  "packages/utility/documentation-kit",
  "packages/utility/documentation-design-kit",
  "packages/utility/documentation-ubiquitous-language",
  "packages/utility/documentation-quality-assessment",
  "packages/utility/agents-md-refactor",
  "packages/utility/grill-me",
  "packages/utility/tdd",
  "packages/utility/figma-use",
  "packages/utility/markitdown",
  "packages/utility/cavecrew",
  "packages/utility/caveman",
  "packages/utility/caveman-commit",
  "packages/utility/caveman-compress",
  "packages/utility/caveman-help",
  "packages/utility/caveman-review",
  "packages/utility/caveman-stats",
];

const expectedPackages = [
  { root: "packages/provider/superpowers", kind: "provider", name: "superpowers" },
  { root: "packages/provider/workflow-stack", kind: "provider", name: "workflow-stack" },
  {
    root: "packages/contract/nexi-workflow-contracts",
    kind: "contract",
    name: "nexi-workflow-contracts",
  },
  { root: "packages/variant/frontend-react", kind: "variant", name: "frontend-react" },
  { root: "packages/variant/backend-java", kind: "variant", name: "backend-java" },
  { root: "packages/variant/mobile-ios", kind: "variant", name: "mobile-ios" },
  { root: "packages/variant/mobile-android", kind: "variant", name: "mobile-android" },
  {
    root: "packages/utility/frontend-react-e2e-test-implementation",
    kind: "utility",
    name: "frontend-react-e2e-test-implementation",
  },
  {
    root: "packages/utility/backend-service-implementation-kit",
    kind: "utility",
    name: "backend-service-implementation-kit",
  },
  {
    root: "packages/utility/backend-controller-implementation-kit",
    kind: "utility",
    name: "backend-controller-implementation-kit",
  },
  {
    root: "packages/utility/backend-deployment-management",
    kind: "utility",
    name: "backend-deployment-management",
  },
  {
    root: "packages/utility/backend-jenkins-build",
    kind: "utility",
    name: "backend-jenkins-build",
  },
  {
    root: "packages/utility/backend-jenkins-build-script",
    kind: "utility",
    name: "backend-jenkins-build-script",
  },
  {
    root: "packages/utility/backend-postman-flow-tests",
    kind: "utility",
    name: "backend-postman-flow-tests",
  },
  {
    root: "packages/utility/backend-run-collection",
    kind: "utility",
    name: "backend-run-collection",
  },
  {
    root: "packages/utility/mobile-android-layout-inspector",
    kind: "utility",
    name: "mobile-android-layout-inspector",
  },
  { root: "packages/utility/docx", kind: "utility", name: "docx" },
  { root: "packages/utility/pdf", kind: "utility", name: "pdf" },
  { root: "packages/utility/pptx", kind: "utility", name: "pptx" },
  { root: "packages/utility/xlsx", kind: "utility", name: "xlsx" },
  { root: "packages/utility/office-kit", kind: "utility", name: "office-kit" },
  { root: "packages/utility/read-jira-issue", kind: "utility", name: "read-jira-issue" },
  { root: "packages/contract/documentation-core", kind: "contract", name: "documentation-core" },
  { root: "packages/utility/documentation-kit", kind: "utility", name: "documentation-kit" },
  {
    root: "packages/utility/documentation-design-kit",
    kind: "utility",
    name: "documentation-design-kit",
  },
  {
    root: "packages/utility/documentation-ubiquitous-language",
    kind: "utility",
    name: "documentation-ubiquitous-language",
  },
  {
    root: "packages/utility/documentation-quality-assessment",
    kind: "utility",
    name: "documentation-quality-assessment",
  },
  { root: "packages/utility/agents-md-refactor", kind: "utility", name: "agents-md-refactor" },
  { root: "packages/utility/grill-me", kind: "utility", name: "grill-me" },
  { root: "packages/utility/tdd", kind: "utility", name: "tdd" },
  { root: "packages/utility/figma-use", kind: "utility", name: "figma-use" },
  { root: "packages/utility/markitdown", kind: "utility", name: "markitdown" },
  { root: "packages/utility/cavecrew", kind: "utility", name: "cavecrew" },
  { root: "packages/utility/caveman", kind: "utility", name: "caveman" },
  { root: "packages/utility/caveman-commit", kind: "utility", name: "caveman-commit" },
  { root: "packages/utility/caveman-compress", kind: "utility", name: "caveman-compress" },
  { root: "packages/utility/caveman-help", kind: "utility", name: "caveman-help" },
  { root: "packages/utility/caveman-review", kind: "utility", name: "caveman-review" },
  { root: "packages/utility/caveman-stats", kind: "utility", name: "caveman-stats" },
] as const;

const providerSkillNames = [
  "brainstorming",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "verification-before-completion",
  "writing-plans",
];

const expectedProviderCapabilities = {
  "requirements-design": { skill: "brainstorming" },
  planning: { skill: "writing-plans" },
  execution: { skill: "executing-plans" },
  tdd: { skill: "test-driven-development" },
  debugging: { skill: "systematic-debugging" },
  verification: { skill: "verification-before-completion" },
  "code-review": { skills: ["requesting-code-review", "receiving-code-review"] },
  finishing: { skill: "finishing-a-development-branch" },
};

const expectedRuntimeReferencesByVariant = new Map([
  [
    "frontend-react",
    ["nexi-workflow-contracts", "grill-me", "read-jira-issue", "figma-use", "frontend-react-e2e-test-implementation"],
  ],
  [
    "backend-java",
    [
      "nexi-workflow-contracts",
      "grill-me",
      "read-jira-issue",
      "backend-service-implementation-kit",
      "backend-controller-implementation-kit",
      "backend-deployment-management",
      "backend-jenkins-build",
      "backend-jenkins-build-script",
      "backend-postman-flow-tests",
      "backend-run-collection",
    ],
  ],
  ["mobile-ios", ["nexi-workflow-contracts", "grill-me", "read-jira-issue", "figma-use"]],
  [
    "mobile-android",
    ["nexi-workflow-contracts", "grill-me", "read-jira-issue", "figma-use", "mobile-android-layout-inspector"],
  ],
]);

const expectedVariantUtilitiesByVariant = new Map([
  ["frontend-react", ["grill-me", "read-jira-issue", "figma-use", "frontend-react-e2e-test-implementation"]],
  [
    "backend-java",
    [
      "grill-me",
      "read-jira-issue",
      "backend-service-implementation-kit",
      "backend-controller-implementation-kit",
      "backend-deployment-management",
      "backend-jenkins-build",
      "backend-jenkins-build-script",
      "backend-postman-flow-tests",
      "backend-run-collection",
    ],
  ],
  ["mobile-ios", ["grill-me", "read-jira-issue", "figma-use"]],
  ["mobile-android", ["grill-me", "read-jira-issue", "figma-use", "mobile-android-layout-inspector"]],
]);

const expectedCavemanUtilityManifests = [
  [
    "caveman",
    "Reduce output verbosity with caveman-style responses while preserving technical accuracy.",
    ["caveman-commit", "caveman-compress", "caveman-help", "caveman-review", "caveman-stats", "cavecrew"],
  ],
  ["caveman-commit", "Generate terse Conventional Commit messages with minimal fluff and clear intent.", []],
  [
    "caveman-compress",
    "Compress prose-heavy memory files into caveman style while preserving code, URLs, and structure.",
    [],
  ],
  ["caveman-help", "Show a one-shot quick reference for caveman modes and related caveman utility skills.", []],
  ["caveman-review", "Produce terse actionable code review comments with location, problem, and fix.", []],
  [
    "caveman-stats",
    "Report caveman token-usage stats when the active toolchain exposes a compatible stats hook.",
    [],
  ],
  ["cavecrew", "Guide when to delegate work using caveman-style subagent patterns versus handling it inline.", []],
] as const;

const expectedOfficeUtilityManifests = [
  ["docx", "Create, edit, review, and analyze Word DOCX documents.", []],
  ["pdf", "Extract, generate, split, merge, analyze, and fill PDF documents and forms.", []],
  ["pptx", "Create, edit, analyze, and convert PowerPoint PPTX presentations.", []],
  ["xlsx", "Create, edit, analyze, recalculate, and validate spreadsheet workbooks.", []],
  [
    "office-kit",
    "Install office document skills for Word, PDF, PowerPoint, spreadsheet, and Markdown conversion work.",
    ["docx", "pdf", "pptx", "xlsx", "markitdown"],
  ],
] as const;

async function readManifest(root: `packages/provider/${string}`): Promise<ProviderManifest>;
async function readManifest(root: `packages/variant/${string}`): Promise<VariantManifest>;
async function readManifest(root: `packages/contract/${string}`): Promise<ContractManifest>;
async function readManifest(root: `packages/utility/${string}`): Promise<UtilityManifest>;
async function readManifest(root: string): Promise<PackageManifest>;
async function readManifest(root: string): Promise<PackageManifest> {
  return parsePackageManifest(YAML.parse(await readFile(join(root, "manifest.yaml"), "utf8")));
}

describe("package source content", () => {
  it("declares exact manifest identities for all package roots", async () => {
    for (const expectedPackage of expectedPackages) {
      const manifest = await readManifest(expectedPackage.root);
      expect(manifest.kind).toBe(expectedPackage.kind);
      expect(manifest.name).toBe(expectedPackage.name);
      expect(manifest.version).toBe("0.1.0");
    }
  });

  it("declares the exact Superpowers provider manifest contract", async () => {
    const manifest = await readManifest("packages/provider/superpowers");
    expect(manifest.kind).toBe("provider");
    expect(manifest.capabilities).toEqual(expectedProviderCapabilities);
    expect(
      manifest.skills.map((skill) => ({
        name: skill.name,
        role: skill.role,
        source: skill.source,
      })),
    ).toEqual(providerSkillNames.map((name) => ({ name, role: "workflow", source: `skills/${name}` })));
  });

  it("declares the workflow-stack provider manifest contract", async () => {
    const manifest = await readManifest("packages/provider/workflow-stack");
    expect(manifest.kind).toBe("provider");
    expect(manifest.requiresUtilities).toEqual(["grill-me", "tdd"]);
    expect(manifest.skills.map((skill) => skill.name)).toEqual([
      "workflow-core-kit",
      "workflow-planning-kit",
      "workflow-architecture-kit",
      "workflow-development-kit",
      "workflow-test-design-kit",
      "workflow-orchestration-kit",
      "workflow-us-quality-assessment-kit",
    ]);
  });

  it("keeps workflow-stack provider free of unresolved legacy placeholders", async () => {
    const markdownFiles = await collectMarkdownFiles("packages/provider/workflow-stack/skills");
    const unresolved: string[] = [];

    for (const markdownFile of markdownFiles) {
      const content = await readFile(markdownFile, "utf8");
      if (content.includes("{{shared_root}}") || content.includes("{{package_root}}")) {
        unresolved.push(markdownFile);
      }
    }

    expect(unresolved).toEqual([]);
  });

  it("routes workflow-stack Jira reads through read-jira-issue", async () => {
    const files = [
      "packages/provider/workflow-stack/skills/workflow-planning-kit/SKILL.md",
      "packages/provider/workflow-stack/skills/workflow-us-quality-assessment-kit/SKILL.md",
      "packages/provider/workflow-stack/skills/workflow-core-kit/templates/skills/shared/planning.template.md",
    ];

    for (const file of files) {
      const content = await readFile(file, "utf8");
      expect(content).toContain("read-jira-issue");
    }

    const usQuality = await readFile(
      "packages/provider/workflow-stack/skills/workflow-us-quality-assessment-kit/SKILL.md",
      "utf8",
    );
    expect(usQuality).toContain("`read-jira-issue` reports an issue as not found or access denied");
  });

  it("folds workflow-stack test-design variant overlays into static skill guidance", async () => {
    const content = await readFile(
      "packages/provider/workflow-stack/skills/workflow-test-design-kit/SKILL.md",
      "utf8",
    );

    for (const term of [
      "## Variant Overlays",
      "frontend",
      "frontend-react",
      "../workflow-core-kit/templates/skills/frontend/test-design.template.md",
      "../workflow-core-kit/templates/skills/frontend/test-cases-template.md",
      "--variant frontend-react",
    ]) {
      expect(content).toContain(term);
    }
  });

  it("tells every runtime to use grill-me for planning and brainstorming", async () => {
    for (const variant of ["frontend-react", "backend-java", "mobile-ios", "mobile-android"]) {
      const content = await readFile(`packages/variant/${variant}/runtime/SKILL.md`, "utf8");

      expect(content).toContain("`grill-me` is installed with this runtime");
      expect(content).toContain("planning or brainstorming");
    }
  });

  it("tells every runtime to apply the provider-neutral Human VCS Gate", async () => {
    for (const variant of ["frontend-react", "backend-java", "mobile-ios", "mobile-android"]) {
      const content = await readFile(`packages/variant/${variant}/runtime/SKILL.md`, "utf8");

      expect(content).toContain("Human VCS Gate");
      expect(content).toContain("applies regardless of provider");
      expect(content).toContain("Do not run `git add`, `git commit`, `git push`");
      expect(content).toContain("Leave changes unstaged and uncommitted in final delivery");
      expect(content).toContain(
        "reinterpret that instruction as verify, summarize the diff, and stop for developer review",
      );
    }
  });

  it("declares exact contract, variant, and utility manifest contracts", async () => {
    const contract = await readManifest("packages/contract/nexi-workflow-contracts");
    expect(contract.kind).toBe("contract");
    expect(contract.skill).toEqual({ name: "nexi-workflow-contracts", source: "skill" });

    const variantRuntimeNames = [
      ["frontend-react", "nexi-frontend-react-runtime"],
      ["backend-java", "nexi-backend-java-runtime"],
      ["mobile-ios", "nexi-mobile-ios-runtime"],
      ["mobile-android", "nexi-mobile-android-runtime"],
    ] as const;

    for (const [variant, runtimeSkillName] of variantRuntimeNames) {
      const manifest = await readManifest(`packages/variant/${variant}`);
      expect(manifest.kind).toBe("variant");
      expect(manifest.runtime.skillName).toBe(runtimeSkillName);
      expect(manifest.runtime.source).toBe("runtime");
      expect(manifest.runtime.references).toEqual(expectedRuntimeReferencesByVariant.get(variant));
      expect(manifest.requiresUtilities).toEqual(expectedVariantUtilitiesByVariant.get(variant));
    }

    const utility = await readManifest("packages/utility/read-jira-issue");
    expect(utility.kind).toBe("utility");
    expect(utility.skill).toEqual({ name: "read-jira-issue", source: "skill" });
    expect(utility.description).toBe("Read Jira issue evidence for workflow skills in read-only mode.");
    expect(utility.userInstallable).toBe(false);

    const documentationCore = await readManifest("packages/contract/documentation-core");
    expect(documentationCore.kind).toBe("contract");
    expect(documentationCore.skill).toEqual({ name: "documentation-core", source: "skill" });

    const documentationKit = await readManifest("packages/utility/documentation-kit");
    expect(documentationKit.kind).toBe("utility");
    expect(documentationKit.skill).toEqual({ name: "documentation-kit", source: "skill" });
    expect(documentationKit.requiresContracts).toEqual(["documentation-core"]);
    expect(documentationKit.requiresUtilities).toEqual([
      "documentation-design-kit",
      "documentation-ubiquitous-language",
      "documentation-quality-assessment",
      "agents-md-refactor",
    ]);

    const documentationDesignKit = await readManifest("packages/utility/documentation-design-kit");
    expect(documentationDesignKit.kind).toBe("utility");
    expect(documentationDesignKit.skill).toEqual({ name: "documentation-design-kit", source: "skill" });
    expect(documentationDesignKit.requiresContracts).toEqual(["documentation-core"]);
    expect(documentationDesignKit.requiresUtilities).toEqual([]);

    const documentationUbiquitousLanguage = await readManifest(
      "packages/utility/documentation-ubiquitous-language",
    );
    expect(documentationUbiquitousLanguage.kind).toBe("utility");
    expect(documentationUbiquitousLanguage.skill).toEqual({
      name: "documentation-ubiquitous-language",
      source: "skill",
    });
    expect(documentationUbiquitousLanguage.requiresContracts).toEqual([]);
    expect(documentationUbiquitousLanguage.requiresUtilities).toEqual([]);

    const documentationQualityAssessment = await readManifest(
      "packages/utility/documentation-quality-assessment",
    );
    expect(documentationQualityAssessment.kind).toBe("utility");
    expect(documentationQualityAssessment.description).toBe(
      "Assess repository documentation and AGENTS.md quality against enterprise standards.",
    );
    expect(documentationQualityAssessment.skill).toEqual({
      name: "documentation-quality-assessment",
      source: "skill",
    });
    expect(documentationQualityAssessment.requiresContracts).toEqual(["documentation-core"]);
    expect(documentationQualityAssessment.requiresUtilities).toEqual([]);

    const agentsMdRefactor = await readManifest("packages/utility/agents-md-refactor");
    expect(agentsMdRefactor.kind).toBe("utility");
    expect(agentsMdRefactor.description).toBe(
      "Refactor AGENTS.md files into progressive-disclosure agent instructions.",
    );
    expect(agentsMdRefactor.skill).toEqual({ name: "agents-md-refactor", source: "skill" });
    expect(agentsMdRefactor.requiresContracts).toEqual([]);
    expect(agentsMdRefactor.requiresUtilities).toEqual([]);

    const markitdown = await readManifest("packages/utility/markitdown");
    expect(markitdown.kind).toBe("utility");
    expect(markitdown.description).toBe(
      "Convert local documents to Markdown with Microsoft MarkItDown.",
    );
    expect(markitdown.requiresContracts).toEqual([]);
    expect(markitdown.requiresUtilities).toEqual([]);
    expect(markitdown.skill).toEqual({ name: "markitdown", source: "skill" });

    const frontendE2e = await readManifest("packages/utility/frontend-react-e2e-test-implementation");
    expect(frontendE2e.kind).toBe("utility");
    expect(frontendE2e.description).toBe(
      "Generate one Playwright React E2E scenario from selected TC-E2E cases.",
    );
    expect(frontendE2e.requiresContracts).toEqual([]);
    expect(frontendE2e.requiresUtilities).toEqual([]);
    expect(frontendE2e.skill).toEqual({
      name: "frontend-react-e2e-test-implementation",
      source: "skill",
    });

    const backendService = await readManifest("packages/utility/backend-service-implementation-kit");
    expect(backendService.kind).toBe("utility");
    expect(backendService.description).toBe(
      "Implement backend service-layer behavior using dedicated backend patterns.",
    );
    expect(backendService.requiresContracts).toEqual([]);
    expect(backendService.requiresUtilities).toEqual([]);
    expect(backendService.skill).toEqual({
      name: "backend-service-implementation-kit",
      source: "skill",
    });

    const backendController = await readManifest("packages/utility/backend-controller-implementation-kit");
    expect(backendController.kind).toBe("utility");
    expect(backendController.description).toBe(
      "Implement backend controller and endpoint layers with backend-specific orchestration constraints.",
    );
    expect(backendController.requiresContracts).toEqual([]);
    expect(backendController.requiresUtilities).toEqual([]);
    expect(backendController.skill).toEqual({
      name: "backend-controller-implementation-kit",
      source: "skill",
    });

    const backendDeployment = await readManifest("packages/utility/backend-deployment-management");
    expect(backendDeployment.kind).toBe("utility");
    expect(backendDeployment.description).toBe(
      "Run documented backend deployment workflows from repository source-of-truth instructions.",
    );
    expect(backendDeployment.requiresContracts).toEqual([]);
    expect(backendDeployment.requiresUtilities).toEqual([]);
    expect(backendDeployment.skill).toEqual({
      name: "backend-deployment-management",
      source: "skill",
    });

    const backendJenkinsBuild = await readManifest("packages/utility/backend-jenkins-build");
    expect(backendJenkinsBuild.kind).toBe("utility");
    expect(backendJenkinsBuild.description).toBe(
      "Trigger, verify, and monitor backend Jenkins builds from repository-local Jenkins documentation.",
    );
    expect(backendJenkinsBuild.requiresContracts).toEqual([]);
    expect(backendJenkinsBuild.requiresUtilities).toEqual([]);
    expect(backendJenkinsBuild.skill).toEqual({
      name: "backend-jenkins-build",
      source: "skill",
    });

    const backendJenkinsBuildScript = await readManifest("packages/utility/backend-jenkins-build-script");
    expect(backendJenkinsBuildScript.kind).toBe("utility");
    expect(backendJenkinsBuildScript.description).toBe(
      "Create or maintain backend Jenkins build automation scripts from repository-local Jenkins documentation.",
    );
    expect(backendJenkinsBuildScript.requiresContracts).toEqual([]);
    expect(backendJenkinsBuildScript.requiresUtilities).toEqual([]);
    expect(backendJenkinsBuildScript.skill).toEqual({
      name: "backend-jenkins-build-script",
      source: "skill",
    });

    const backendPostmanFlowTests = await readManifest("packages/utility/backend-postman-flow-tests");
    expect(backendPostmanFlowTests.kind).toBe("utility");
    expect(backendPostmanFlowTests.description).toBe(
      "Create backend Postman flow test environments and collections from repository testing documentation.",
    );
    expect(backendPostmanFlowTests.requiresContracts).toEqual([]);
    expect(backendPostmanFlowTests.requiresUtilities).toEqual([]);
    expect(backendPostmanFlowTests.skill).toEqual({
      name: "backend-postman-flow-tests",
      source: "skill",
    });

    const backendRunCollection = await readManifest("packages/utility/backend-run-collection");
    expect(backendRunCollection.kind).toBe("utility");
    expect(backendRunCollection.description).toBe(
      "Run backend Postman collection tests with the Postman CLI and report structured API test results.",
    );
    expect(backendRunCollection.requiresContracts).toEqual([]);
    expect(backendRunCollection.requiresUtilities).toEqual([]);
    expect(backendRunCollection.skill).toEqual({
      name: "backend-run-collection",
      source: "skill",
    });

    const androidInspector = await readManifest("packages/utility/mobile-android-layout-inspector");
    expect(androidInspector.kind).toBe("utility");
    expect(androidInspector.description).toBe(
      "Inspect a running Android app with Android Studio Layout Inspector and ADB capture workflows.",
    );
    expect(androidInspector.requiresContracts).toEqual([]);
    expect(androidInspector.requiresUtilities).toEqual([]);
    expect(androidInspector.skill).toEqual({
      name: "mobile-android-layout-inspector",
      source: "skill",
    });

    for (const [utilityName, description, requiresUtilities] of expectedOfficeUtilityManifests) {
      const officeUtility = await readManifest(`packages/utility/${utilityName}`);
      expect(officeUtility.kind).toBe("utility");
      expect(officeUtility.description).toBe(description);
      expect(officeUtility.requiresContracts).toEqual([]);
      expect(officeUtility.requiresUtilities).toEqual(requiresUtilities);
      expect(officeUtility.skill).toEqual({ name: utilityName, source: "skill" });
    }

    for (const [utilityName, description, requiresUtilities] of expectedCavemanUtilityManifests) {
      const cavemanUtility = await readManifest(`packages/utility/${utilityName}`);
      expect(cavemanUtility.kind).toBe("utility");
      expect(cavemanUtility.description).toBe(description);
      expect(cavemanUtility.requiresContracts).toEqual([]);
      expect(cavemanUtility.requiresUtilities).toEqual(requiresUtilities);
      expect(cavemanUtility.skill).toEqual({ name: utilityName, source: "skill" });
    }
  });

  it("preserves licenses for imported office document skills", async () => {
    for (const utilityName of ["docx", "pdf", "pptx", "xlsx"]) {
      await expect(
        access(`packages/utility/${utilityName}/skill/LICENSE.txt`),
      ).resolves.toBeUndefined();
    }
  });

  it("contains valid manifests and declared source paths", async () => {
    for (const root of packageRoots) {
      const manifest = await readManifest(root);
      const sourcePaths =
        manifest.kind === "provider"
          ? manifest.skills.map((skill) => skill.source)
          : manifest.kind === "variant"
            ? [manifest.runtime.source]
            : [manifest.skill.source];

      for (const source of sourcePaths) {
        await expect(access(join(root, source))).resolves.toBeUndefined();
      }
    }
  });

  it("keeps declared skills discoverable with matching frontmatter", async () => {
    for (const root of packageRoots) {
      const manifest = await readManifest(root);
      const declaredSkills =
        manifest.kind === "provider"
          ? manifest.skills.map((skill) => ({ name: skill.name, source: skill.source }))
          : manifest.kind === "variant"
            ? [{ name: manifest.runtime.skillName, source: manifest.runtime.source }]
            : [{ name: manifest.skill.name, source: manifest.skill.source }];

      for (const declaredSkill of declaredSkills) {
        const skillPath = join(root, declaredSkill.source, "SKILL.md");
        const frontmatter = parseSkillFrontmatter(await readFile(skillPath, "utf8"), skillPath);

        expect(frontmatter.name).toBe(declaredSkill.name);
        if (typeof frontmatter.description !== "string") {
          throw new Error(`${skillPath} frontmatter description must be a string.`);
        }
        expect(frontmatter.description.trim()).not.toBe("");
      }
    }
  });

  it("keeps markitdown helper examples portable across Codex and Claude installs", async () => {
    const content = await readFile("packages/utility/markitdown/skill/SKILL.md", "utf8");

    expect(content).toContain(".agents/skills/markitdown");
    expect(content).toContain(".claude/skills/markitdown");
    expect(content).toContain("SKILL_DIR/scripts/convert_markitdown.py");
    expect(content).not.toContain(".agents/skills/markitdown/scripts/convert_markitdown.py");
  });

  it("keeps the Superpowers provider subset explicit and manifest-aligned", async () => {
    const skills = await readdir("packages/provider/superpowers/skills");
    expect(skills.sort()).toEqual(providerSkillNames);

    const manifest = await readManifest("packages/provider/superpowers");
    expect(manifest.kind).toBe("provider");
    expect(manifest.skills.map((skill) => skill.name).sort()).toEqual(providerSkillNames);
  });

  it("keeps vendored Superpowers references resolved inside the provider bundle", async () => {
    const manifest = await readManifest("packages/provider/superpowers");
    if (manifest.kind !== "provider") {
      throw new Error("Expected provider manifest.");
    }

    const providerSkillNames = new Set(manifest.skills.map((skill) => skill.name));
    const markdownFiles = await collectMarkdownFiles("packages/provider/superpowers/skills");
    const unresolvedReferences: string[] = [];

    for (const markdownFile of markdownFiles) {
      const content = await readFile(markdownFile, "utf8");
      for (const match of content.matchAll(/\bsuperpowers:([A-Za-z0-9._-]+)/g)) {
        const skillName = match[1];
        if (!providerSkillNames.has(skillName)) {
          unresolvedReferences.push(`${markdownFile}: superpowers:${skillName}`);
        }
      }
    }

    expect(unresolvedReferences.sort()).toEqual([]);
  });

  it("contains substantive runtime guidance for all variants", async () => {
    const checks: Array<[string, string[]]> = [
      ["frontend-react", ["React", "Playwright", "browser", "frontend-react-e2e-test-implementation"]],
      [
        "backend-java",
        [
          "Gradle",
          "Maven",
          "API contract",
          "backend-service-implementation-kit",
          "backend-controller-implementation-kit",
          "backend-deployment-management",
          "backend-jenkins-build",
          "backend-jenkins-build-script",
          "backend-postman-flow-tests",
          "backend-run-collection",
          "Jenkins",
          "Postman",
        ],
      ],
      ["mobile-ios", ["Xcode", "XCTest", "simulator"]],
      ["mobile-android", ["Gradle", "Espresso", "emulator", "mobile-android-layout-inspector"]],
    ];

    for (const [variant, terms] of checks) {
      const content = await readFile(`packages/variant/${variant}/runtime/SKILL.md`, "utf8");
      for (const term of [
        "nexi-workflow-contracts",
        "command discovery",
        "test design",
        "traceability",
        "Superpowers",
        "verification-before-completion",
        ...terms,
      ]) {
        expect(content).toContain(term);
      }
    }
  });

  it("keeps imported variant utility packages package-local and free of old installer files", async () => {
    const importedUtilityRoots = [
      "packages/utility/frontend-react-e2e-test-implementation",
      "packages/utility/backend-service-implementation-kit",
      "packages/utility/backend-controller-implementation-kit",
      "packages/utility/backend-deployment-management",
      "packages/utility/backend-jenkins-build",
      "packages/utility/backend-jenkins-build-script",
      "packages/utility/backend-postman-flow-tests",
      "packages/utility/backend-run-collection",
      "packages/utility/mobile-android-layout-inspector",
    ];
    const forbiddenText = [
      "{{shared_root}}",
      "{{package_root}}",
      "package.toml",
      "adapters/",
      "skillctl.py",
      "agents/openai.yaml",
    ];

    for (const root of importedUtilityRoots) {
      const entries = await collectPackageTreeEntries(root);
      const forbiddenPaths = entries
        .map((entry) => entry.relativePath)
        .filter((relativePath) => {
          const normalizedPath = relativePath.replaceAll("\\", "/");
          const pathSegments = normalizedPath.split("/");
          return (
            pathSegments[pathSegments.length - 1] === "package.toml" ||
            pathSegments[pathSegments.length - 1] === "skillctl.py" ||
            pathSegments.includes("adapters") ||
            normalizedPath === "agents/openai.yaml" ||
            normalizedPath.endsWith("/agents/openai.yaml")
          );
        });

      expect(forbiddenPaths).toEqual([]);

      for (const entry of entries) {
        if (entry.kind !== "file") {
          continue;
        }

        const content = await readFile(entry.path, "utf8");
        for (const forbidden of forbiddenText) {
          expect(content).not.toContain(forbidden);
        }
      }
    }

    await expect(
      access("packages/utility/frontend-react-e2e-test-implementation/skill/templates/scenario.template.e2e.js"),
    ).resolves.toBeUndefined();
    await expect(
      access("packages/utility/backend-service-implementation-kit/skill/references/backend/service-implementation.template.md"),
    ).resolves.toBeUndefined();
    await expect(
      access("packages/utility/backend-controller-implementation-kit/skill/references/backend/controller-implementation.template.md"),
    ).resolves.toBeUndefined();
    await expect(access("packages/utility/backend-deployment-management/skill/SKILL.md")).resolves.toBeUndefined();
    await expect(access("packages/utility/backend-jenkins-build/skill/SKILL.md")).resolves.toBeUndefined();
    await expect(access("packages/utility/backend-jenkins-build-script/skill/SKILL.md")).resolves.toBeUndefined();
    await expect(access("packages/utility/backend-postman-flow-tests/skill/SKILL.md")).resolves.toBeUndefined();
    await expect(access("packages/utility/backend-run-collection/skill/SKILL.md")).resolves.toBeUndefined();
    await expect(
      access("packages/utility/mobile-android-layout-inspector/skill/scripts/capture_bundle.sh"),
    ).resolves.toBeUndefined();
    await expect(
      access("packages/utility/mobile-android-layout-inspector/skill/references/layout-inspector-workflow.md"),
    ).resolves.toBeUndefined();
  });

  it("defines shared Nexi workflow contracts", async () => {
    const content = await readFile("packages/contract/nexi-workflow-contracts/skill/SKILL.md", "utf8");
    for (const term of [
      "command discovery",
      "manual tester",
      "e2e applicability",
      "traceability",
      "residual risk",
      "Human VCS Gate",
      "git add",
      "git commit",
      "git push",
      "explicitly asks for that VCS write action",
    ]) {
      expect(content).toContain(term);
    }
  });

  it("defines read-only Jira evidence handling for the Jira utility", async () => {
    const content = await readFile("packages/utility/read-jira-issue/skill/SKILL.md", "utf8");
    for (const term of [
      "read-only",
      "Jira Evidence Packet",
      "Forbidden actions",
      "Do not add comments",
      "Do not transition issues",
      "Maximum expansion depth",
      "Do not revisit",
      "Stop after reading at most",
      "do not invent",
    ]) {
      expect(content).toContain(term);
    }

    for (const forbiddenMutationTool of [
      "addCommentToJiraIssue",
      "addWorklogToJiraIssue",
      "createIssueLink",
      "createJiraIssue",
      "editJiraIssue",
      "transitionJiraIssue",
      "createConfluenceFooterComment",
      "createConfluenceInlineComment",
      "createConfluencePage",
      "updateConfluencePage",
    ]) {
      expect(content).toContain(forbiddenMutationTool);
    }
  });

  it("keeps Superpowers Jira brainstorming and planning scoped to requested issues", async () => {
    const jiraUtilityContent = await readFile(
      "packages/utility/read-jira-issue/skill/SKILL.md",
      "utf8",
    );
    expect(jiraUtilityContent).toContain(
      "Requested issue keys define the functional scope for brainstorming and planning.",
    );
    expect(jiraUtilityContent).toContain(
      "Linked issues are dependency context, not functional requirements, unless the user explicitly expands scope.",
    );
    expect(jiraUtilityContent).toContain(
      "Do not extract or return linked issue acceptance criteria as in-scope requirements by default.",
    );

    const runtimeContents = await Promise.all(
      [
        "packages/variant/frontend-react/runtime/SKILL.md",
        "packages/variant/backend-java/runtime/SKILL.md",
        "packages/variant/mobile-ios/runtime/SKILL.md",
        "packages/variant/mobile-android/runtime/SKILL.md",
      ].map((filePath) => readFile(filePath, "utf8")),
    );

    for (const content of runtimeContents) {
      expect(content).toContain("requested Jira issue keys define the default functional scope");
      expect(content).toContain("Linked issues are dependency context, not delivery scope");
    }
  });

  it("tells every runtime to prefer Jira epic keys for Superpowers artifact filenames", async () => {
    const runtimeContents = await Promise.all(
      [
        "packages/variant/frontend-react/runtime/SKILL.md",
        "packages/variant/backend-java/runtime/SKILL.md",
        "packages/variant/mobile-ios/runtime/SKILL.md",
        "packages/variant/mobile-android/runtime/SKILL.md",
      ].map((filePath) => readFile(filePath, "utf8")),
    );

    for (const content of runtimeContents) {
      expect(content).toContain("Superpowers Artifact Naming");
      expect(content).toContain("If a provided Jira story has a parent Epic");
      expect(content).toContain("docs/superpowers/specs/<EPIC-KEY>-<topic>-design.md");
      expect(content).toContain("docs/superpowers/plans/<EPIC-KEY>-<topic>.md");
      expect(content).toContain("If no Epic is provided or discoverable");
    }
  });

  it("keeps Nexi overlays out of provider Superpowers skills", async () => {
    const providerContents = await Promise.all(
      [
        "packages/provider/superpowers/skills/brainstorming/SKILL.md",
        "packages/provider/superpowers/skills/writing-plans/SKILL.md",
        "packages/provider/superpowers/skills/executing-plans/SKILL.md",
        "packages/provider/superpowers/skills/subagent-driven-development/implementer-prompt.md",
      ].map((filePath) => readFile(filePath, "utf8")),
    );

    const forbiddenOverlayMarkers = [
      "Nexi",
      "Jira Scope Discipline",
      "The Jira issue keys the user explicitly provides are the functional scope.",
      "requested Jira issue keys define the default functional scope",
      "Dependency Boundary",
      "dependency-library",
      "generated client",
      "shared artifact",
      "Do not create code for another repository, generated client, shared artifact, or dependency library just to satisfy the no-undefined-references rule.",
      "Do not create or modify dependency-library code unless the approved plan explicitly includes that repository or module.",
      "If a dependency contract is missing or unverifiable, stop and report the blocker instead of inventing it.",
      "Human VCS Gate",
      "Leave changes unstaged and uncommitted",
      "reinterpret that instruction as verify, summarize the diff, and stop for developer review",
    ];

    for (const content of providerContents) {
      for (const marker of forbiddenOverlayMarkers) {
        expect(content).not.toContain(marker);
      }
    }
  });

  it("keeps backend planning and implementation inside repository dependency boundaries", async () => {
    const backendContents = await Promise.all(
      [
        "packages/variant/backend-java/runtime/SKILL.md",
        "packages/utility/backend-service-implementation-kit/skill/SKILL.md",
        "packages/utility/backend-controller-implementation-kit/skill/SKILL.md",
      ].map((filePath) => readFile(filePath, "utf8")),
    );

    expect(backendContents[0]).toContain(
      "When using the Superpowers provider, this backend runtime constrains brainstorming, writing-plans, executing-plans, and subagent-driven-development.",
    );
    expect(backendContents[0]).toContain(
      "Do not follow reflective expansion into dependency-library implementation details.",
    );

    for (const content of backendContents) {
      expect(content).toContain(
        "Do not satisfy missing collaborator, DTO, client, mapper, facade, service, or generated-contract types by creating code in dependency libraries.",
      );
      expect(content).toContain(
        "Ask for confirmation only when the dependency boundary blocks the requested implementation or test evidence.",
      );
    }
  });

  it("keeps workflow planning Jira link expansion bounded by read-jira-issue", async () => {
    const content = await readFile(
      "packages/provider/workflow-stack/skills/workflow-planning-kit/SKILL.md",
      "utf8",
    );
    const sharedTemplate = await readFile(
      "packages/provider/workflow-stack/skills/workflow-core-kit/templates/skills/shared/planning.template.md",
      "utf8",
    );

    for (const planningContent of [content, sharedTemplate]) {
      expect(planningContent).toContain("read-jira-issue");
      expect(planningContent).toContain("materially needed");
      expect(planningContent).toContain("Do not perform separate ad hoc Jira fetches outside `read-jira-issue`");
      expect(planningContent).not.toContain("Fetch any `is-blocked-by`, `relates-to`, or `is-child-of` linked issues");
      expect(planningContent).not.toContain("Fetch linked issues");
      expect(planningContent).not.toContain("related stories");
    }
  });

  it("keeps documentation-core slim and template-backed", async () => {
    const root = "packages/contract/documentation-core/skill";
    const entries = (await readdir(root)).sort();
    expect(entries).toEqual(["SKILL.md", "scripts", "templates"]);

    await expect(access(join(root, "templates/readme/repo.template.md"))).resolves.toBeUndefined();
    await expect(access(join(root, "templates/design/local.template.md"))).resolves.toBeUndefined();
    await expect(access(join(root, "scripts/validate.sh"))).resolves.toBeUndefined();

    for (const forbidden of ["schemas", "standards", "partials", "package.toml", "adapters"]) {
      await expect(access(join(root, forbidden))).rejects.toBeTruthy();
    }
  });

  it("keeps documentation templates free of removed shared-library references", async () => {
    const templateFiles = [
      "architecture/repo.template.md",
      "design/local.template.md",
      "design/repo.template.md",
      "plan/execution-plan.template.md",
      "plan/plan.template.md",
      "readme/local.template.md",
      "readme/repo.template.md",
      "workflow/local-workflow.template.md",
      "workflow/repo-workflow.template.md",
    ];

    for (const templateFile of templateFiles) {
      const content = await readFile(
        `packages/contract/documentation-core/skill/templates/${templateFile}`,
        "utf8",
      );
      expect(content).toContain("<!-- template-id:");
      expect(content).not.toContain("template-schema");
      expect(content).not.toContain("../../schemas");
      expect(content).not.toContain("../../standards");
      expect(content).not.toContain("../../partials");
    }
  });

  it("keeps documentation utility skills aligned to package-local references", async () => {
    const utilitySkillPaths = [
      "packages/utility/documentation-kit/skill/SKILL.md",
      "packages/utility/documentation-design-kit/skill/SKILL.md",
      "packages/utility/documentation-ubiquitous-language/skill/SKILL.md",
      "packages/utility/documentation-quality-assessment/skill/SKILL.md",
    ];

    for (const skillPath of utilitySkillPaths) {
      const content = await readFile(skillPath, "utf8");
      for (const forbidden of [
        "{{shared_root}}",
        "schemas/",
        "standards/",
        "partials/",
        "adapters/",
        "package.toml",
        "skillctl.py",
      ]) {
        expect(content).not.toContain(forbidden);
      }
    }

    const documentationKit = await readFile("packages/utility/documentation-kit/skill/SKILL.md", "utf8");
    expect(documentationKit).toContain("../documentation-core/templates/readme/repo.template.md");
    expect(documentationKit).toContain("documentation-design-kit");
    expect(documentationKit).toContain("documentation-ubiquitous-language");

    const documentationQualityAssessment = await readFile(
      "packages/utility/documentation-quality-assessment/skill/SKILL.md",
      "utf8",
    );
    expect(documentationQualityAssessment).toContain("Documentation Quality Assessment");
    expect(documentationQualityAssessment).toContain("Pass with warnings");
    expect(documentationQualityAssessment).toContain("AGENTS.md");
    expect(documentationQualityAssessment).toContain("Recommended Fix Planning Prompt");
    expect(documentationQualityAssessment).toContain("documentation-kit");
    expect(documentationQualityAssessment).toContain("agents-md-refactor");
    expect(documentationQualityAssessment).toContain("Codex");
    expect(documentationQualityAssessment).toContain("Claude");

    const documentationDesignKit = await readFile(
      "packages/utility/documentation-design-kit/skill/SKILL.md",
      "utf8",
    );
    expect(documentationDesignKit).toContain("../documentation-core/templates/design/repo.template.md");
    expect(documentationDesignKit).toContain("../documentation-core/templates/design/local.template.md");
    expect(documentationDesignKit).toContain("must never write to Figma");
  });

  it("defines AGENTS.md progressive disclosure refactoring guidance", async () => {
    const content = await readFile("packages/utility/agents-md-refactor/skill/SKILL.md", "utf8");

    for (const term of [
      "progressive disclosure",
      "Find contradictions",
      "ask the user",
      "minimal root `AGENTS.md`",
      "CLAUDE.md",
      "markdown links",
      "Flag for deletion",
      "Do not delete",
    ]) {
      expect(content).toContain(term);
    }
  });
});

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function parseSkillFrontmatter(content: string, skillPath: string): { name?: unknown; description?: unknown } {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(content);
  if (!match) {
    throw new Error(`${skillPath} is missing YAML frontmatter.`);
  }

  return YAML.parse(match[1]) as { name?: unknown; description?: unknown };
}

async function collectPackageTreeEntries(
  root: string,
  relativeRoot = "",
): Promise<Array<{ kind: "directory" | "file"; path: string; relativePath: string }>> {
  const entries = await readdir(join(root, relativeRoot), { withFileTypes: true });
  const packageEntries: Array<{ kind: "directory" | "file"; path: string; relativePath: string }> = [];

  for (const entry of entries) {
    const relativePath = relativeRoot ? join(relativeRoot, entry.name) : entry.name;
    const entryPath = join(root, relativePath);

    if (entry.isDirectory()) {
      packageEntries.push({ kind: "directory", path: entryPath, relativePath });
      packageEntries.push(...(await collectPackageTreeEntries(root, relativePath)));
      continue;
    }

    if (entry.isFile()) {
      packageEntries.push({ kind: "file", path: entryPath, relativePath });
    }
  }

  return packageEntries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
