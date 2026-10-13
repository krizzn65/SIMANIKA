"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  ShoppingBag,
  Settings,
  LogOut,
  Globe,
  ChevronDown,
  ClipboardList,
  FilePenLine,
  ClipboardCheck,
  Megaphone,
  ScrollText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import "./admin.css";
import { adminHome, canAccessAdminPath, ROLE_LABELS } from "@/lib/roleAccess";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Kelola User",
    href: "/admin/users",
    icon: <Users className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Kelola Event",
    href: "/admin/events",
    icon: <Calendar className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Kelola OPREC",
    href: "/admin/oprec",
    icon: <UserCheck className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Merchandise",
    href: "/admin/merchandise",
    icon: <ShoppingBag className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Log Sistem",
    href: "/admin/logs",
    icon: <ScrollText className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Pengaturan",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5 flex-shrink-0" />,
  },
];

const isOprecRegistrationRoute = (pathname) => pathname === "/admin/oprec" || /^\/admin\/oprec\/[^/]+\/edit$/.test(pathname);
const isOprecWrittenTestRoute = (pathname) => pathname === "/admin/oprec/test" || pathname.startsWith("/admin/oprec/test/");
const isOprecAssessmentRoute = (pathname) => pathname === "/admin/oprec/penilaian" || pathname.startsWith("/admin/oprec/penilaian/");

const isOprecAnnouncementRoute = (pathname) => pathname === "/admin/oprec/pengumuman" || pathname.startsWith("/admin/oprec/pengumuman/");

function adminBreadcrumb(pathname) {
  if (pathname === "/admin") return "Dashboard";
  if (isOprecWrittenTestRoute(pathname)) return "Kelola OPREC > Tes Tulis";
  if (isOprecAssessmentRoute(pathname)) return "Kelola OPREC > Penilaian";
  if (isOprecAnnouncementRoute(pathname)) return "Kelola OPREC > Pengumuman";
  if (pathname === "/admin/oprec") return "Kelola OPREC > Pendaftaran";
  if (isOprecRegistrationRoute(pathname) && pathname !== "/admin/oprec") return "Kelola OPREC > Edit Formulir";
  if (/^\/admin\/events\/[^/]+$/.test(pathname)) return "Kelola Event > Formulir Event";
  const labels = {
    users: "Kelola User",
    events: "Kelola Event",
    oprec: "Kelola OPREC",
    merchandise: "Merchandise",
    logs: "Log Sistem",
    settings: "Pengaturan",
  };
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  return labels[segment] || "Admin";
}

