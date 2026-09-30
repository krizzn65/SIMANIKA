export function countdownParts(milliseconds) {
  const seconds = Number.isFinite(milliseconds) ? Math.max(0, Math.ceil(milliseconds / 1000)) : 0;
  return [[Math.floor(seconds / 86400), "hari"], [Math.floor(seconds / 3600) % 24, "jam"], [Math.floor(seconds / 60) % 60, "menit"], [seconds % 60, "detik"]];
}
export function formatAnnouncementDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Segera diumumkan";
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) + " WIB";
}
export function toWibInput(value) {
  return value ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16) : "";
}
export function fromWibInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Isi tanggal dan jam pengumuman.");
  const parsed = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(parsed.getTime())) throw new Error("Jadwal tidak valid.");
  return parsed.toISOString();
}
