import "server-only";
import { getOprec } from "./oprecService";
import { oprecState, validBirthDate, validateOprecForm } from "@/lib/oprec";

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const reply = (body, status = 200) => Response.json(body, { status, headers });
class RequestError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function readBody(request, limit) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new RequestError("Permintaan tidak diizinkan.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new RequestError("Permintaan tidak diizinkan.", 403);
  if (Number(request.headers.get("content-length")) > limit) throw new RequestError("Ukuran data terlalu besar.", 413);
  if (!request.body) throw new RequestError("Data belum diisi.", 400);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RequestError("Ukuran data terlalu besar.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") || "application/octet-stream" } });
}

async function forward(oprec, action, body, request) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new RequestError("Layanan belum tersedia. Coba lagi nanti.", 503);
  const authHeaders = {};
  if (action === "register") {
    const cookie = request.headers.get("cookie") || "";
    if (cookie) authHeaders.Cookie = cookie;
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("XSRF-TOKEN="));
    if (token) authHeaders["X-XSRF-TOKEN"] = decodeURIComponent(token.slice(11));
    authHeaders.Origin = new URL(request.url).origin;
    authHeaders.Referer = `${new URL(request.url).origin}/oprec`;
  }
  const path = action === "register" ? "/user/oprec/register" : `/public/oprec/${encodeURIComponent(oprec.id)}/result`;
  return fetch(`${base.replace(/\/+$/, "")}${path}`, {
    method: "POST", headers: { Accept: "application/json", ...authHeaders, ...(action === "result" ? { "Content-Type": "application/json" } : {}) },
    body, cache: "no-store", signal: AbortSignal.timeout(15000), redirect: "error",
  });
}

async function upstreamError(response, oprec) {
  if ([401, 419].includes(response.status)) return reply({ message: "Sesi akun belum aktif atau sudah berakhir. Masuk ke akunmu sebelum mengirim pendaftaran." }, 401);
  if (response.status === 429) return reply({ message: "Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi." }, 429);
  if (response.status === 409) return reply({ message: "Data periode atau pendaftaran berubah. Muat ulang halaman sebelum melanjutkan." }, 409);
  if (response.status === 422) {
    const body = await response.json().catch(() => ({}));
    const errors = {};
    for (const field of oprec.formFields) {
      const value = body?.errors?.[field.name];
      const message = Array.isArray(value) ? value[0] : value;
      if (typeof message === "string") errors[field.name] = message.slice(0, 250);
    }
    return reply({ message: "Periksa kembali data yang kamu isi.", errors }, 422);
  }
  return reply({ message: "Layanan belum bisa memproses permintaan. Coba lagi sebentar." }, 503);
}

export async function registerOprec(request) {
  try {
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return reply({ message: "Format permintaan tidak valid." }, 415);
    const bounded = await readBody(request, 12 * 1024 * 1024);
    const form = await bounded.formData().catch(() => { throw new RequestError("Data formulir tidak valid.", 400); });
    const oprec = await getOprec();
    if (!oprec || oprecState(oprec).key !== "open") return reply({ message: "Pendaftaran belum dibuka atau sudah ditutup. Muat ulang untuk melihat status terbaru." }, 409);
    if (form.get("oprec_id") !== oprec.id || form.get("schema_version") !== oprec.schemaVersion) return reply({ message: "Formulir sudah diperbarui. Muat ulang halaman sebelum mengirim." }, 409);
    if (!oprec.formFields.length) return reply({ message: "Formulir belum tersedia." }, 409);
    const errors = validateOprecForm(oprec.formFields, form);
    if (Object.keys(errors).length) return reply({ message: "Periksa kembali formulir pendaftaranmu.", errors }, 422);
    const body = new FormData();
    body.set("schema_version", oprec.schemaVersion);
    body.set("oprec_id", oprec.id);
    for (const field of oprec.formFields) {
      const value = form.get(field.name);
      if (value !== null && !(field.type === "file" && !value.size)) body.set(field.name, typeof value === "string" ? value.trim() : value);
    }
    const response = await forward(oprec, "register", body, request);
    if (!response.ok) return await upstreamError(response, oprec);
    const result = await response.json();
    if (result.data?.submitted !== true) throw new Error("Invalid registration response");
    return reply({ data: { submitted: true }, message: "Pendaftaranmu berhasil diterima. Pantau halaman ini untuk pengumuman hasil seleksi." }, 201);
  } catch (error) {
    return reply({ message: error instanceof RequestError ? error.message : "Pendaftaran belum bisa diproses. Periksa status pendaftaran sebelum mencoba kembali." }, error instanceof RequestError ? error.status : 503);
  }
}

export async function lookupOprecResult(request) {
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ message: "Format permintaan tidak valid." }, 415);
    const bounded = await readBody(request, 4096);
    const body = await bounded.json().catch(() => { throw new RequestError("Data tidak valid.", 400); });
    const nim = typeof body?.nim === "string" ? body.nim.trim() : "";
    if (!/^[a-zA-Z0-9.-]{3,32}$/.test(nim) || !validBirthDate(body?.tanggal_lahir)) return reply({ message: "Periksa NIM dan tanggal lahirmu." }, 422);
    const oprec = await getOprec();
    if (!oprec || oprecState(oprec).key !== "announcement" || body.oprec_id !== oprec.id) return reply({ message: "Pengumuman belum tersedia untuk periode ini." }, 409);
    const response = await forward(oprec, "result", JSON.stringify({ nim, tanggal_lahir: body.tanggal_lahir }));
    if (!response.ok) return await upstreamError(response, oprec);
    const result = await response.json();
    const status = result.data?.status;
    if (!["accepted", "rejected", "pending", "not_found"].includes(status)) throw new Error("Invalid selection result");
    return reply({ data: {
      status,
      divisi: status === "accepted" && typeof result.data.divisi === "string" ? result.data.divisi.slice(0, 150) : "",
      pesan: ["accepted", "rejected", "pending"].includes(status) && typeof result.data.pesan === "string" ? result.data.pesan.slice(0, 1500) : "",
    } });
  } catch (error) {
    return reply({ message: error instanceof RequestError ? error.message : "Hasil belum bisa diperiksa. Coba lagi sebentar." }, error instanceof RequestError ? error.status : 503);
  }
}
