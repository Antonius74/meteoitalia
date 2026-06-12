import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve("packages/utility/markitdown/skill/scripts/convert_markitdown.py");

let pythonExecutable: string | undefined;

beforeAll(async () => {
  pythonExecutable = await resolvePythonExecutable();
});

describe("convert_markitdown.py", () => {
  it("reports missing MarkItDown dependency without installing packages", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-missing-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    await writeFile(input, "hello", "utf8");

    await expect(
      runHelperWithBlockedMarkItDownImport(python, root, [input, "--output-dir", outputDir]),
    ).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('python -m pip install "markitdown[all]"'),
    });
  });

  it("rejects remote inputs unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-remote-"));
    const outputDir = path.join(root, "out");

    await expect(
      runHelper(python, ["https://example.com/file.pdf", "--output-dir", outputDir]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Remote input requires --allow-remote"),
    });
    await expect(access(outputDir)).rejects.toThrow();
  });

  it("rejects remote archives unless archive conversion is explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-remote-archive-"));
    const outputDir = path.join(root, "out");

    await expect(
      runHelperWithBlockedMarkItDownImport(python, root, [
        "https://example.com/bundle.zip",
        "--output-dir",
        outputDir,
        "--allow-remote",
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Archive input requires --allow-archives"),
    });
    await expect(access(outputDir)).rejects.toThrow();
  });

  it("rejects archives unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-archive-"));
    const input = path.join(root, "bundle.zip");
    const outputDir = path.join(root, "out");
    await writeFile(input, "not a real zip", "utf8");

    await expect(runHelper(python, [input, "--output-dir", outputDir])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Archive input requires --allow-archives"),
    });
    await expect(access(outputDir)).rejects.toThrow();
  });

  it("rejects duplicate output paths using case-insensitive comparison", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-case-collision-"));
    const upperDir = path.join(root, "upper");
    const lowerDir = path.join(root, "lower");
    const upperInput = path.join(upperDir, "Input.txt");
    const lowerInput = path.join(lowerDir, "input.txt");
    const outputDir = path.join(root, "out");
    await mkdir(upperDir);
    await mkdir(lowerDir);
    await writeFile(upperInput, "hello", "utf8");
    await writeFile(lowerInput, "hello", "utf8");

    await expect(
      runHelperWithStub(python, root, [upperInput, lowerInput, "--output-dir", outputDir]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Duplicate output path"),
    });
    await expect(access(outputDir)).rejects.toThrow();
  });

  it("refuses to overwrite existing output unless explicitly allowed", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-overwrite-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    const output = path.join(outputDir, "input.md");
    await mkdir(outputDir);
    await writeFile(input, "hello", "utf8");
    await writeFile(output, "existing", "utf8");

    await expect(runHelperWithStub(python, root, [input, "--output-dir", outputDir])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Output already exists"),
    });
  });

  it("converts a local file with a stubbed MarkItDown module and emits JSON", async () => {
    const python = requirePython();
    const root = await mkdtemp(path.join(tmpdir(), "markitdown-helper-success-"));
    const input = path.join(root, "input.txt");
    const outputDir = path.join(root, "out");
    await writeFile(input, "hello", "utf8");

    const { stdout } = await runHelperWithStub(python, root, [input, "--output-dir", outputDir, "--json"]);

    const summary = JSON.parse(stdout) as {
      converted: Array<{ input: string; output: string }>;
      failed: Array<{ input: string; error: string }>;
      skipped: string[];
    };
    expect(summary.converted).toEqual([{ input, output: path.join(outputDir, "input.md") }]);
    expect(summary.failed).toEqual([]);
    expect(summary.skipped).toEqual([]);
    await expect(readFile(path.join(outputDir, "input.md"), "utf8")).resolves.toBe(
      `converted:${input}\n`,
    );
  });
});

function requirePython(): string {
  if (pythonExecutable === undefined) {
    throw new Error("Python executable not found. Set PYTHON to run MarkItDown helper tests.");
  }
  return pythonExecutable;
}

async function resolvePythonExecutable(): Promise<string | undefined> {
  const candidates = [process.env.PYTHON, "python3", "python"].filter((candidate): candidate is string =>
    Boolean(candidate),
  );

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ["--version"]);
      return candidate;
    } catch {
      continue;
    }
  }

  return undefined;
}

function runHelper(python: string, args: string[]) {
  return execFileAsync(python, [scriptPath, ...args], {
    env: { ...process.env },
  });
}

async function runHelperWithBlockedMarkItDownImport(python: string, root: string, args: string[]) {
  const hookRoot = path.join(root, "python-startup-hook");
  await mkdir(hookRoot);
  await writeFile(
    path.join(hookRoot, "sitecustomize.py"),
    [
      "import importlib.abc",
      "import sys",
      "",
      "class BlockMarkItDown(importlib.abc.MetaPathFinder):",
      "    def find_spec(self, fullname, path=None, target=None):",
      "        if fullname == 'markitdown' or fullname.startswith('markitdown.'):",
      "            raise ModuleNotFoundError(\"No module named 'markitdown'\")",
      "        return None",
      "",
      "sys.meta_path.insert(0, BlockMarkItDown())",
      "",
    ].join("\n"),
    "utf8",
  );

  return execFileAsync(python, [scriptPath, ...args], {
    env: { ...process.env, PYTHONPATH: hookRoot, PYTHONNOUSERSITE: "1" },
  });
}

async function runHelperWithStub(python: string, root: string, args: string[]) {
  const stubRoot = path.join(root, "stub");
  const moduleRoot = path.join(stubRoot, "markitdown");
  await mkdir(moduleRoot, { recursive: true });
  await writeFile(
    path.join(moduleRoot, "__init__.py"),
    [
      "class Result:",
      "    def __init__(self, text_content):",
      "        self.text_content = text_content",
      "",
      "class MarkItDown:",
      "    def convert_local(self, source):",
      "        return Result(f'converted:{source}')",
      "",
    ].join("\n"),
    "utf8",
  );

  return execFileAsync(python, [scriptPath, ...args], {
    env: { ...process.env, PYTHONPATH: stubRoot, PYTHONNOUSERSITE: "1" },
  });
}