function AdminSidebarNav({ pathname, displayName, user, handleLogout }) {
  // Mobile drawer must show labels and OPREC subpages; desktop stays collapsed
  // when its own hover state is closed, even after a viewport resize.
  const { open, mobileOpen, setMobileOpen } = useSidebar();
  const expanded = open || (mobileOpen && typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const [oprecMenuOpen, setOprecMenuOpen] = useState(pathname.startsWith("/admin/oprec"));

  useEffect(() => {
    if (pathname.startsWith("/admin/oprec")) setOprecMenuOpen(true);
  }, [pathname]);

  return (
    <SidebarBody className="justify-between gap-6">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo Header */}
        <div className="py-2 flex items-center justify-start">
          <Link
            href={adminHome(user?.role)}
            className="flex items-center gap-3 px-1 relative z-20 group min-w-0"
            title="SIMANIKA Admin Console"
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logos/Logo-MIF-2020-nav.webp"
                alt="Logo Himanika MIF"
                width={40}
                height={40}
                className="w-full h-full object-contain drop-shadow"
                priority
              />
            </div>
            <motion.div
              animate={{
                display: open ? "flex" : "none",
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.18 }}
              className="flex-col whitespace-pre min-w-0"
            >
              <span className="font-extrabold text-white tracking-tight text-base leading-none">SIMANIKA</span>
              <span className="text-[10px] uppercase tracking-widest text-blue-100 font-semibold mt-1">ADMIN CONSOLE</span>
            </motion.div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 flex flex-col gap-1.5">
          {adminLinks.filter((link) => canAccessAdminPath(user?.role, link.href)).map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Fragment key={link.href}>
                {link.href !== "/admin/oprec" && <SidebarLink link={link} active={isActive} />}
                {link.href === "/admin/oprec" && canAccessAdminPath(user?.role, "/admin/oprec") && (
                  <div>
                    {expanded ? (
                      <button
                        type="button"
                        className={`admin-nav-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-50/90 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white`}
                        aria-expanded={oprecMenuOpen}
                        aria-controls="admin-oprec-submenu"
                        onClick={() => setOprecMenuOpen((value) => !value)}
                      >
                        <UserCheck className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1 text-left">Kelola OPREC</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${oprecMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    ) : (
                      <SidebarLink link={{ label: "Kelola OPREC", href: "/admin/oprec", icon: <UserCheck className="h-5 w-5 flex-shrink-0" /> }} active={pathname.startsWith("/admin/oprec")} />
                    )}
                    {expanded && oprecMenuOpen && (
                      <div id="admin-oprec-submenu" className="ml-5 mt-1 flex flex-col gap-1 border-l border-white/25 pl-3">
                        <Link href="/admin/oprec" onClick={() => setMobileOpen(false)} aria-current={isOprecRegistrationRoute(pathname) ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${isOprecRegistrationRoute(pathname) ? "bg-white font-semibold text-[#155eef]" : "text-blue-50 hover:bg-white/15"}`}><FilePenLine className="h-4 w-4" aria-hidden="true" /> Pendaftaran</Link>
                        <Link href="/admin/oprec/test" onClick={() => setMobileOpen(false)} aria-current={isOprecWrittenTestRoute(pathname) ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${isOprecWrittenTestRoute(pathname) ? "bg-white font-semibold text-[#155eef]" : "text-blue-50 hover:bg-white/15"}`}><ClipboardList className="h-4 w-4" aria-hidden="true" />Tes Tulis</Link>
                        <Link href="/admin/oprec/penilaian" onClick={() => setMobileOpen(false)} aria-current={isOprecAssessmentRoute(pathname) ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${isOprecAssessmentRoute(pathname) ? "bg-white font-semibold text-[#155eef]" : "text-blue-50 hover:bg-white/15"}`}><ClipboardCheck className="h-4 w-4" aria-hidden="true" />Penilaian</Link>
                        <Link href="/admin/oprec/pengumuman" onClick={() => setMobileOpen(false)} aria-current={isOprecAnnouncementRoute(pathname) ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${isOprecAnnouncementRoute(pathname) ? "bg-white font-semibold text-[#155eef]" : "text-blue-50 hover:bg-white/15"}`}><Megaphone className="h-4 w-4" aria-hidden="true" />Pengumuman</Link>
                      </div>
                    )}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Admin Profile & Logout Footer */}
      <div className="border-t border-white/20 pt-4 flex flex-col gap-2.5">
        <div className={`flex items-center py-1 rounded-xl ${expanded ? "gap-3 px-1" : "justify-center px-0"}`}>
          <div className="w-9 h-9 min-w-[2.25rem] min-h-[2.25rem] rounded-full overflow-hidden border-2 border-white/40 shadow-sm flex-shrink-0">
            <UserAvatar
              src={user?.fotoProfil}
              name={displayName}
              email={user?.email}
              size="100%"
              borderRadius="50%"
              fontSize="0.85rem"
            />
          </div>
          {expanded && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate">{displayName}</span>
              <span className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">{ROLE_LABELS[user?.role] || "Pengguna"}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center group/sidebar py-2.5 rounded-xl transition-all duration-150 text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border border-red-400/25 cursor-pointer ${expanded ? "justify-start gap-3 px-3" : "justify-center px-0"}`}
          title="Keluar Akun"
        >
          <div className="flex-shrink-0 transition-transform duration-150 group-hover/sidebar:scale-110 text-red-300 group-hover/sidebar:text-white">
            <LogOut className="h-5 w-5 flex-shrink-0" />
          </div>
          {expanded && <span className="text-sm font-semibold whitespace-pre inline-block !p-0 !m-0 tracking-tight">Keluar Akun</span>}
        </button>
      </div>
    </SidebarBody>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const displayName = user?.nama || user?.name || user?.email?.split("@")[0] || "Admin";

  return (
    <AdminRoute>
      <div className="admin-layout-root">
        <Sidebar animate={true}>
          <AdminSidebarNav
            pathname={pathname}
            displayName={displayName}
            user={user}
            handleLogout={handleLogout}
          />
        </Sidebar>

        {/* Main Content Area */}
        <div className="admin-main-wrapper">
          <header className="admin-topbar">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-mono text-blue-600 font-semibold">SIMANIKA</span>
              <span aria-hidden="true">&gt;</span>
              <span className="text-slate-800 font-semibold capitalize">
                {adminBreadcrumb(pathname)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="admin-btn admin-btn--secondary admin-btn--sm"
                title="Ke Website Utama"
                prefetch={true}
              >
                <Globe aria-hidden="true" className="w-4 h-4 text-blue-600" />
                <span>Lihat Website</span>
              </Link>
            </div>
          </header>

          <main className={`admin-content-stage${isOprecAssessmentRoute(pathname) ? " admin-content-stage--assessment" : ""}`}>
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </AdminRoute>
  );
}
