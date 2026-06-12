import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { c as createTar } from "tar";
import YAML from "yaml";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAgentsBlock } from "../../src/agents-md/block.js";
import { addSkillCommand } from "../../src/commands/add-skill.js";
import { installCommand } from "../../src/commands/install.js";
import { syncCommand } from "../../src/commands/sync.js";
import { writeTreeFile } from "../../src/fs/file-tree.js";
import { sha256Text } from "../../src/hashing/sha256.js";
import { parseLockfile, type Lockfile } from "../../src/schemas/lockfile.js";
import { buildRegistry } from "../../scripts/build-registry.js";

const packagesRoot = path.resolve("packages");

const readJiraUtility = (variantName: string, requiredBy: string[] = [`variant/${variantName}`]) => ({
  name: "read-jira-issue",
  version: "0.1.0",
  requested: false,
  requiredBy,
});

describe("install and sync commands", () => {
  let registryRoot: string;
  let root: string;

  beforeEach(async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-install-sync-"));
    registryRoot = path.join(sandbox, "dist-registry");
    root = path.join(sandbox, "repo");
    await buildRegistry({ packagesRoot, outputRoot: registryRoot });
    await mkdir(root, { recursive: true });
  });

  it("installs the frontend React runtime, provider skills, contracts, lockfile, and AGENTS.md for Codex", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(readText(".agents/skills/nexi-frontend-react-runtime/SKILL.md")).resolves.toContain("Nexi");
    await expect(readText(".agents/skills/brainstorming/SKILL.md")).resolves.toContain("Brainstorming");
    await expect(readText(".agents/skills/nexi-workflow-contracts/SKILL.md")).resolves.toContain(
      "Nexi Workflow Contracts",
    );
    const agents = await readText("AGENTS.md");
    expect(agents).toContain("nexi-frontend-react-runtime");
    expect(agents).toContain("Runtime entry point:");
    expect(agents).toContain(
      "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
    );
    expect(agents).toContain("Skill composition:");
    expect(agents).toContain("- Provider skills guide workflow phases.");
    expect(agents).toContain("- Utility skills add focused capabilities.");
    expect(agents).toContain("Human VCS Gate");
    expect(agents).toContain(
      "Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    );
    expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- `grill-me`:");
    expect(agents).not.toContain("- `read-jira-issue`:");
    expect(agents).not.toContain("- `figma-use`:");

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.variant).toEqual({
      name: "frontend-react",
      version: "0.1.0",
      runtimeSkill: "nexi-frontend-react-runtime",
    });
    expect(lockfile.provider).toEqual({ name: "superpowers", version: "0.1.0" });
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "grill-me",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
        readJiraUtility("frontend-react"),
        {
          name: "figma-use",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
      ]),
    );
    expect(lockfile.contracts).toEqual([{ name: "nexi-workflow-contracts", version: "0.1.0" }]);
    expect(lockfile.managedSkills).toEqual(
      expect.arrayContaining([
        { name: "brainstorming", role: "provider", package: "provider/superpowers" },
        { name: "nexi-workflow-contracts", role: "contract", package: "contract/nexi-workflow-contracts" },
        { name: "nexi-frontend-react-runtime", role: "runtime", package: "variant/frontend-react" },
        { name: "grill-me", role: "utility", package: "utility/grill-me" },
        { name: "read-jira-issue", role: "utility", package: "utility/read-jira-issue" },
        {
          name: "frontend-react-e2e-test-implementation",
          role: "utility",
          package: "utility/frontend-react-e2e-test-implementation",
        },
      ]),
    );
    expect(lockfile.managedFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ".agents/skills/nexi-frontend-react-runtime/SKILL.md",
          package: "variant/frontend-react",
        }),
        expect.objectContaining({
          path: ".agents/skills/brainstorming/SKILL.md",
          package: "provider/superpowers",
        }),
        expect.objectContaining({
          path: ".agents/skills/nexi-workflow-contracts/SKILL.md",
          package: "contract/nexi-workflow-contracts",
        }),
        expect.objectContaining({
          path: ".agents/skills/grill-me/SKILL.md",
          package: "utility/grill-me",
        }),
        expect.objectContaining({
          path: ".agents/skills/read-jira-issue/SKILL.md",
          package: "utility/read-jira-issue",
        }),
        expect.objectContaining({
          path: ".agents/skills/frontend-react-e2e-test-implementation/SKILL.md",
          package: "utility/frontend-react-e2e-test-implementation",
        }),
      ]),
    );
    expect(lockfile.managedFiles.every((file) => /^[a-f0-9]{64}$/.test(file.sha256))).toBe(true);
    await expect(
      readText(".agents/skills/frontend-react-e2e-test-implementation/SKILL.md"),
    ).resolves.toContain("Frontend React E2E Test Implementation Skill");
    await expect(readText(".agents/skills/read-jira-issue/SKILL.md")).resolves.toContain("Jira Evidence Packet");
  });

  it("installs workflow-stack provider with provider and variant required utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider).toEqual({ name: "workflow-stack", version: "0.1.0" });
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "grill-me",
          version: "0.1.0",
          requested: false,
          requiredBy: ["provider/workflow-stack", "variant/frontend-react"],
        },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        readJiraUtility("frontend-react"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
      ]),
    );
    await expect(readText(".agents/skills/workflow-orchestration-kit/SKILL.md")).resolves.toContain(
      "Workflow Coordinator",
    );
    await expect(readText(".agents/skills/grill-me/SKILL.md")).resolves.toContain("Interview me relentlessly");
    await expect(readText(".agents/skills/tdd/SKILL.md")).resolves.toContain("Test-Driven Development");
    await expect(readText(".agents/skills/read-jira-issue/SKILL.md")).resolves.toContain("Jira Evidence Packet");
    await expect(readText(".agents/skills/figma-use/SKILL.md")).resolves.toContain("use_figma");
    await expect(readText(".agents/skills/frontend-react-e2e-test-implementation/SKILL.md")).resolves.toContain(
      "TC-E2E-*",
    );
  });

  it("installs backend variant utilities without figma-use", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "backend-java",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider?.name).toBe("workflow-stack");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "grill-me",
          version: "0.1.0",
          requested: false,
          requiredBy: ["provider/workflow-stack", "variant/backend-java"],
        },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        readJiraUtility("backend-java"),
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
      ]),
    );
    expect(lockfile.utilities.some((utility) => utility.name === "figma-use")).toBe(false);
    await expect(readText(".agents/skills/backend-service-implementation-kit/SKILL.md")).resolves.toContain(
      "Backend Service Implementation Kit",
    );
    await expect(readText(".agents/skills/backend-controller-implementation-kit/SKILL.md")).resolves.toContain(
      "Backend Controller Implementation Kit",
    );
    await expect(readText(".agents/skills/backend-deployment-management/SKILL.md")).resolves.toContain(
      "Deployment Management",
    );
    await expect(readText(".agents/skills/backend-jenkins-build/SKILL.md")).resolves.toContain("Jenkins Build");
    await expect(readText(".agents/skills/backend-jenkins-build-script/SKILL.md")).resolves.toContain(
      "Jenkins Build Script",
    );
    await expect(readText(".agents/skills/backend-postman-flow-tests/SKILL.md")).resolves.toContain(
      "Postman Temp Flow Tests",
    );
    await expect(readText(".agents/skills/backend-run-collection/SKILL.md")).resolves.toContain(
      "API testing assistant",
    );
    await expect(readText(".agents/skills/read-jira-issue/SKILL.md")).resolves.toContain("Jira Evidence Packet");
  });

  it("installs iOS variant utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "mobile-ios",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "grill-me",
          version: "0.1.0",
          requested: false,
          requiredBy: ["provider/workflow-stack", "variant/mobile-ios"],
        },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        readJiraUtility("mobile-ios"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/mobile-ios"] },
      ]),
    );
    await expect(readText(".agents/skills/read-jira-issue/SKILL.md")).resolves.toContain("Jira Evidence Packet");
  });

  it("installs Android variant utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "mobile-android",
      ci: true,
      registry: registryRoot,
    });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["variant/mobile-android"] },
        readJiraUtility("mobile-android"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/mobile-android"] },
        {
          name: "mobile-android-layout-inspector",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/mobile-android"],
        },
      ]),
    );
    await expect(readText(".agents/skills/mobile-android-layout-inspector/SKILL.md")).resolves.toContain(
      "Android Layout Inspector",
    );
    await expect(
      readText(".agents/skills/mobile-android-layout-inspector/scripts/capture_bundle.sh"),
    ).resolves.toContain("capture_status");
    await expect(readText(".agents/skills/read-jira-issue/SKILL.md")).resolves.toContain("Jira Evidence Packet");
  });

  it("sync preserves the selected workflow-stack provider and required utilities", async () => {
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: registryRoot,
    });

    await syncCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.provider?.name).toBe("workflow-stack");
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
        {
          name: "grill-me",
          version: "0.1.0",
          requested: false,
          requiredBy: ["provider/workflow-stack", "variant/frontend-react"],
        },
        { name: "tdd", version: "0.1.0", requested: false, requiredBy: ["provider/workflow-stack"] },
        readJiraUtility("frontend-react"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
      ]),
    );
  });

  it("allows same-variant install to run idempotently", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const firstLockfile = await readText(".agents/nd-gen-skills.lock.yaml");

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(readText(".agents/nd-gen-skills.lock.yaml")).resolves.toBe(firstLockfile);
  });

  it("runtime reinstall refreshes the managed AGENTS.md block with the Human VCS Gate and preserves user text", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await writeFile(
      path.join(root, "AGENTS.md"),
      [
        "# Repo",
        "",
        "Keep before.",
        "",
        "<!-- nd-gen-skills:start -->",
        "## Nexi AI Skills",
        "",
        "For implementation, debugging, testing, review, and maintenance work in this repository, start with `nexi-frontend-react-runtime`.",
        "",
        "This repository uses Nexi AI Skills installed for the `frontend-react` variant.",
        "",
        "Installed utility skills:",
        "- None",
        "<!-- nd-gen-skills:end -->",
        "",
        "Keep after.",
        "",
      ].join("\n"),
      "utf8",
    );

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const agents = await readText("AGENTS.md");
    expect(agents).toContain("Keep before.");
    expect(agents).toContain("Keep after.");
    expect(agents).toContain("Runtime entry point:");
    expect(agents).toContain("Skill composition:");
    expect(agents).toContain("- Provider skills guide workflow phases.");
    expect(agents).toContain("Human VCS Gate");
    expect(agents).toContain(
      "Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    );
    expect(agents).not.toContain("This repository uses Nexi AI Skills installed for the `frontend-react` variant.");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- None");
    expect(agents).not.toContain("- `read-jira-issue`:");
  });

  it("preserves the selected provider across reinstall and variant replacement", async () => {
    const workflowRegistryRoot = await buildRegistryWithWorkflowStackProvider();
    await installCommand({
      root,
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      ci: true,
      registry: workflowRegistryRoot,
    });
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).provider?.name).toBe("workflow-stack");

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: workflowRegistryRoot });
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).provider?.name).toBe("workflow-stack");

    await installCommand({
      root,
      tool: "codex",
      variant: "backend-java",
      replaceVariant: true,
      ci: true,
      registry: workflowRegistryRoot,
    });
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).provider?.name).toBe("workflow-stack");

    await installCommand({
      root,
      tool: "codex",
      variant: "backend-java",
      provider: "superpowers",
      ci: true,
      registry: workflowRegistryRoot,
    });
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).provider?.name).toBe("superpowers");
  });

  it("runtime reinstall preserves contracts required by requested utilities", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "documentation-kit",
      ci: true,
      registry: registryRoot,
    });

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.contracts).toEqual(
      expect.arrayContaining([
        { name: "nexi-workflow-contracts", version: "0.1.0" },
        { name: "documentation-core", version: "0.1.0" },
      ]),
    );
    expect(lockfile.utilities).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    await expect(readText(".agents/skills/documentation-core/SKILL.md")).resolves.toContain("Documentation Core");
    await expect(readText(".agents/skills/documentation-kit/SKILL.md")).resolves.toContain("Documentation Kit");
    await expect(readText(".agents/skills/documentation-design-kit/SKILL.md")).resolves.toContain(
      "Design Documentation Kit",
    );
    await expect(readText(".agents/skills/documentation-ubiquitous-language/SKILL.md")).resolves.toContain(
      "Ubiquitous Language",
    );
  });

  it("runtime reinstall drops stale non-requested utility roots", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "tdd",
      ci: true,
      registry: registryRoot,
    });
    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    lockfile.utilities = [{ name: "tdd", version: "0.1.0", requested: false, requiredBy: ["variant/old-runtime"] }];
    await writeLockfile(lockfile);

    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    const nextLockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(nextLockfile.utilities.some((utility) => utility.name === "tdd")).toBe(false);
    await expect(readText(".agents/skills/tdd/SKILL.md")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects installing a different variant without replaceVariant using the planner message", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(
      installCommand({ root, tool: "codex", variant: "backend-java", ci: true, registry: registryRoot }),
    ).rejects.toThrow(
      "A different variant is already installed: frontend-react. Use --replace-variant to install backend-java.",
    );
  });

  it("replaceVariant updates the runtime and removes old runtime managed files while preserving provider and contracts", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await installCommand({
      root,
      tool: "codex",
      variant: "backend-java",
      replaceVariant: true,
      ci: true,
      registry: registryRoot,
    });

    await expect(readText(".agents/skills/nexi-backend-java-runtime/SKILL.md")).resolves.toContain("Nexi");
    await expect(readText(".agents/skills/nexi-frontend-react-runtime/SKILL.md")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readText(".agents/skills/frontend-react-e2e-test-implementation/SKILL.md")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readText(".agents/skills/brainstorming/SKILL.md")).resolves.toContain("Brainstorming");
    await expect(readText(".agents/skills/nexi-workflow-contracts/SKILL.md")).resolves.toContain(
      "Nexi Workflow Contracts",
    );
    await expect(readText(".agents/skills/backend-service-implementation-kit/SKILL.md")).resolves.toContain(
      "Backend Service Implementation Kit",
    );
    await expect(readText(".agents/skills/backend-controller-implementation-kit/SKILL.md")).resolves.toContain(
      "Backend Controller Implementation Kit",
    );
    await expect(readText("AGENTS.md")).resolves.toContain("nexi-backend-java-runtime");

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.variant?.name).toBe("backend-java");
    expect(lockfile.utilities).toEqual([
      {
        name: "grill-me",
        version: "0.1.0",
        requested: false,
        requiredBy: ["variant/backend-java"],
      },
      readJiraUtility("backend-java"),
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
    ]);
    expect(lockfile.managedSkills).toEqual(
      expect.arrayContaining([
        { name: "brainstorming", role: "provider", package: "provider/superpowers" },
        { name: "nexi-workflow-contracts", role: "contract", package: "contract/nexi-workflow-contracts" },
        { name: "nexi-backend-java-runtime", role: "runtime", package: "variant/backend-java" },
        { name: "grill-me", role: "utility", package: "utility/grill-me" },
        { name: "read-jira-issue", role: "utility", package: "utility/read-jira-issue" },
        {
          name: "backend-service-implementation-kit",
          role: "utility",
          package: "utility/backend-service-implementation-kit",
        },
        {
          name: "backend-controller-implementation-kit",
          role: "utility",
          package: "utility/backend-controller-implementation-kit",
        },
        {
          name: "backend-deployment-management",
          role: "utility",
          package: "utility/backend-deployment-management",
        },
        {
          name: "backend-jenkins-build",
          role: "utility",
          package: "utility/backend-jenkins-build",
        },
        {
          name: "backend-jenkins-build-script",
          role: "utility",
          package: "utility/backend-jenkins-build-script",
        },
        {
          name: "backend-postman-flow-tests",
          role: "utility",
          package: "utility/backend-postman-flow-tests",
        },
        {
          name: "backend-run-collection",
          role: "utility",
          package: "utility/backend-run-collection",
        },
      ]),
    );
    expect(lockfile.managedSkills).not.toContainEqual({
      name: "nexi-frontend-react-runtime",
      role: "runtime",
      package: "variant/frontend-react",
    });
  });

  it("sync fails clearly when no lockfile exists", async () => {
    await expect(syncCommand({ root, tool: "codex", ci: true, registry: registryRoot })).rejects.toThrow(
      "No nd-gen-skills lockfile found. Run install first.",
    );
  });

  it("sync after install succeeds and preserves the installed variant", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });

    await syncCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.variant?.name).toBe("frontend-react");
    await expect(readText("AGENTS.md")).resolves.toContain("nexi-frontend-react-runtime");
  });

  it("sync preserves installed utilities from the lockfile without listing them in AGENTS.md", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    await addManagedTddUtility();

    await syncCommand({ root, tool: "codex", ci: true, registry: registryRoot });

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    expect(lockfile.utilities).toEqual([
      { name: "tdd", version: "0.1.0", requested: true, requiredBy: [] },
      { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      readJiraUtility("frontend-react"),
      { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: false,
        requiredBy: ["variant/frontend-react"],
      },
    ]);
    expect(lockfile.managedSkills).toContainEqual({
      name: "tdd",
      role: "utility",
      package: "utility/tdd",
    });
    await expect(readText(".agents/skills/tdd/SKILL.md")).resolves.toContain("Test-Driven Development");
    const agents = await readText("AGENTS.md");
    expect(agents).not.toContain("Installed utility skills:");
    expect(agents).not.toContain("- `tdd`: Installed utility skill.");
  });

  it(
    "sync preserves transitive utility metadata while updating utility content from the selected registry",
    async () => {
      const dependencyRegistryRoot = await buildSyntheticDependencyRegistry("0.1.0");
      await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: dependencyRegistryRoot });
      await addSkillCommand({
        root,
        tool: "codex",
        skill: "synthetic-parent-utility",
        ci: true,
        registry: dependencyRegistryRoot,
      });
      expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).utilities).toEqual([
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        readJiraUtility("frontend-react"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
        { name: "synthetic-parent-utility", version: "0.1.0", requested: true, requiredBy: [] },
        {
          name: "synthetic-child-utility",
          version: "0.1.0",
          requested: false,
          requiredBy: ["utility/synthetic-parent-utility"],
        },
      ]);

      const nextDependencyRegistryRoot = await buildSyntheticDependencyRegistry("0.2.0");

      await syncCommand({ root, tool: "codex", ci: true, registry: nextDependencyRegistryRoot });

      await expect(readText(".agents/skills/synthetic-parent-utility/SKILL.md")).resolves.toContain(
        "Synthetic Parent Utility 0.2.0",
      );
      await expect(readText(".agents/skills/synthetic-child-utility/SKILL.md")).resolves.toContain(
        "Synthetic Child Utility 0.2.0",
      );
      expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).utilities).toEqual([
        { name: "synthetic-parent-utility", version: "0.2.0", requested: true, requiredBy: [] },
        {
          name: "synthetic-child-utility",
          version: "0.2.0",
          requested: false,
          requiredBy: ["utility/synthetic-parent-utility"],
        },
        { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        readJiraUtility("frontend-react"),
        { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
        {
          name: "frontend-react-e2e-test-implementation",
          version: "0.1.0",
          requested: false,
          requiredBy: ["variant/frontend-react"],
        },
      ]);
    },
    10_000,
  );

  it("sync supports utility-only installs and updates dependency closure", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry("0.1.0");
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });

    const nextDependencyRegistryRoot = await buildSyntheticDependencyRegistry("0.2.0");

    await syncCommand({ root, tool: "codex", ci: true, registry: nextDependencyRegistryRoot });

    await expect(readText(".agents/skills/synthetic-parent-utility/SKILL.md")).resolves.toContain(
      "Synthetic Parent Utility 0.2.0",
    );
    await expect(readText(".agents/skills/synthetic-child-utility/SKILL.md")).resolves.toContain(
      "Synthetic Child Utility 0.2.0",
    );
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).utilities).toEqual([
      { name: "synthetic-parent-utility", version: "0.2.0", requested: true, requiredBy: [] },
      {
        name: "synthetic-child-utility",
        version: "0.2.0",
        requested: false,
        requiredBy: ["utility/synthetic-parent-utility"],
      },
    ]);
  });

  it("sync restores missing utility dependencies from requested utilities", async () => {
    const dependencyRegistryRoot = await buildSyntheticDependencyRegistry("0.1.0");
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: dependencyRegistryRoot });
    await addSkillCommand({
      root,
      tool: "codex",
      skill: "synthetic-parent-utility",
      ci: true,
      registry: dependencyRegistryRoot,
    });
    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    lockfile.utilities = lockfile.utilities.filter((utility) => utility.name !== "synthetic-child-utility");
    lockfile.managedSkills = lockfile.managedSkills.filter((skill) => skill.name !== "synthetic-child-utility");
    lockfile.managedFiles = lockfile.managedFiles.filter(
      (file) => file.package !== "utility/synthetic-child-utility",
    );
    await writeLockfile(lockfile);
    await rm(path.join(root, ".agents/skills/synthetic-child-utility"), { recursive: true, force: true });

    await syncCommand({ root, tool: "codex", ci: true, registry: dependencyRegistryRoot });

    await expect(readText(".agents/skills/synthetic-child-utility/SKILL.md")).resolves.toContain(
      "Synthetic Child Utility 0.1.0",
    );
    expect((await readLockfile(".agents/nd-gen-skills.lock.yaml")).utilities).toEqual([
      { name: "synthetic-parent-utility", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "synthetic-child-utility",
        version: "0.1.0",
        requested: false,
        requiredBy: ["utility/synthetic-parent-utility"],
      },
      { name: "grill-me", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      readJiraUtility("frontend-react"),
      { name: "figma-use", version: "0.1.0", requested: false, requiredBy: ["variant/frontend-react"] },
      {
        name: "frontend-react-e2e-test-implementation",
        version: "0.1.0",
        requested: false,
        requiredBy: ["variant/frontend-react"],
      },
    ]);
  });

  it("sync updates installed managed files and hashes from a newer selected registry", async () => {
    await installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot });
    const firstRuntime = await readText(".agents/skills/nexi-frontend-react-runtime/SKILL.md");
    const firstLockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    const firstRuntimeHash = managedFileHash(firstLockfile, ".agents/skills/nexi-frontend-react-runtime/SKILL.md");
    const nextRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-next");
    const nextPackagesRoot = path.join(path.dirname(registryRoot), "packages-next");

    await cp(packagesRoot, nextPackagesRoot, { recursive: true });
    await writeFile(
      path.join(nextPackagesRoot, "variant/frontend-react/manifest.yaml"),
      frontendReactManifest("0.1.1"),
      "utf8",
    );
    await writeFile(
      path.join(nextPackagesRoot, "variant/frontend-react/runtime/SKILL.md"),
      `${firstRuntime}\n\nSynced registry marker: frontend runtime 0.1.1\n`,
      "utf8",
    );
    await buildRegistry({ packagesRoot: nextPackagesRoot, outputRoot: nextRegistryRoot });

    await syncCommand({ root, tool: "codex", ci: true, registry: nextRegistryRoot });

    const nextRuntime = await readText(".agents/skills/nexi-frontend-react-runtime/SKILL.md");
    const nextLockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    const nextRuntimeHash = managedFileHash(nextLockfile, ".agents/skills/nexi-frontend-react-runtime/SKILL.md");
    expect(nextRuntime).toContain("Synced registry marker: frontend runtime 0.1.1");
    expect(nextRuntime).not.toBe(firstRuntime);
    expect(nextLockfile.variant?.version).toBe("0.1.1");
    expect(nextRuntimeHash).not.toBe(firstRuntimeHash);
    expect(nextRuntimeHash).toBe(sha256Text(nextRuntime));
  });

  it("rejects manifest source paths that escape the extracted package root", async () => {
    await replaceFrontendVariantWithEscapingSource();

    await expect(
      installCommand({ root, tool: "codex", variant: "frontend-react", ci: true, registry: registryRoot }),
    ).rejects.toThrow(/Path escapes root|Refusing to access path outside root/);
    await expect(readText(".agents/skills/nexi-frontend-react-runtime/SKILL.md")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("installs to Claude skill and lockfile paths", async () => {
    await installCommand({ root, tool: "claude", variant: "frontend-react", ci: true, registry: registryRoot });

    await expect(readText(".claude/skills/nexi-frontend-react-runtime/SKILL.md")).resolves.toContain("Nexi");
    const lockfile = await readLockfile(".claude/nd-gen-skills.lock.yaml");
    expect(lockfile.tool).toBe("claude");
    expect(lockfile.variant?.name).toBe("frontend-react");
  });

  async function readText(relativePath: string): Promise<string> {
    return readFile(path.join(root, relativePath), "utf8");
  }

  async function readLockfile(relativePath: string): Promise<Lockfile> {
    return parseLockfile(YAML.parse(await readText(relativePath)));
  }

  async function writeLockfile(lockfile: Lockfile): Promise<void> {
    await writeTreeFile(root, ".agents/nd-gen-skills.lock.yaml", YAML.stringify(lockfile));
  }

  async function addManagedTddUtility(): Promise<void> {
    const utilityContent = await readFile(path.join(packagesRoot, "utility/tdd/skill/SKILL.md"), "utf8");
    await writeTreeFile(root, ".agents/skills/tdd/SKILL.md", utilityContent);

    const lockfile = await readLockfile(".agents/nd-gen-skills.lock.yaml");
    lockfile.utilities = [{ name: "tdd", version: "0.1.0", requested: true, requiredBy: [] }];
    lockfile.managedSkills = [
      ...lockfile.managedSkills,
      { name: "tdd", role: "utility", package: "utility/tdd" },
    ];
    lockfile.managedFiles = [
      ...lockfile.managedFiles,
      {
        path: ".agents/skills/tdd/SKILL.md",
        package: "utility/tdd",
        sha256: sha256Text(utilityContent),
      },
    ];
    await writeLockfile(lockfile);
    await writeFile(
      path.join(root, "AGENTS.md"),
      renderAgentsBlock({
        variant: "frontend-react",
        runtimeSkill: "nexi-frontend-react-runtime",
        utilities: [{ name: "tdd", description: "Use test-driven development for implementation work." }],
      }),
      "utf8",
    );
  }

  async function replaceFrontendVariantWithEscapingSource(): Promise<void> {
    const sandbox = path.dirname(registryRoot);
    const maliciousSource = path.join(sandbox, "outside-source");
    const maliciousPackageRoot = path.join(sandbox, "malicious-variant");
    const escapingSource = path.posix.join("..", path.basename(sandbox), "outside-source", "SKILL.md");

    await mkdir(maliciousSource, { recursive: true });
    await mkdir(maliciousPackageRoot, { recursive: true });
    await writeFile(path.join(maliciousSource, "SKILL.md"), "# Escaped Package Source\n", "utf8");
    await writeFile(
      path.join(maliciousPackageRoot, "manifest.yaml"),
      frontendReactManifest("0.1.0", escapingSource),
      "utf8",
    );
    await createTar(
      {
        cwd: maliciousPackageRoot,
        file: path.join(registryRoot, "packages/variant-frontend-react-0.1.0.tgz"),
        gzip: true,
        noMtime: true,
        portable: true,
      },
      ["manifest.yaml"],
    );
  }

  async function buildSyntheticDependencyRegistry(version: string): Promise<string> {
    const syntheticPackagesRoot = path.join(path.dirname(registryRoot), `packages-dependencies-${version}`);
    const syntheticRegistryRoot = path.join(path.dirname(registryRoot), `dist-registry-dependencies-${version}`);
    await cp(packagesRoot, syntheticPackagesRoot, { recursive: true });
    await writeSyntheticPackage({
      root: path.join(syntheticPackagesRoot, "utility", "synthetic-parent-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-parent-utility",
        version,
        description: "Synthetic parent utility.",
        requiresUtilities: ["synthetic-child-utility"],
      }),
      title: `Synthetic Parent Utility ${version}`,
    });
    await writeSyntheticPackage({
      root: path.join(syntheticPackagesRoot, "utility", "synthetic-child-utility"),
      manifest: utilityManifestForName({
        name: "synthetic-child-utility",
        version,
        description: "Synthetic child utility.",
      }),
      title: `Synthetic Child Utility ${version}`,
    });

    await buildRegistry({ packagesRoot: syntheticPackagesRoot, outputRoot: syntheticRegistryRoot });
    return syntheticRegistryRoot;
  }

  async function buildRegistryWithWorkflowStackProvider(): Promise<string> {
    const workflowPackagesRoot = path.join(path.dirname(registryRoot), "packages-workflow-stack-provider");
    const workflowRegistryRoot = path.join(path.dirname(registryRoot), "dist-registry-workflow-stack-provider");
    await cp(packagesRoot, workflowPackagesRoot, { recursive: true });
    await cp(
      path.join(workflowPackagesRoot, "provider", "superpowers"),
      path.join(workflowPackagesRoot, "provider", "workflow-stack"),
      { recursive: true },
    );
    const providerManifest = await readFile(
      path.join(workflowPackagesRoot, "provider", "workflow-stack", "manifest.yaml"),
      "utf8",
    );
    await writeFile(
      path.join(workflowPackagesRoot, "provider", "workflow-stack", "manifest.yaml"),
      providerManifest.replace(/^name: superpowers$/m, "name: workflow-stack"),
      "utf8",
    );
    await buildRegistry({ packagesRoot: workflowPackagesRoot, outputRoot: workflowRegistryRoot });
    return workflowRegistryRoot;
  }
});

function managedFileHash(lockfile: Lockfile, relativePath: string): string {
  const managedFile = lockfile.managedFiles.find((file) => file.path === relativePath);
  if (!managedFile) {
    throw new Error(`Missing managed file entry: ${relativePath}`);
  }
  return managedFile.sha256;
}

function frontendReactManifest(version: string, source = "runtime"): string {
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
  source: ${source}
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

async function writeSyntheticPackage(input: { root: string; manifest: string; title: string }): Promise<void> {
  await mkdir(path.join(input.root, "skill"), { recursive: true });
  await writeFile(path.join(input.root, "manifest.yaml"), input.manifest, "utf8");
  await writeFile(path.join(input.root, "skill", "SKILL.md"), `# ${input.title}\n`, "utf8");
}

function utilityManifestForName(input: {
  name: string;
  version: string;
  description: string;
  requiresUtilities?: string[];
}): string {
  return `apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: ${input.name}
version: ${input.version}
description: ${input.description}
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
