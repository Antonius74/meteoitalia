import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  SUPERPOWERS_PROVIDER_SKILLS,
  syncSuperpowersProvider,
} from "../../scripts/sync-superpowers-provider.js";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve("scripts/sync-superpowers-provider.ts");

describe("syncSuperpowersProvider", () => {
  it("copies whitelisted Superpowers skills without editing content and removes stale destination files", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot);
    await writeFileInRoot(providerRoot, "brainstorming/stale.md", "stale\n");
    await writeFileInRoot(providerRoot, "brainstorming/SKILL.md", "old skill\n");
    await writeFileInRoot(providerRoot, "not-allowlisted/SKILL.md", "keep me\n");

    const result = await syncSuperpowersProvider({ sourceRoot, providerRoot });

    expect(result.copiedSkills).toEqual([...SUPERPOWERS_PROVIDER_SKILLS].sort());
    expect(await collectSkillDirs(providerRoot)).toEqual([...SUPERPOWERS_PROVIDER_SKILLS, "not-allowlisted"].sort());
    await expect(readFile(path.join(providerRoot, "brainstorming", "stale.md"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readFile(path.join(providerRoot, "brainstorming", "SKILL.md"), "utf8")).resolves.toBe(
      "upstream brainstorming\n",
    );
    await expect(
      readFile(path.join(providerRoot, "subagent-driven-development", "implementer-prompt.md"), "utf8"),
    ).resolves.toBe("upstream implementer prompt\n");
    await expect(
      readFile(path.join(providerRoot, "subagent-driven-development", "nested", "notes.md"), "utf8"),
    ).resolves.toBe("upstream nested notes\n");
    await expect(readFile(path.join(providerRoot, "not-allowlisted", "SKILL.md"), "utf8")).resolves.toBe("keep me\n");
  });

  it("fails when a whitelisted upstream skill is missing", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot, { skipSkill: "using-git-worktrees" });

    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Missing upstream Superpowers skill: using-git-worktrees",
    );
  });

  it("fails when a whitelisted upstream skill lacks SKILL.md", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot, { skipSkillFile: "requesting-code-review" });

    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Upstream Superpowers skill lacks SKILL.md: requesting-code-review",
    );
  });

  it.each([
    ["equal roots", (sandbox: string) => path.join(sandbox, "skills"), (sandbox: string) => path.join(sandbox, "skills")],
    [
      "provider inside source",
      (sandbox: string) => path.join(sandbox, "source"),
      (sandbox: string) => path.join(sandbox, "source", "provider"),
    ],
    [
      "source inside provider",
      (sandbox: string) => path.join(sandbox, "provider", "source"),
      (sandbox: string) => path.join(sandbox, "provider"),
    ],
  ])("rejects overlapping source and provider roots before deleting source files: %s", async (_, sourceRootFor, providerRootFor) => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = sourceRootFor(sandbox);
    const providerRoot = providerRootFor(sandbox);

    await seedSourceSkills(sourceRoot);

    const sourceSkillFile = path.join(sourceRoot, "brainstorming", "SKILL.md");
    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Superpowers provider sync source and target must not overlap.",
    );
    await expect(readFile(sourceSkillFile, "utf8")).resolves.toBe("upstream brainstorming\n");
  });

  it.each(["", ".", "..", "../outside", "nested/name", "nested\\name", path.resolve("/absolute-skill")])(
    "rejects unsafe skill names before validating or deleting paths: %s",
    async (skillName) => {
      const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
      const sourceRoot = path.join(sandbox, "source");
      const providerRoot = path.join(sandbox, "provider");
      const outsideRoot = path.join(sandbox, "outside");

      await seedSourceSkills(sourceRoot);
      await writeFileInRoot(outsideRoot, "SKILL.md", "outside skill\n");
      await writeFileInRoot(outsideRoot, "keep.txt", "do not delete\n");

      await expect(syncSuperpowersProvider({ sourceRoot, providerRoot, skills: [skillName] })).rejects.toThrow(
        `Invalid Superpowers provider skill name: ${skillName}`,
      );
      await expect(readFile(path.join(outsideRoot, "SKILL.md"), "utf8")).resolves.toBe("outside skill\n");
      await expect(readFile(path.join(outsideRoot, "keep.txt"), "utf8")).resolves.toBe("do not delete\n");
    },
  );

  it("rejects symlinked overlapping roots before deleting source files", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider-link");

    await seedSourceSkills(sourceRoot);
    await symlink(sourceRoot, providerRoot, "dir");

    const sourceSkillFile = path.join(sourceRoot, "brainstorming", "SKILL.md");
    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Superpowers provider sync source and target must not overlap.",
    );
    await expect(readFile(sourceSkillFile, "utf8")).resolves.toBe("upstream brainstorming\n");
  });

  it("rejects symlinked upstream skill roots before deleting provider files", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");
    const linkedSkillRoot = path.join(sandbox, "linked-skill");

    await seedSourceSkills(sourceRoot, { skipSkill: "brainstorming" });
    await writeFileInRoot(linkedSkillRoot, "SKILL.md", "linked brainstorming\n");
    await symlink(linkedSkillRoot, path.join(sourceRoot, "brainstorming"), "dir");
    await writeFileInRoot(providerRoot, "brainstorming/SKILL.md", "provider stays\n");

    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Upstream Superpowers skill must not be a symlink: brainstorming",
    );
    await expect(readFile(path.join(providerRoot, "brainstorming", "SKILL.md"), "utf8")).resolves.toBe(
      "provider stays\n",
    );
  });

  it("rejects symlinked upstream SKILL.md files before deleting provider files", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");
    const linkedSkillFile = path.join(sandbox, "linked-SKILL.md");

    await seedSourceSkills(sourceRoot, { skipSkillFile: "brainstorming" });
    await writeFile(linkedSkillFile, "linked brainstorming\n", "utf8");
    await symlink(linkedSkillFile, path.join(sourceRoot, "brainstorming", "SKILL.md"), "file");
    await writeFileInRoot(providerRoot, "brainstorming/SKILL.md", "provider stays\n");

    await expect(syncSuperpowersProvider({ sourceRoot, providerRoot })).rejects.toThrow(
      "Upstream Superpowers skill SKILL.md must not be a symlink: brainstorming",
    );
    await expect(readFile(path.join(providerRoot, "brainstorming", "SKILL.md"), "utf8")).resolves.toBe(
      "provider stays\n",
    );
  });

  it("allows sibling source and provider paths with common string prefixes", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "source-copy");

    await seedSourceSkills(sourceRoot);

    const result = await syncSuperpowersProvider({ sourceRoot, providerRoot });

    expect(result.copiedSkills).toEqual([...SUPERPOWERS_PROVIDER_SKILLS].sort());
    await expect(readFile(path.join(providerRoot, "brainstorming", "SKILL.md"), "utf8")).resolves.toBe(
      "upstream brainstorming\n",
    );
  });

  it("uses SUPERPOWERS_SKILLS_SOURCE when --source is omitted", async () => {
    const sandbox = await mkdtemp(path.join(tmpdir(), "superpowers-provider-sync-"));
    const sourceRoot = path.join(sandbox, "source");
    const providerRoot = path.join(sandbox, "provider");

    await seedSourceSkills(sourceRoot);

    const result = await execFileAsync("npx", ["tsx", scriptPath, "--target", providerRoot], {
      cwd: path.resolve(),
      env: { ...process.env, SUPERPOWERS_SKILLS_SOURCE: sourceRoot },
    });

    expect(result.stdout).toContain(`Synced ${SUPERPOWERS_PROVIDER_SKILLS.length} Superpowers provider skills:`);
    await expect(readFile(path.join(providerRoot, "verification-before-completion", "SKILL.md"), "utf8")).resolves.toBe(
      "upstream verification-before-completion\n",
    );
  });
});

