const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function baseUrl() {
  if (!apiBase) throw new Error("Layanan akun belum dikonfigurasi. Hubungi pengelola situs.");
  return apiBase;
}

function csrfToken() {
  const part = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("XSRF-TOKEN="));
  return part ? decodeURIComponent(part.slice("XSRF-TOKEN=".length)) : "";
}

async function initCsrf() {
  const origin = baseUrl().replace(/\/api$/, "");
  const response = await fetch(`${origin}/sanctum/csrf-cookie`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error("Sesi belum bisa disiapkan. Coba lagi sebentar.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(csrfToken() ? { "X-XSRF-TOKEN": csrfToken() } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = Object.values(body.errors || {}).flat().find((message) => typeof message === "string");
    throw new Error(firstError || body.message || (response.status === 419 ? "Sesi kedaluwarsa. Muat ulang halaman dan coba lagi." : "Permintaan belum bisa diproses."));
  }
  return body;
}

export async function login(email, password, remember = false) {
  await initCsrf();
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
}

export async function register(email, password) {
  await initCsrf();
  return request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function currentUser() { return request("/auth/me"); }

export async function logout() {
  await initCsrf();
  return request("/auth/logout", { method: "POST", body: "{}" });
}
