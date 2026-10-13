import "server-only";
import { normalizeOprec } from "@/lib/oprec";

export async function getOprec() {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  if (!base) return null;
  const response = await fetch(`${base.replace(/\/+$/, "")}/public/oprec`, {
    headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Unable to load public OPREC");
  const body = await response.json();
  if (!body || !Object.hasOwn(body, "data")) throw new Error("Invalid OPREC response");
  return normalizeOprec(body.data);
}
