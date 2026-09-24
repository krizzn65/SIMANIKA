const safeMessage = (value) => typeof value === "string" && value.length <= 300
  && !/(SQLSTATE|\bSQL:|\bselect\b|\bupdate\b|\bConnection:|stack trace|exception)/i.test(value);

export function apiErrorMessage(error) {
  const status = error.response?.status;
  const body = error.response?.data;
  const first = body?.errors && typeof body.errors === "object"
    ? Object.values(body.errors).flat().find((value) => typeof value === "string")
    : null;

  if (status === 419) return "Sesi kedaluwarsa. Muat ulang halaman dan coba lagi.";
  if (status === 401) return "Sesi berakhir. Masuk kembali untuk melanjutkan.";
  if (status === 403) return "Akses ditolak. Akun ini tidak memiliki izin untuk tindakan tersebut.";
  if (status === 404) return "Data tidak ditemukan. Muat ulang halaman dan coba lagi.";
  if (status === 422) return safeMessage(first) ? first : safeMessage(body?.message)
    ? body.message : "Data belum valid. Periksa kolom formulir dan coba lagi.";
  if (status === 409 && safeMessage(body?.message)) return body.message;
  if (status === 413) return "Berkas terlalu besar. Periksa batas ukuran unggahan.";
  if (status === 429) return "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.";
  if (!error.response) return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";
  return "Layanan sedang bermasalah. Data belum tersimpan; coba lagi nanti atau hubungi pengelola.";
}
