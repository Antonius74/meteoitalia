import { randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { c as createTar } from "tar";
import { describe, expect, it } from "vitest";
import { extractPackageArchive } from "../../src/registry/archive.js";
import { loadRegistryIndex } from "../../src/registry/load-registry.js";
import { resolveRegistryRoot } from "../../src/registry/resolve-registry.js";

describe("resolveRegistryRoot", () => {
  it("prefers flag over env and bundled", () => {
    expect(resolveRegistryRoot({ flag: "/tmp/custom", env: "/tmp/env", packageRoot: "/pkg" })).toBe(
      "/tmp/custom",
    );
  });

  it("uses env before bundled", () => {
    expect(resolveRegistryRoot({ env: "/tmp/env", packageRoot: "/pkg" })).toBe("/tmp/env");
  });

  it("falls back to bundled dist-registry", () => {
    expect(resolveRegistryRoot({ packageRoot: "/pkg" })).toBe(path.join("/pkg", "dist-registry"));
  });
});

describe("loadRegistryIndex", () => {
  it("loads a flat registry index", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "nd-registry-"));
    await mkdir(path.join(root, "packages"));
    await writeRegistryIndex(
      root,
      `apiVersion: nd-gen-skills.nexidigital.com/v1
defaults:
  provider: superpowers
  contracts:
    - nexi-workflow-contracts
packages:
  provider/superpowers:
    latest: 0.1.0
    artifact: packages/provider-superpowers-0.1.0.tgz
`,
    );

    const index = await loadRegistryIndex(root);

    expect(index.defaults.provider).toBe("superpowers");
    expect(index.defaults.contracts).toEqual(["nexi-workflow-contracts"]);
    expect(index.packages["provider/superpowers"].latest).toBe("0.1.0");
    expect(index.packages["provider/superpowers"].artifact).toBe("packages/provider-superpowers-0.1.0.tgz");
  });

  it("rejects an invalid apiVersion", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "nd-registry-"));
    await writeRegistryIndex(
      root,
      `apiVersion: example.com/v0
defaults:
  provider: superpowers
  contracts: []
packages: {}
`,
    );

    await expect(loadRegistryIndex(root)).rejects.toThrow();
  });
});

describe("extractPackageArchive", () => {
  it("extracts a package archive to a temp directory containing manifest.yaml", async () => {
    const packageRoot = await mkdtemp(path.join(tmpdir(), "nd-package-"));
    const archivePath = path.join(tmpdir(), `nd-package-${randomUUID()}.tgz`);
    await writeFile(path.join(packageRoot, "manifest.yaml"), "name: test-package\n");

    await createTar({ cwd: packageRoot, file: archivePath, gzip: true }, ["manifest.yaml"]);

    const extractedRoot = await extractPackageArchive(archivePath);

    await expect(access(path.join(extractedRoot, "manifest.yaml"))).resolves.toBeUndefined();
  });

  it("rejects archive entries with parent directory traversal", async () => {
    const packageRoot = await mkdtemp(path.join(tmpdir(), "nd-package-"));
    const archivePath = path.join(tmpdir(), `nd-package-${randomUUID()}.tgz`);
    await writeFile(path.join(packageRoot, "escape.txt"), "bad");
    await createTar(
      {
        cwd: packageRoot,
        file: archivePath,
        gzip: true,
        onWriteEntry(entry) {
          entry.path = "../escape.txt";
        },
      },
      ["escape.txt"],
    );

    await expect(extractPackageArchive(archivePath)).rejects.toThrow("Refusing to extract unsafe archive entry");
  });

  it("rejects package archives without manifest.yaml", async () => {
    const packageRoot = await mkdtemp(path.join(tmpdir(), "nd-package-"));
    const archivePath = path.join(tmpdir(), `nd-package-${randomUUID()}.tgz`);
    await writeFile(path.join(packageRoot, "README.md"), "missing manifest\n");

    await createTar({ cwd: packageRoot, file: archivePath, gzip: true }, ["README.md"]);

    await expect(extractPackageArchive(archivePath)).rejects.toThrow("Package archive is missing manifest.yaml");
  });

  it("rejects archive entries with absolute paths", async () => {
    const packageRoot = await mkdtemp(path.join(tmpdir(), "nd-package-"));
    const archivePath = path.join(tmpdir(), `nd-package-${randomUUID()}.tgz`);
    await writeFile(path.join(packageRoot, "escape.txt"), "bad");
    await createTar(
      {
        cwd: packageRoot,
        file: archivePath,
        gzip: true,
        onWriteEntry(entry) {
          entry.path = "/tmp/escape.txt";
        },
      },
      ["escape.txt"],
    );

    await expect(extractPackageArchive(archivePath)).rejects.toThrow("Refusing to extract unsafe archive entry");
  });

  it("removes the temp extraction directory when extraction fails", async () => {
    const archiveName = `nd-package-${randomUUID()}.tgz`;
    const archivePath = path.join(tmpdir(), archiveName);
    await writeFile(
      archivePath,
      gzipSync(Buffer.concat([tarHeader("manifest.yaml", 100), Buffer.from("truncated")])),
    );

    await expect(extractPackageArchive(archivePath)).rejects.toThrow();

    await expect(listPackageTempDirs(`nd-gen-skills-package-${archiveName}-`)).resolves.toEqual([]);
  });
});

async function writeRegistryIndex(root: string, content: string): Promise<void> {
  await writeFile(path.join(root, "index.yaml"), content);
}

async function listPackageTempDirs(prefix = "nd-gen-skills-package-"): Promise<string[]> {
  return (await readdir(tmpdir())).filter((entry) => entry.startsWith(prefix)).sort();
}

function tarHeader(name: string, size: number): Buffer {
  const header = Buffer.alloc(512, 0);
  header.write(name, 0, 100, "utf8");
  header.write("0000644\0", 100, 8);
  header.write("0000000\0", 108, 8);
  header.write("0000000\0", 116, 8);
  header.write(`${size.toString(8).padStart(11, "0")}\0`, 124, 12);
  header.write("00000000000\0", 136, 12);
  header.fill(" ", 148, 156);
  header.write("0", 156, 1);
  header.write("ustar\0", 257, 6);
  header.write("00", 263, 2);

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  header.write(`${checksum.toString(8).padStart(6, "0")}\0 `, 148, 8);

  return header;
}
