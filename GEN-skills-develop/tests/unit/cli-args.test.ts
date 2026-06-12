import { describe, expect, it } from "vitest";
import { parseArgs } from "../../src/cli/args.js";

describe("parseArgs", () => {
  it("defaults install to codex and captures variant", () => {
    expect(parseArgs(["install", "--variant", "frontend-react"], { env: {} })).toEqual({
      command: "install",
      tool: "codex",
      variant: "frontend-react",
      provider: undefined,
      replaceVariant: false,
      force: false,
      ci: false,
      registry: undefined,
    });
  });

  it("captures install provider when provided", () => {
    expect(parseArgs(["install", "--variant", "frontend-react", "--provider", "workflow-stack"], { env: {} })).toEqual({
      command: "install",
      tool: "codex",
      variant: "frontend-react",
      provider: "workflow-stack",
      replaceVariant: false,
      force: false,
      ci: false,
      registry: undefined,
    });
  });

  it("fails bare install with the required example", () => {
    expect(() => parseArgs(["install"])).toThrow(
      "Missing required --variant.\nExample: npx -y @nexidigital/nd-gen-skills install --variant frontend-react",
    );
  });

  it("rejects unsupported tools clearly", () => {
    expect(() => parseArgs(["install", "--tool", "cursor", "--variant", "frontend-react"])).toThrow(
      "Unsupported tool: cursor. Supported tools: codex, claude",
    );
  });

  it("uses injected CI environment deterministically", () => {
    expect(parseArgs(["install", "--variant", "frontend-react"], { env: { CI: "true" } })).toMatchObject({
      ci: true,
    });

    expect(parseArgs(["install", "--variant", "frontend-react"], { env: {} })).toMatchObject({
      ci: false,
    });
  });

  it("rejects variant when the next token is another flag", () => {
    expect(() => parseArgs(["install", "--variant", "--tool", "claude"])).toThrow("Missing value for --variant.");
  });

  it("rejects variant when no value follows the flag", () => {
    expect(() => parseArgs(["install", "--variant"])).toThrow("Missing value for --variant.");
  });

  it("rejects tool when the next token is another flag", () => {
    expect(() => parseArgs(["install", "--tool", "--variant", "frontend-react"])).toThrow(
      "Missing value for --tool.",
    );
  });

  it("rejects tool when no value follows the flag", () => {
    expect(() => parseArgs(["install", "--tool"])).toThrow("Missing value for --tool.");
  });
});
