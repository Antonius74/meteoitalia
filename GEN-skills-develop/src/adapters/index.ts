import type { ToolName } from "../domain/types.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import type { ToolAdapter } from "./tool-adapter.js";

export { claudeAdapter } from "./claude.js";
export { codexAdapter } from "./codex.js";
export type { ToolAdapter } from "./tool-adapter.js";

export function getToolAdapter(tool: ToolName): ToolAdapter {
  switch (tool) {
    case "codex":
      return codexAdapter;
    case "claude":
      return claudeAdapter;
  }
}
