const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const validAlbumSlug = (slug) => typeof slug === "string" && SLUG.test(slug);

export function formatAlbumDate(value) {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}

// Drive links are shown as an external button; only Google hosts are allowed.
export function safeDriveUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}
