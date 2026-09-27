"use client";

import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import Image from "next/image";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen h-[100dvh] sticky top-0 px-4 py-5 hidden md:flex md:flex-col justify-between",
        "bg-gradient-to-b from-[#155EEF] via-[#104ECC] to-[#0A3CB3]",
        "border-r border-blue-400/25 flex-shrink-0 text-white select-none z-30",
        "shadow-xl shadow-blue-900/10 overflow-y-auto overflow-x-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "76px") : "280px",
      }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-40 flex-shrink-0 h-14 px-4 py-3 flex flex-row md:hidden items-center justify-between",
          "bg-[#155EEF] border-b border-blue-400/30 w-full text-white shadow-md shadow-blue-900/10"
        )}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Image
                src="/images/logos/Logo-MIF-2020-nav.webp"
                alt="Logo Himanika MIF"
                width={32}
                height={32}
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">SIMANIKA ADMIN</span>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setOpen(!open)}
            aria-label="Buka menu admin"
            aria-expanded={open}
          >
            <Menu className="w-5 h-5 cursor-pointer" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop Overlay for closing on outside tap */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90]"
                aria-hidden="true"
              />

              {/* Mobile Drawer sliding from the RIGHT */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  duration: 0.26,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "fixed top-0 right-0 bottom-0 h-full h-[100dvh] w-[72vw] sm:w-[50vw] max-w-[340px] min-w-[260px]",
                  "bg-gradient-to-b from-[#155EEF] via-[#104ECC] to-[#0A3CB3]",
                  "p-5 z-[100] flex flex-col justify-between overflow-y-auto text-white shadow-2xl",
                  "border-l border-blue-400/30",
                  className
                )}
              >
                <button
                  type="button"
                  className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 hover:text-blue-100"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup menu admin"
                >
                  <X aria-hidden="true" className="w-5 h-5" />
                </button>
                {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active = false,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  onClick?: () => void;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "admin-nav-link flex items-center justify-start gap-3 group/sidebar px-3 py-2.5 rounded-xl transition-all duration-150 relative",
        active
          ? "active bg-white font-bold shadow-md shadow-blue-950/20"
          : "text-blue-50/90 hover:text-white hover:bg-white/15 font-medium",
        className
      )}
      style={{
        backgroundColor: active ? "#ffffff" : undefined,
        color: active ? "#155EEF" : undefined,
      }}
      {...props}
    >
      <div
        className={cn(
          "admin-nav-icon flex-shrink-0 transition-transform duration-150 group-hover/sidebar:scale-110",
          active ? "text-[#155eef]" : "text-blue-100 group-hover/sidebar:text-white"
        )}
        style={{
          color: active ? "#155EEF" : undefined,
        }}
      >
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm whitespace-pre inline-block !p-0 !m-0 tracking-tight",
          active ? "font-bold text-[#155eef]" : "font-medium"
        )}
        style={{
          color: active ? "#155EEF" : undefined,
        }}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
