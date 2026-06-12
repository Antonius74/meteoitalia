import { createHash } from "node:crypto";

export function sha256Buffer(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function sha256Text(content: string): string {
  return sha256Buffer(Buffer.from(content, "utf8"));
}
