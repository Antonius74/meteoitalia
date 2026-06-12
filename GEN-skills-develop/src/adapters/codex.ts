import path from "node:path";
import type { ToolAdapter } from "./tool-adapter.js";

const skillsRoot = path.join(".agents", "skills");

export const codexAdapter: ToolAdapter = {
  tool: "codex",
  skillsRoot,
  lockfilePath: path.join(".agents", "nd-gen-skills.lock.yaml"),
  skillDir(skillName: string): string {
    return path.join(skillsRoot, skillName);
  },
};
