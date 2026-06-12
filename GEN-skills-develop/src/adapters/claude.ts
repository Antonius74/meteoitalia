import path from "node:path";
import type { ToolAdapter } from "./tool-adapter.js";

const skillsRoot = path.join(".claude", "skills");

export const claudeAdapter: ToolAdapter = {
  tool: "claude",
  skillsRoot,
  lockfilePath: path.join(".claude", "nd-gen-skills.lock.yaml"),
  skillDir(skillName: string): string {
    return path.join(skillsRoot, skillName);
  },
};
