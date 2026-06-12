import { parseArgs } from "./args.js";
import { consoleOutput, type Output } from "./output.js";
import { addSkillCommand } from "../commands/add-skill.js";
import { installCommand } from "../commands/install.js";
import { listCommand } from "../commands/list.js";
import { removeSkillCommand } from "../commands/remove-skill.js";
import { syncCommand } from "../commands/sync.js";
import { validateCommand } from "../commands/validate.js";

export async function main(argv: string[], output: Output = consoleOutput): Promise<number> {
  try {
    const parsed = parseArgs(argv);
    if (parsed.command === "install") {
      await installCommand({ ...parsed, root: process.cwd() });
      output.info(`Installed Nexi AI Skills variant ${parsed.variant} for ${parsed.tool}.`);
      output.info(runtimeNextSteps());
      return 0;
    }

    if (parsed.command === "sync") {
      await syncCommand({ ...parsed, root: process.cwd() });
      output.info(`Synced Nexi AI Skills for ${parsed.tool}.`);
      output.info(runtimeNextSteps());
      return 0;
    }

    if (parsed.command === "add-skill") {
      await addSkillCommand({ ...parsed, root: process.cwd() });
      output.info(`Installed utility skill ${parsed.skill} for ${parsed.tool}.`);
      output.info(utilityNextSteps());
      return 0;
    }

    if (parsed.command === "remove-skill") {
      await removeSkillCommand({ ...parsed, root: process.cwd() });
      output.info(`Removed utility skill ${parsed.skill} for ${parsed.tool}.`);
      output.info(utilityNextSteps());
      return 0;
    }

    if (parsed.command === "list") {
      const result = await listCommand({ ...parsed, root: process.cwd() });
      output.info(result.lines.join("\n"));
      return 0;
    }

    if (parsed.command === "validate") {
      const result = await validateCommand({ ...parsed, root: process.cwd() });
      for (const warning of result.warnings) {
        output.warn(warning);
      }
      if (result.errors.length > 0) {
        output.error(result.errors.join("\n"));
        return 1;
      }
      output.info(result.valid ? "Validation passed." : "Validation completed with warnings.");
      return 0;
    }

    return 0;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runtimeNextSteps(): string {
  return [
    "Next:",
    "- Read AGENTS.md for the managed workflow entry point.",
    "- Start from the runtime skill listed there.",
    "- VCS write actions require explicit user approval.",
  ].join("\n");
}

function utilityNextSteps(): string {
  return [
    "Next:",
    "- Read AGENTS.md for repository-level managed instructions.",
    "- Use installed utility skills only when the current workflow calls for them.",
    "- VCS write actions require explicit user approval.",
  ].join("\n");
}
