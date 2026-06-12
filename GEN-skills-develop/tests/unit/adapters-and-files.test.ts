import { mkdtemp, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getToolAdapter } from "../../src/adapters/index.js";
import { exists, readTree, removePath, writeTreeFile } from "../../src/fs/file-tree.js";
import { assertInsideRoot } from "../../src/fs/path-safety.js";
import { sha256Text } from "../../src/hashing/sha256.js";

describe("tool adapters", () => {
  it("maps Codex skill and lockfile paths", () => {
    const adapter = getToolAdapter("codex");

    expect(adapter.tool).toBe("codex");
    expect(adapter.skillDir("brainstorming")).toBe(path.join(".agents", "skills", "brainstorming"));
    expect(adapter.lockfilePath).toBe(path.join(".agents", "nd-gen-skills.lock.yaml"));
  });

  it("maps Claude skill and lockfile paths", () => {
    const adapter = getToolAdapter("claude");

    expect(adapter.tool).toBe("claude");
    expect(adapter.skillDir("brainstorming")).toBe(path.join(".claude", "skills", "brainstorming"));
    expect(adapter.lockfilePath).toBe(path.join(".claude", "nd-gen-skills.lock.yaml"));
  });
});

describe("path safety", () => {
  it("rejects traversal outside root", () => {
    const root = path.join(tmpdir(), "nd-gen-skills-root");

    expect(() => assertInsideRoot(root, "../outside")).toThrow("Path escapes root");
  });
});

describe("hashing", () => {
  it("hashes text with SHA-256", () => {
    expect(sha256Text("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("file tree helpers", () => {
  it("writes, reads, checks, and removes paths inside a tree", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-tree-"));

    await writeTreeFile(root, "skills/brainstorming/SKILL.md", "brainstorm");
    await writeTreeFile(root, "skills/brainstorming/assets/prompt.txt", Buffer.from("prompt"));

    expect(await exists(root, "skills/brainstorming/SKILL.md")).toBe(true);
    expect(await exists(root, "skills/brainstorming/missing.md")).toBe(false);

    const files = await readTree(root, "skills");

    expect(files).toEqual([
      {
        path: path.join("brainstorming", "SKILL.md"),
        content: Buffer.from("brainstorm"),
      },
      {
        path: path.join("brainstorming", "assets", "prompt.txt"),
        content: Buffer.from("prompt"),
      },
    ]);

    await removePath(root, "skills/brainstorming/assets");

    expect(await exists(root, "skills/brainstorming/assets/prompt.txt")).toBe(false);
    expect(await exists(root, "skills/brainstorming/SKILL.md")).toBe(true);
  });

  it("rejects writes through symlinks that escape the root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-root-"));
    const outside = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-outside-"));
    await symlink(outside, path.join(root, "link"));

    await expect(writeTreeFile(root, "link/escape.txt", "bad")).rejects.toThrow(
      "Refusing to access path outside root",
    );
    expect(await exists(outside, "escape.txt")).toBe(false);
  });

  it("rejects removing the root path", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "nd-gen-skills-tree-"));

    await expect(removePath(root, ".")).rejects.toThrow("Refusing to remove root path");
    await expect(removePath(root, "")).rejects.toThrow("Refusing to remove root path");
  });
});