async function seedSourceSkills(
  sourceRoot: string,
  options: { skipSkill?: string; skipSkillFile?: string } = {},
): Promise<void> {
  for (const skillName of SUPERPOWERS_PROVIDER_SKILLS) {
    if (skillName === options.skipSkill) {
      continue;
    }

    const skillRoot = path.join(sourceRoot, skillName);
    await mkdir(skillRoot, { recursive: true });

    if (skillName !== options.skipSkillFile) {
      await writeFile(path.join(skillRoot, "SKILL.md"), `upstream ${skillName}\n`, "utf8");
    }

    if (skillName === "subagent-driven-development") {
      await writeFile(path.join(skillRoot, "implementer-prompt.md"), "upstream implementer prompt\n", "utf8");
      await writeFile(path.join(skillRoot, "spec-reviewer-prompt.md"), "upstream spec reviewer prompt\n", "utf8");
      await writeFile(
        path.join(skillRoot, "code-quality-reviewer-prompt.md"),
        "upstream code quality reviewer prompt\n",
        "utf8",
      );
      await writeFileInRoot(skillRoot, "nested/notes.md", "upstream nested notes\n");
    }
  }
}

async function writeFileInRoot(root: string, relativePath: string, content: string): Promise<void> {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function collectSkillDirs(providerRoot: string): Promise<string[]> {
  try {
    await access(providerRoot);
  } catch {
    return [];
  }

  const entries = await readdir(providerRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
