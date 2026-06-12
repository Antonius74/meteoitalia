import type { ToolName } from "../domain/types.js";

export interface ToolAdapter {
  tool: ToolName;
  skillsRoot: string;
  lockfilePath: string;
  skillDir(skillName: string): string;
}
