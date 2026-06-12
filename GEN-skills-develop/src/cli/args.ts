export type ToolName = "codex" | "claude";

export type CommandName = "install" | "sync" | "add-skill" | "remove-skill" | "list" | "validate";

export type ParsedArgs =
  | {
      command: "install";
      tool: ToolName;
      variant: string;
      provider?: string;
      replaceVariant: boolean;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "sync" | "validate";
      tool: ToolName;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "add-skill" | "remove-skill";
      tool: ToolName;
      skill: string;
      force: boolean;
      ci: boolean;
      registry?: string;
    }
  | {
      command: "list";
      tool: ToolName;
      available: boolean;
      registry?: string;
    };

export interface ParseArgsOptions {
  env?: NodeJS.ProcessEnv;
}

function requiredValueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}

function has(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function parseTool(args: string[]): ToolName {
  const tool = requiredValueAfter(args, "--tool") ?? "codex";
  if (tool !== "codex" && tool !== "claude") {
    throw new Error(`Unsupported tool: ${tool}. Supported tools: codex, claude`);
  }
  return tool;
}

export function parseArgs(args: string[], options: ParseArgsOptions = {}): ParsedArgs {
  const command = args[0] as CommandName | undefined;
  const tool = parseTool(args);
  const env = options.env ?? process.env;
  const registry = requiredValueAfter(args, "--registry");
  const provider = requiredValueAfter(args, "--provider");
  const force = has(args, "--force");
  const ci = has(args, "--ci") || env.CI === "true";

  if (command === "install") {
    const variant = requiredValueAfter(args, "--variant");
    if (!variant) {
      throw new Error(
        "Missing required --variant.\nExample: npx -y @nexidigital/nd-gen-skills install --variant frontend-react",
      );
    }
    return {
      command,
      tool,
      variant,
      provider,
      replaceVariant: has(args, "--replace-variant"),
      force,
      ci,
      registry,
    };
  }

  if (command === "sync" || command === "validate") {
    return { command, tool, force, ci, registry };
  }

  if (command === "add-skill" || command === "remove-skill") {
    const skill = args[1];
    if (!skill || skill.startsWith("-")) {
      throw new Error(`Missing required utility skill name for ${command}.`);
    }
    return { command, tool, skill, force, ci, registry };
  }

  if (command === "list") {
    return { command, tool, available: has(args, "--available"), registry };
  }

  throw new Error("Unknown command. Supported commands: install, sync, add-skill, remove-skill, list, validate");
}
