import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderRunnerScript, resolveShareableVersion } from "../../scripts/build-codex-shareable.js";

describe("build-codex-shareable", () => {
  it("chooses the next package patch version even when that tarball already exists", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "nd-shareable-version-"));

    await expect(resolveShareableVersion({ baseVersion: "0.1.0", outputRoot, nextVersion: true })).resolves.toBe(
      "0.1.1",
    );

    await writeFile(path.join(outputRoot, "gen-skills-0.1.1.tgz"), "");

    await expect(resolveShareableVersion({ baseVersion: "0.1.0", outputRoot, nextVersion: true })).resolves.toBe(
      "0.1.1",
    );
  });

  it("renders a Codex utility install runner for the built tarball version", () => {
    const script = renderRunnerScript("0.1.1");

    expect(script).toContain("gen-skills-0.1.1.tgz");
    expect(script).toContain('"nd-gen-skills"');
    expect(script).toContain('"add-skill"');
    expect(script).toContain('"--tool"');
    expect(script).toContain('"codex"');
  });
});
