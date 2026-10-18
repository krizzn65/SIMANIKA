import "server-only";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const reply = (message, status) => Response.json({ message }, { status, headers });

export async function passwordRecovery(request, action) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") && request.headers.get("origin") !== origin) return reply("Permintaan tidak diizinkan.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site") return reply("Permintaan tidak diizinkan.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("Format permintaan tidak valid.", 415);
  if (Number(request.headers.get("content-length")) > 4096) return reply("Data terlalu besar.", 413);

  let data;
  try {
    if (!request.body) return reply("Data belum diisi.", 400);
    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return reply("Data terlalu besar.", 413);
      }
      chunks.push(value);
    }
    const raw = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
    data = JSON.parse(new TextDecoder().decode(raw));
  } catch { return reply("Data tidak valid.", 400); }

  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply("Masukkan alamat email yang valid.", 400);

  let payload = { email };
  if (action === "reset") {
    const token = typeof data?.token === "string" ? data.token : "";
    const password = typeof data?.password === "string" ? data.password : "";
    if (!token || token.length > 512) return reply("Tautan reset tidak valid. Minta tautan baru.", 400);
    if (password.length < 8 || password.length > 1024) return reply("Password baru harus terdiri dari 8 sampai 1024 karakter.", 400);
    payload = { token, email, password, password_confirmation: password };
  }

  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  if (!base) return reply("Layanan pemulihan sandi belum tersedia. Coba lagi nanti.", 503);

  try {
    const endpoint = action === "reset" ? "reset-password" : "forgot-password";
    const upstream = await fetch(`${base.replace(/\/+$/, "")}/auth/${endpoint}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (upstream.ok) return reply(action === "reset" ? "Kata sandi berhasil diperbarui." : "Jika email terdaftar, tautan reset akan dikirim.", 200);
    if (upstream.status === 429) return reply("Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", 429);
    if (action === "reset" && [400, 404, 410, 422].includes(upstream.status)) return reply("Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.", 422);
    return reply("Layanan pemulihan sandi sedang bermasalah. Coba lagi nanti.", 503);
  } catch { return reply("Layanan pemulihan sandi tidak dapat dihubungi. Coba lagi nanti.", 503); }
}
