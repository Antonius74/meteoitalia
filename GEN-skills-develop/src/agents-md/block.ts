const START = "<!-- nd-gen-skills:start -->";
const END = "<!-- nd-gen-skills:end -->";

export interface AgentsBlockInput {
  variant?: string;
  runtimeSkill?: string;
  utilities: Array<{ name: string; description: string }>;
}

export function renderAgentsBlock(input: AgentsBlockInput): string {
  const lines = [START, "## Nexi AI Skills", ""];

  if (input.runtimeSkill && input.variant) {
    lines.push(
      "Runtime entry point:",
      `- Start with \`${input.runtimeSkill}\` for implementation, debugging, testing, review, and maintenance.`,
      "",
      "Skill composition:",
      "- The runtime skill is the repository-level entry point.",
      "- Provider skills guide workflow phases.",
      "- Utility skills add focused capabilities.",
      "- Repository instructions and this managed block override provider instructions when they conflict.",
      "",
    );
  } else {
    lines.push(
      "This repository uses Nexi AI Skills utility packages.",
      "",
      "Skill composition:",
      "- Utility skills add focused capabilities.",
      "- Repository instructions and this managed block override installed skill instructions when they conflict.",
      "",
    );
  }

  lines.push(
    "Human VCS Gate:",
    "- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.",
    "- Read-only Git inspection is allowed.",
    "- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.",
    "",
  );

  lines.push(END);
  return `${lines.join("\n")}\n`;
}

export function upsertAgentsBlock(existing: string | undefined, block: string): string {
  if (!existing || existing.trim().length === 0) {
    return block;
  }

  const startIndex = existing.indexOf(START);
  const endIndex = existing.indexOf(END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return `${existing.replace(/\s*$/, "")}\n\n${block}`;
  }

  return `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + END.length).replace(/^\n?/, "")}`;
}
