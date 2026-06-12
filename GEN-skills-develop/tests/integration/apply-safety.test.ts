import { mkdir, mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { applyDesiredState, type OverwriteMode } from "../../src/installer/apply.js";
import { writeTreeFile } from "../../src/fs/file-tree.js";
import { sha256Text } from "../../src/hashing/sha256.js";
import { parseLockfile, type Lockfile } from "../../src/schemas/lockfile.js";

const skillFile = path.join(".agents", "skills", "brainstorming", "SKILL.md");
const lockfilePath = path.join(".agents", "nd-gen-skills.lock.yaml");

describe("applyDesiredState safety", () => {
  it("refuses unmanaged skill folder collision before writing", async () => {
    const root = await tempRoot();
    await writeTreeFile(root, skillFile, "local unmanaged skill");

    await expect(applyDesired(root)).rejects.toThrow(
      `Refusing to overwrite unmanaged skill folder: ${path.join(root, ".agents", "skills", "brainstorming")}`,
    );

    await expect(readFile(path.join(root, skillFile), "utf8")).resolves.toBe("local unmanaged skill");
    await expect(readFile(path.join(root, lockfilePath), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("writes managed files, lockfile with computed managedFiles hashes, and AGENTS.md block", async () => {
    const root = await tempRoot();
    const desiredContent = "# Brainstorming\n";

    await applyDesired(root, {
      desiredFiles: new Map([[skillFile, Buffer.from(desiredContent)]]),
      agentsBlock: "<!-- nd-gen-skills:start -->\nmanaged instructions\n<!-- nd-gen-skills:end -->\n",
    });

    await expect(readFile(path.join(root, skillFile), "utf8")).resolves.toBe(desiredContent);
    await expect(readFile(path.join(root, "AGENTS.md"), "utf8")).resolves.toContain("managed instructions");

    const lockfile = parseLockfile(YAML.parse(await readFile(path.join(root, lockfilePath), "utf8")));
    expect(lockfile.managedFiles).toEqual([
      {
        path: skillFile,
        package: "provider/superpowers",
        sha256: sha256Text(desiredContent),
      },
    ]);
  });

  it("fail mode rejects changed managed file when existing content hash differs from lockfile", async () => {
    const root = await tempRoot();
    await writeTreeFile(root, skillFile, "locally changed");

    await expect(
      applyDesired(root, {
        existingLockfile: lockfileWithManagedFile("original hash", "provider/superpowers"),
      }),
    ).rejects.toThrow(`Managed file changed locally: ${path.join(root, skillFile)}`);

    await expect(readFile(path.join(root, skillFile), "utf8")).resolves.toBe("locally changed");
  });

  it("force mode overwrites changed managed file", async () => {
    const root = await tempRoot();
    await writeTreeFile(root, skillFile, "locally changed");

    const result = await applyDesired(root, {
      mode: "force",
      existingLockfile: lockfileWithManagedFile("original hash", "provider/superpowers"),
      desiredFiles: new Map([[skillFile, Buffer.from("replacement")]]),
    });

    expect(result.writtenFiles).toContain(skillFile);
    await expect(readFile(path.join(root, skillFile), "utf8")).resolves.toBe("replacement");
  });

  it("obsolete managed file from existing lockfile is removed after hash check when not present in desiredFiles", async () => {
    const root = await tempRoot();
    const obsoleteFile = path.join(".agents", "skills", "old-skill", "SKILL.md");
    await writeTreeFile(root, obsoleteFile, "old managed");

    const result = await applyDesired(root, {
      existingLockfile: lockfileWithManagedFile(sha256Text("old managed"), "utility/old-skill", obsoleteFile, "old-skill"),
      desiredFiles: new Map(),
      desiredLockfile: baseLockfile({ managedSkills: [] }),
    });

    expect(result.removedFiles).toEqual([obsoleteFile]);
    await expect(readFile(path.join(root, obsoleteFile), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses to remove obsolete managed file outside the selected skills root", async () => {
    const root = await tempRoot();
    await writeTreeFile(root, "important.txt", "keep me");

    await expect(
      applyDesired(root, {
        existingLockfile: lockfileWithManagedFile(
          sha256Text("keep me"),
          "utility/old-skill",
          "important.txt",
          "old-skill",
        ),
        desiredFiles: new Map(),
        desiredLockfile: baseLockfile({ managedSkills: [] }),
      }),
    ).rejects.toThrow("Refusing to remove managed file outside skills root: important.txt");

    await expect(readFile(path.join(root, "important.txt"), "utf8")).resolves.toBe("keep me");
  });

  it("obsolete managed file with local modifications is not removed in fail mode", async () => {
    const root = await tempRoot();
    const obsoleteFile = path.join(".agents", "skills", "old-skill", "SKILL.md");
    await writeTreeFile(root, obsoleteFile, "locally changed");

    await expect(
      applyDesired(root, {
        existingLockfile: lockfileWithManagedFile(sha256Text("old managed"), "utility/old-skill", obsoleteFile, "old-skill"),
        desiredFiles: new Map(),
        desiredLockfile: baseLockfile({ managedSkills: [] }),
      }),
    ).rejects.toThrow(`Managed file changed locally: ${path.join(root, obsoleteFile)}`);

    await expect(readFile(path.join(root, obsoleteFile), "utf8")).resolves.toBe("locally changed");
  });

  it("AGENTS.md existing content outside managed block is preserved", async () => {
    const root = await tempRoot();
    await writeTreeFile(
      root,
      "AGENTS.md",
      "# Repo\n\nKeep before.\n\n<!-- nd-gen-skills:start -->\nold block\n<!-- nd-gen-skills:end -->\n\nKeep after.\n",
    );

    await applyDesired(root, {
      agentsBlock: "<!-- nd-gen-skills:start -->\nnew block\n<!-- nd-gen-skills:end -->\n",
    });

    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("Keep before.");
    expect(agents).toContain("Keep after.");
    expect(agents).toContain("new block");
    expect(agents).not.toContain("old block");
  });

  it("folders containing unmanaged files are preserved and reported", async () => {
    const root = await tempRoot();
    const obsoleteFile = path.join(".agents", "skills", "old-skill", "SKILL.md");
    const unmanagedFile = path.join(".agents", "skills", "old-skill", "notes.txt");
    await writeTreeFile(root, obsoleteFile, "old managed");
    await writeTreeFile(root, unmanagedFile, "keep me");

    const result = await applyDesired(root, {
      existingLockfile: lockfileWithManagedFile(sha256Text("old managed"), "utility/old-skill", obsoleteFile, "old-skill"),
      desiredFiles: new Map(),
      desiredLockfile: baseLockfile({ managedSkills: [] }),
    });

    expect(result.removedFiles).toEqual([obsoleteFile]);
    expect(result.preservedFolders).toEqual([path.join(".agents", "skills", "old-skill")]);
    await expect(readFile(path.join(root, unmanagedFile), "utf8")).resolves.toBe("keep me");
    await expect(readdir(path.join(root, ".agents", "skills", "old-skill"))).resolves.toEqual(["notes.txt"]);
  });

  it("does not treat nested template skill folders as unmanaged top-level skills on reapply", async () => {
    const root = await tempRoot();
    const templateFile = path.join(
      ".agents",
      "skills",
      "workflow-core-kit",
      "templates",
      "skills",
      "backend",
      "planning.template.md",
    );
    const desiredFiles = new Map([[templateFile, Buffer.from("template")]]);

    await applyDesired(root, {
      desiredFiles,
      desiredLockfile: baseLockfile({
        managedSkills: [{ name: "workflow-core-kit", role: "provider", package: "provider/workflow-stack" }],
        managedFiles: [{ path: templateFile, package: "provider/workflow-stack", sha256: "placeholder" }],
      }),
    });

    const existingLockfile = parseLockfile(YAML.parse(await readFile(path.join(root, lockfilePath), "utf8")));

    await expect(
      applyDesired(root, {
        existingLockfile,
        desiredFiles,
        desiredLockfile: {
          ...existingLockfile,
          managedFiles: [{ path: templateFile, package: "provider/workflow-stack", sha256: "placeholder" }],
        },
      }),
    ).resolves.toMatchObject({ writtenFiles: expect.arrayContaining([templateFile]) });
  });
});

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-apply-"));
  await mkdir(root, { recursive: true });
  return root;
}

async function applyDesired(
  root: string,
  overrides: Partial<{
    mode: OverwriteMode;
    existingLockfile: Lockfile;
    desiredFiles: Map<string, Buffer>;
    desiredLockfilePath: string;
    desiredLockfile: Lockfile;
    agentsBlock: string;
  }> = {},
) {
  const desiredFiles = overrides.desiredFiles ?? new Map([[skillFile, Buffer.from("managed skill")]]);

  return applyDesiredState({
    root,
    mode: overrides.mode ?? "fail",
    desiredFiles,
    existingLockfile: overrides.existingLockfile,
    desiredLockfilePath: overrides.desiredLockfilePath ?? lockfilePath,
    desiredLockfile:
      overrides.desiredLockfile ??
      baseLockfile({
        managedFiles: Array.from(desiredFiles.keys()).map((filePath) => ({
          path: filePath,
          package: "provider/superpowers",
          sha256: "placeholder",
        })),
      }),
    agentsBlock: overrides.agentsBlock,
  });
}

function lockfileWithManagedFile(
  sha256: string,
  packageName: string,
  filePath = skillFile,
  skillName = "brainstorming",
): Lockfile {
  return baseLockfile({
    managedSkills: [{ name: skillName, role: "provider", package: packageName }],
    managedFiles: [{ path: filePath, package: packageName, sha256 }],
  });
}

function baseLockfile(overrides: Partial<Lockfile> = {}): Lockfile {
  return {
    apiVersion: "nd-gen-skills.nexidigital.com/v1",
    tool: "codex",
    generatedBy: "@nexidigital/nd-gen-skills@0.1.0",
    contracts: [],
    utilities: [],
    managedSkills: [{ name: "brainstorming", role: "provider", package: "provider/superpowers" }],
    managedFiles: [],
    ...overrides,
  };
}
