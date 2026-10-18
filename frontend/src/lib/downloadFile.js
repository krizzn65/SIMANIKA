import { api } from "@/services/api";

const API_PREFIX = "/api";

// Berkas OPREC dilindungi sesi Sanctum. Navigasi <a> biasa tidak dianggap
// stateful (tanpa header XHR/Referer), sehingga endpoint mengembalikan 401.
// Unduhan harus melalui klien API yang menyertakan sesi, lalu diubah ke blob.
function fileNameFromHeaders(headers) {
  const value = headers?.["content-disposition"] || "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(value);
  if (!match) return "";
  return match[1].trim().replace(/^"|"$/g, "");
}

export function downloadErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 401) return "Sesi berakhir. Masuk kembali untuk mengunduh berkas.";
  if (status === 403) return "Akun ini tidak memiliki izin mengunduh berkas.";
  if (status === 404) return "Berkas tidak ditemukan. Perbarui daftar lalu coba lagi.";
  return error?.message || "Berkas gagal diunduh. Coba lagi atau hubungi pengelola.";
}

export async function downloadAuthenticatedFile(downloadUrl, fileName) {
  const path = new URL(downloadUrl, window.location.origin).pathname;
  if (path !== API_PREFIX && !path.startsWith(`${API_PREFIX}/`)) throw new Error("Tautan berkas tidak valid.");
  const response = await api.get(path.slice(API_PREFIX.length), { responseType: "blob", timeout: 60000 });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || fileNameFromHeaders(response.headers) || "berkas-oprec";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
