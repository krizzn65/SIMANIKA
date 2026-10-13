export const STAFF_ROLES = ["super_admin", "admin", "leader", "kwu"];

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  leader: "Pengurus",
  kwu: "KWU",
  user: "User",
};

export function adminHome(role) {
  if (role === "leader") return "/admin/oprec";
  if (role === "kwu") return "/admin/merchandise";
  return "/admin";
}

export function canAccessAdminPath(role, pathname) {
  if (!STAFF_ROLES.includes(role) || !pathname?.startsWith("/admin")) return false;
  const segment = pathname.split("/")[2] || "";
  if (role === "super_admin") return ["", "users", "events", "oprec", "merchandise", "settings"].includes(segment);
  if (role === "admin") return ["", "events", "oprec", "merchandise", "settings"].includes(segment);
  if (role === "leader") return ["/admin/oprec", "/admin/oprec/test", "/admin/oprec/penilaian", "/admin/oprec/pengumuman"].includes(pathname.replace(/\/$/, ""));
  return segment === "merchandise";
}
