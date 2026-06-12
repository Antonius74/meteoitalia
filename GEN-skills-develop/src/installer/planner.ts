import type { Lockfile } from "../schemas/lockfile.js";

export function planInstall(input: {
  desiredVariant: string;
  replaceVariant: boolean;
  existingLockfile?: Lockfile;
}): void {
  const installed = input.existingLockfile?.variant?.name;

  if (installed && installed !== input.desiredVariant && !input.replaceVariant) {
    throw new Error(
      `A different variant is already installed: ${installed}. Use --replace-variant to install ${input.desiredVariant}.`,
    );
  }
}
