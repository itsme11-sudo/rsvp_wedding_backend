import { createHash } from "node:crypto";

export function normalizeCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

export function hashCode(code) {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}
