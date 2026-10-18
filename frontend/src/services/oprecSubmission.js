import "server-only";
import { NextResponse } from "next/server";
import { getOprec } from "./oprecService";
import { OPREC_REQUIRED_CONSENTS, normalizeOprecNim, oprecState, validBirthDate, validateOprecForm, validateOprecConsents, isFieldApplicable } from "@/lib/oprec";

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

async function forwardRegistration(body, request) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  if (!base) throw new RequestError("Layanan belum tersedia. Coba lagi nanti.", 503);
  const authHeaders = {};
  {
    const cookie = request.headers.get("cookie") || "";
    if (cookie) authHeaders.Cookie = cookie;
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("XSRF-TOKEN="));
    if (token) authHeaders["X-XSRF-TOKEN"] = decodeURIComponent(token.slice(11));
    authHeaders.Origin = new URL(request.url).origin;
    authHeaders.Referer = `${new URL(request.url).origin}/oprec`;
  }
  const path = "/user/oprec/register";
  return fetch(`${base.replace(/\/+$/, "")}${path}`, {
    method: "POST", headers: { Accept: "application/json", ...authHeaders },
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
    for (const rank of [1, 2, 3]) {
      const divErr = body?.errors?.[`divisi_pilihan_${rank}`];
      const divMsg = Array.isArray(divErr) ? divErr[0] : divErr;
      if (typeof divMsg === "string") errors[`divisi_pilihan_${rank}`] = divMsg.slice(0, 250);

      const jabErr = body?.errors?.[`jabatan_pilihan_${rank}`];
      const jabMsg = Array.isArray(jabErr) ? jabErr[0] : jabErr;
      if (typeof jabMsg === "string") errors[`jabatan_pilihan_${rank}`] = jabMsg.slice(0, 250);
    }
    if (body?.errors && typeof body.errors === "object") {
      for (const [key, val] of Object.entries(body.errors)) {
        if (!errors[key]) {
          const msg = Array.isArray(val) ? val[0] : val;
          if (typeof msg === "string") errors[key] = msg.slice(0, 250);
        }
      }
    }
    return reply({ message: body?.message || "Periksa kembali data yang kamu isi.", errors }, 422);
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
    if (typeof form.get("nim") === "string") form.set("nim", normalizeOprecNim(form.get("nim")));
    const errors = { ...validateOprecForm(oprec.formFields, form, Date.now(), oprec.divisiTersedia), ...validateOprecConsents(form) };
    if (Object.keys(errors).length) return reply({ message: "Periksa kembali formulir pendaftaranmu.", errors }, 422);
    const body = new FormData();
    body.set("schema_version", oprec.schemaVersion);
    body.set("oprec_id", oprec.id);
    for (const field of oprec.formFields) {
      if (!isFieldApplicable(field, [1, 2, 3].map((rank) => form.get(`divisi_pilihan_${rank}`)), oprec.divisiTersedia)) continue;
      const value = form.get(field.name);
      if (value !== null && !(field.type === "file" && !value.size)) body.set(field.name, typeof value === "string" ? value.trim() : value);
    }
    for (const consent of OPREC_REQUIRED_CONSENTS) body.set(consent.name, form.get(consent.name));
    for (const rank of [1, 2, 3]) {
      const value = form.get(`divisi_pilihan_${rank}`);
      if (value !== null) body.set(`divisi_pilihan_${rank}`, value);
    }
    for (const rank of [1, 2, 3]) {
      const value = form.get(`jabatan_pilihan_${rank}`);
      if (value !== null && value !== "") body.set(`jabatan_pilihan_${rank}`, typeof value === "string" ? value.trim() : value);
    }
    const response = await forwardRegistration(body, request);
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
    const nim = normalizeOprecNim(body?.nim);
    const id = String(body?.oprec_id || "");
    if (!/^\d+$/.test(id) || !/^E31[A-Z0-9.\-]{0,29}$/.test(nim) || !validBirthDate(body?.tanggal_lahir)) return reply({ message: "Periksa NIM dan tanggal lahirmu." }, 422);
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    if (!base) return reply({ message: "Layanan belum tersedia." }, 503);
    const response = await fetch(base.replace(/\/+$/, "") + "/public/oprec/" + id + "/announcement/verify", {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ nim, tanggal_lahir: body.tanggal_lahir }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const messages = { 404: "Data tidak ditemukan. Periksa NIM dan tanggal lahir sesuai pendaftaran.", 409: "Pengumuman belum dibuka. Periksa jadwal kembali.", 422: "Periksa NIM dan tanggal lahirmu.", 429: "Terlalu banyak percobaan. Tunggu satu menit sebelum mencoba lagi." };
      const result = NextResponse.json({ message: messages[response.status] || "Layanan sedang sibuk. Silakan coba lagi." }, { status: messages[response.status] ? response.status : 503, headers });
      if (response.status === 429) result.headers.set("Retry-After", response.headers.get("Retry-After") || "60");
      return result;
    }
    const data = await response.json();
    if (typeof data.ticket !== "string" || data.ticket.length > 4096) throw new Error("Invalid ticket");
    const result = NextResponse.json({ verified: true }, { headers });
    result.cookies.set("oprec_result_" + id, data.ticket, { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/oprec/pengumuman/" + id, maxAge: 1800 });
    return result;
  } catch (error) {
    return reply({ message: error instanceof RequestError ? error.message : "Hasil belum bisa diperiksa. Coba lagi sebentar." }, error instanceof RequestError ? error.status : 503);
  }
}
