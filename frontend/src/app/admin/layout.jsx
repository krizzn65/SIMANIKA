"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  ChevronDown,
  ClipboardList,
  ListChecks,
  ShoppingBag,
  Settings,
  LogOut,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./admin.css";

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
    label: "Pengaturan",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5 flex-shrink-0" />,
  },
];

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [oprecMenuOpen, setOprecMenuOpen] = useState(true);
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
        <Sidebar open={open} setOpen={setOpen} animate={true}>
          <SidebarBody className="justify-between gap-6">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {/* Logo Header */}
              <div className="py-2 flex items-center justify-start">
                <Link
                  href="/admin"
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
                    className="flex-col whitespace-pre min-w-0"
                  >
                    <span className="font-extrabold text-white tracking-tight text-base leading-none">SIMANIKA</span>
                    <span className="text-[10px] uppercase tracking-widest text-blue-100 font-semibold mt-1">ADMIN CONSOLE</span>
                  </motion.div>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="mt-8 flex flex-col gap-1.5">
                {adminLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                  if (link.href === "/admin/oprec") return <div key={link.href} className="admin-oprec-nav">
                    <button type="button" className={cn("admin-oprec-nav__trigger", isActive && "admin-oprec-nav__trigger--active")}
                      aria-expanded={open && oprecMenuOpen}
                      onClick={() => { setOpen(true); setOprecMenuOpen((value) => !value); }}>
                      <UserCheck aria-hidden="true" className="h-5 w-5 flex-shrink-0" />
                      {open && <><span>Kelola OPREC</span><ChevronDown aria-hidden="true" className={cn("h-4 w-4 ml-auto transition-transform", oprecMenuOpen && "rotate-180")} /></>}
                    </button>
                    {open && oprecMenuOpen && <div className="admin-oprec-nav__submenu">
                      <Link href="/admin/oprec" aria-current={pathname === "/admin/oprec" ? "page" : undefined} onClick={() => { if (window.innerWidth < 768) setOpen(false); }}><ClipboardList aria-hidden="true" className="h-4 w-4" /> Pendaftaran</Link>
                      <Link href="/admin/oprec/test" aria-current={pathname === "/admin/oprec/test" ? "page" : undefined} onClick={() => { if (window.innerWidth < 768) setOpen(false); }}>Tes tulis</Link>
                      <Link href="/admin/oprec/announcement" aria-current={pathname === "/admin/oprec/announcement" ? "page" : undefined} onClick={() => { if (window.innerWidth < 768) setOpen(false); }}>Pengumuman</Link>
                      <Link href="/admin/oprec/answers" aria-current={pathname === "/admin/oprec/answers" ? "page" : undefined} onClick={() => { if (window.innerWidth < 768) setOpen(false); }}><ListChecks aria-hidden="true" className="h-4 w-4" /> Jawaban tes tulis</Link>
                    </div>}
                  </div>;
                  return (
                    <SidebarLink
                      key={link.href}
                      link={link}
                      active={isActive}
                      onClick={() => {
                        if (typeof window !== "undefined" && window.innerWidth < 768) {
                          setOpen(false);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Admin Profile & Logout Footer */}
            <div className="border-t border-white/20 pt-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-3 px-1 py-1 rounded-xl">
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
                <motion.div
                  animate={{
                    display: open ? "flex" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="flex flex-col min-w-0 flex-1 whitespace-pre"
                >
                  <span className="text-xs font-bold text-white truncate">{displayName}</span>
                  <span className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">ADMIN HIMANIKA</span>
                </motion.div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-3 group/sidebar px-3 py-2.5 rounded-xl transition-all duration-150 text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border border-red-400/25 cursor-pointer"
                title="Keluar Admin"
              >
                <div className="flex-shrink-0 transition-transform duration-150 group-hover/sidebar:scale-110 text-red-300 group-hover/sidebar:text-white">
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </div>
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="text-sm font-semibold whitespace-pre inline-block !p-0 !m-0 tracking-tight"
                >
                  Keluar Admin
                </motion.span>
              </button>
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main Content Area */}
        <div className="admin-main-wrapper">
          <header className="admin-topbar">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-mono text-blue-600 font-semibold">SIMANIKA</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold capitalize">
                {pathname === "/admin" ? "Dashboard" : pathname.replace("/admin/", "").replace("/", " / ")}
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

          <main className="admin-content-stage">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </AdminRoute>
  );
}
