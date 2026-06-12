import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(".");
const cliPath = path.join(projectRoot, "dist/bin/nd-gen-skills.js");

describe("packaged CLI workflows", () => {
  it(
    "runs install, validate, utility smoke commands, Claude install, and package dry-run from built output",
    async () => {
      await run("npm", ["run", "build"]);
      await run("npm", ["run", "build:registry"]);

      const codexRepo = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-cli-codex-"));
      await runNodeCli(["install", "--variant", "frontend-react"], codexRepo);
      await runNodeCli(["validate", "--ci"], codexRepo);
      await runNodeCli(["list"], codexRepo);
      await runNodeCli(["list", "--available"], codexRepo);
      await runNodeCli(["validate", "--ci"], codexRepo);
      await runNodeCli(["add-skill", "documentation-kit"], codexRepo);
      await runNodeCli(["validate", "--ci"], codexRepo);
      await expect(
        readFile(path.join(codexRepo, ".agents/skills/documentation-kit/SKILL.md"), "utf8"),
      ).resolves.toContain("Documentation Kit");
      await expect(
        access(path.join(codexRepo, ".agents/skills/documentation-design-kit/SKILL.md")),
      ).resolves.toBeUndefined();
      await expect(
        access(path.join(codexRepo, ".agents/skills/documentation-ubiquitous-language/SKILL.md")),
      ).resolves.toBeUndefined();
      await expect(
        access(path.join(codexRepo, ".agents/skills/documentation-core/SKILL.md")),
      ).resolves.toBeUndefined();

      const claudeRepo = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-cli-claude-"));
      await runNodeCli(["install", "--tool", "claude", "--variant", "frontend-react"], claudeRepo);
      await expect(
        access(path.join(claudeRepo, ".claude/skills/nexi-frontend-react-runtime/SKILL.md")),
      ).resolves.toBeUndefined();

      const workflowStackRepo = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-cli-workflow-stack-"));
      await runNodeCli(["install", "--variant", "frontend-react", "--provider", "workflow-stack"], workflowStackRepo);
      await runNodeCli(["validate", "--ci"], workflowStackRepo);

      const { stdout } = await run("npm", ["pack", "--dry-run", "--json"]);
      const packedFiles = parsePackedFiles(stdout);

      expect(packedFiles).toContain("dist/bin/nd-gen-skills.js");
      expect(packedFiles).toContain("dist-registry/index.yaml");
      expect(packedFiles).toEqual(
        expect.arrayContaining([
          "dist-registry/packages/provider-superpowers-0.1.0.tgz",
          "dist-registry/packages/provider-workflow-stack-0.1.0.tgz",
          "dist-registry/packages/contract-nexi-workflow-contracts-0.1.0.tgz",
          "dist-registry/packages/contract-documentation-core-0.1.0.tgz",
          "dist-registry/packages/variant-frontend-react-0.1.0.tgz",
          "dist-registry/packages/variant-backend-java-0.1.0.tgz",
          "dist-registry/packages/variant-mobile-ios-0.1.0.tgz",
          "dist-registry/packages/variant-mobile-android-0.1.0.tgz",
          "dist-registry/packages/utility-read-jira-issue-0.1.0.tgz",
          "dist-registry/packages/utility-documentation-kit-0.1.0.tgz",
          "dist-registry/packages/utility-documentation-design-kit-0.1.0.tgz",
          "dist-registry/packages/utility-documentation-ubiquitous-language-0.1.0.tgz",
          "dist-registry/packages/utility-documentation-quality-assessment-0.1.0.tgz",
          "dist-registry/packages/utility-agents-md-refactor-0.1.0.tgz",
          "dist-registry/packages/utility-grill-me-0.1.0.tgz",
          "dist-registry/packages/utility-tdd-0.1.0.tgz",
          "dist-registry/packages/utility-figma-use-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-commit-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-compress-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-help-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-review-0.1.0.tgz",
          "dist-registry/packages/utility-caveman-stats-0.1.0.tgz",
          "dist-registry/packages/utility-cavecrew-0.1.0.tgz",
        ]),
      );
      expect(packedFiles).toContain("README.md");
      expect(packedFiles.some((file) => file.startsWith("tests/"))).toBe(false);
      expect(packedFiles.filter((file) => file.startsWith("dist/") && file.endsWith(".tgz"))).toEqual([]);
    },
    120_000,
  );
});

async function run(command: string, args: string[], cwd: string = projectRoot): Promise<{ stdout: string }> {
  return execFileAsync(command, args, {
    cwd,
    env: { ...process.env, CI: "true" },
    maxBuffer: 1024 * 1024 * 10,
    timeout: 120_000,
  });
}

async function runNodeCli(args: string[], cwd: string): Promise<void> {
  await run("node", [cliPath, ...args], cwd);
}

function parsePackedFiles(stdout: string): string[] {
  const packs = JSON.parse(stdout) as Array<{ files: Array<{ path: string }> }>;
  return packs.flatMap((pack) => pack.files.map((file) => file.path));
}
