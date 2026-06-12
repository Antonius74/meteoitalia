import { describe, expect, it } from "vitest";
import { renderAgentsBlock, upsertAgentsBlock } from "../../src/agents-md/block.js";
import { parseLockfile } from "../../src/schemas/lockfile.js";

describe("lockfile schema", () => {
  it("parses a valid lockfile with installed packages and managed ownership", () => {
    const lockfile = parseLockfile({
      apiVersion: "nd-gen-skills.nexidigital.com/v1",
      tool: "codex",
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
      provider: { name: "superpowers", version: "0.1.0" },
      variant: { name: "frontend-react", version: "0.1.0", runtimeSkill: "nexi-frontend-react-runtime" },
      contracts: [{ name: "nexi-workflow-contracts", version: "0.1.0" }],
      utilities: [{ name: "read-jira-issue", version: "0.1.0" }],
      managedSkills: [
        { name: "brainstorming", role: "provider", package: "provider/superpowers" },
        { name: "nexi-frontend-react-runtime", role: "runtime", package: "variant/frontend-react" },
        { name: "nexi-workflow-contracts", role: "contract", package: "contract/nexi-workflow-contracts" },
        { name: "read-jira-issue", role: "utility", package: "utility/read-jira-issue" },
      ],
      managedFiles: [
        { path: ".agents/skills/brainstorming/SKILL.md", package: "provider/superpowers", sha256: "abc" },
        {
          path: ".agents/skills/nexi-frontend-react-runtime/SKILL.md",
          package: "variant/frontend-react",
          sha256: "def",
        },
      ],
    });

    expect(lockfile).toMatchObject({
      tool: "codex",
      provider: { name: "superpowers", version: "0.1.0" },
      variant: { name: "frontend-react", runtimeSkill: "nexi-frontend-react-runtime" },
      contracts: [{ name: "nexi-workflow-contracts", version: "0.1.0" }],
      utilities: [{ name: "read-jira-issue", version: "0.1.0" }],
    });
  });

  it("rejects an invalid apiVersion", () => {
    expect(() =>
      parseLockfile({
        apiVersion: "example.com/v0",
        tool: "codex",
        generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
        contracts: [],
        utilities: [],
        managedSkills: [],
        managedFiles: [],
      }),
    ).toThrow();
  });

  it("parses requested and transitive utility metadata", () => {
    const lockfile = parseLockfile({
      apiVersion: "nd-gen-skills.nexidigital.com/v1",
      tool: "codex",
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
      contracts: [],
      utilities: [
        { name: "documentation-kit", version: "0.1.0", requested: true },
        {
          name: "documentation-design-kit",
          version: "0.1.0",
          requested: false,
          requiredBy: ["documentation-kit"],
        },
      ],
      managedSkills: [],
      managedFiles: [],
    });

    expect(lockfile.utilities).toEqual([
      { name: "documentation-kit", version: "0.1.0", requested: true, requiredBy: [] },
      {
        name: "documentation-design-kit",
        version: "0.1.0",
        requested: false,
        requiredBy: ["documentation-kit"],
      },
    ]);
  });

  it("defaults legacy utility lockfile entries to requested utilities", () => {
    const lockfile = parseLockfile({
      apiVersion: "nd-gen-skills.nexidigital.com/v1",
      tool: "codex",
      generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
      contracts: [],
      utilities: [{ name: "read-jira-issue", version: "0.1.0" }],
      managedSkills: [],
      managedFiles: [],
    });

    expect(lockfile.utilities).toEqual([
      { name: "read-jira-issue", version: "0.1.0", requested: true, requiredBy: [] },
    ]);
  });
});

describe("AGENTS.md block", () => {
  it("renders runtime guidance, skill composition, and the Human VCS Gate without utility inventory", () => {
    const block = renderAgentsBlock({
      variant: "frontend-react",
      runtimeSkill: "nexi-frontend-react-runtime",
      utilities: [{ name: "read-jira-issue", description: "Read Jira issue evidence for workflow skills in read-only mode." }],
    });

    expect(block).toContain("Runtime entry point:");
    expect(block).toContain(
      "- Start with `nexi-frontend-react-runtime` for implementation, debugging, testing, review, and maintenance.",
    );
    expect(block).toContain("Skill composition:");
    expect(block).toContain("- The runtime skill is the repository-level entry point.");
    expect(block).toContain("- Provider skills guide workflow phases.");
    expect(block).toContain("- Utility skills add focused capabilities.");
    expect(block).toContain(
      "- Repository instructions and this managed block override provider instructions when they conflict.",
    );
    expect(block).toContain("Human VCS Gate:");
    expect(block).toContain(
      "Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    );
    expect(block).toContain("- Read-only Git inspection is allowed.");
    expect(block).toContain(
      "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
    );
    expect(block).not.toContain("Installed utility skills:");
    expect(block).not.toContain("- None");
    expect(block).not.toContain("- `read-jira-issue`:");
    expect(block).not.toContain("Read Jira issue evidence for workflow skills in read-only mode.");
    expect(block).not.toContain("installed for the `frontend-react` variant");
    expect(block).not.toContain("Tool:");
    expect(block).not.toContain("Provider:");
    expect(block).not.toContain("Variant:");
  });

  it("renders a utility-only block when no runtime is present", () => {
    const block = renderAgentsBlock({
      utilities: [{ name: "read-jira-issue", description: "Read Jira issue evidence for workflow skills in read-only mode." }],
    });

    expect(block).toContain("This repository uses Nexi AI Skills utility packages.");
    expect(block).toContain("Skill composition:");
    expect(block).toContain("- Utility skills add focused capabilities.");
    expect(block).toContain(
      "- Repository instructions and this managed block override installed skill instructions when they conflict.",
    );
    expect(block).not.toContain("Runtime entry point:");
    expect(block).not.toContain("Start with");
    expect(block).not.toContain("The runtime skill is the repository-level entry point.");
    expect(block).not.toContain("Provider skills guide workflow phases.");
    expect(block).not.toContain("Installed utility skills:");
    expect(block).not.toContain("- None");
    expect(block).not.toContain("- `read-jira-issue`:");
    expect(block).not.toContain("Read Jira issue evidence for workflow skills in read-only mode.");
    expect(block).toContain("Human VCS Gate");
    expect(block).toContain(
      "Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    );
  });

  it("preserves content outside an existing managed block and replaces the old block", () => {
    const existing = "# Repo\n\nKeep this.\n\n<!-- nd-gen-skills:start -->\nold\n<!-- nd-gen-skills:end -->\n\nKeep that.\n";
    const next = upsertAgentsBlock(existing, "<!-- nd-gen-skills:start -->\nnew\n<!-- nd-gen-skills:end -->\n");

    expect(next).toContain("Keep this.");
    expect(next).toContain("Keep that.");
    expect(next).toContain("new");
    expect(next).not.toContain("old");
  });

  it("appends the managed block when no markers exist", () => {
    const block = "<!-- nd-gen-skills:start -->\nnew\n<!-- nd-gen-skills:end -->\n";

    expect(upsertAgentsBlock("# Repo\n\nKeep this.\n", block)).toBe("# Repo\n\nKeep this.\n\n" + block);
  });
});
