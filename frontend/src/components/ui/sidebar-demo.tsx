"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Kelola Event",
      href: "/admin/events",
      icon: (
        <UserCog className="h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <Settings className="h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-2xl flex flex-col md:flex-row bg-[#F4F7FB] w-full flex-1 max-w-7xl mx-auto border border-blue-200 overflow-hidden shadow-xl",
        "h-[65vh]"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Admin SIMANIKA",
                href: "/admin/settings",
                icon: (
                  <div className="w-7 h-7 rounded-full bg-white text-[#155EEF] flex items-center justify-center text-xs font-bold shadow-sm">
                    A
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/admin"
      className="font-normal flex space-x-2.5 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-7 w-7 bg-white rounded-lg flex items-center justify-center font-black text-[#155EEF] text-xs shadow-sm flex-shrink-0">
        S
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-extrabold text-white tracking-wide whitespace-pre"
      >
        SIMANIKA ADMIN
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/admin"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-7 w-7 bg-white rounded-lg flex items-center justify-center font-black text-[#155EEF] text-xs shadow-sm flex-shrink-0">
        S
      </div>
    </Link>
  );
};

// Dummy dashboard component with content
const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-2xl bg-white flex flex-col gap-4 flex-1 w-full h-full text-slate-900 border-l border-slate-200">
        <div className="flex gap-3">
          {[...new Array(4)].map((_, i) => (
            <div
              key={"first-array-" + i}
              className="h-20 w-full rounded-xl bg-blue-50 border border-blue-100 animate-pulse"
            />
          ))}
        </div>
        <div className="flex gap-3 flex-1">
          {[...new Array(2)].map((_, i) => (
            <div
              key={"second-array-" + i}
              className="h-full w-full rounded-xl bg-slate-50 border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarDemo;
