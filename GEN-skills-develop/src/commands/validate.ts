import type { ToolName } from "../domain/types.js";
import { validateInstallation, type ValidateInstallationResult } from "../installer/validate.js";
import { commandRoot } from "./install-support.js";

export interface ValidateCommandOptions {
  root?: string;
  tool: ToolName;
  ci?: boolean;
  registry?: string;
}

export async function validateCommand(options: ValidateCommandOptions): Promise<ValidateInstallationResult> {
  const result = await validateInstallation({
    root: commandRoot(options.root),
    tool: options.tool,
    registry: options.registry,
  });

  if (options.ci) {
    const failure = result.errors[0] ?? result.warnings[0];
    if (failure) {
      throw new Error(failure);
    }
  }

  return result;
}
