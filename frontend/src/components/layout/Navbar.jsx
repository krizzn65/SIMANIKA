"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatedNavIcon } from "@/components/ui/AnimatedNavIcon";
import { CloseSmallIcon } from "@/components/ui/CloseSmallIcon";

const links = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/events", icon: "event", label: "Event" },
  { href: "/oprec", icon: "oprec", label: "OPREC" },
  { href: "/merchandise", icon: "merchandise", label: "Merchandise" },
];

function MenuIcon({ open }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="22" height="22">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function AnimatedUserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="login-link__user"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="login-link__user-head" cx="12" cy="8" r="4" />
      <path className="login-link__user-body" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActiveLink = (href) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  const handleClose = () => {
    if (!open || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 240);
  };

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape" && open) {
        handleClose();
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [open, isClosing]);

  // Close when clicking/tapping anywhere outside the drawer
  useEffect(() => {
    if (!open || isClosing) return;

    const handlePointerDown = (event) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        !menuButtonRef.current?.contains(event.target)
      ) {
        handleClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, isClosing]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* Desktop Navbar Capsule (hidden on mobile) */}
        <div className="nav-capsule">
          <Link className="brand-mark" href="/" aria-label="SIMANIKA — Beranda">
            <Image
              alt=""
              className="brand-mark__logo"
              height={44}
              priority
              sizes="44px"
              src="/images/logos/Logo-MIF-2020-nav.webp"
              width={44}
            />
          </Link>

          <nav className="desktop-nav" aria-label="Navigasi utama">
            {links.map((link) => (
              <Link
                aria-current={isActiveLink(link.href) ? "page" : undefined}
                className={isActiveLink(link.href) ? "nav-link nav-link--active" : "nav-link"}
                href={link.href}
                key={link.href}
              >
                <AnimatedNavIcon name={link.icon} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Login Link (hidden on mobile) */}
        <Link className="login-link" href="/login">
          <span className="login-link__tile" aria-hidden="true">
            <AnimatedUserIcon />
          </span>
          <span>Login</span>
        </Link>

        {/* Mobile Circular Menu Button (visible on mobile only, placed top-right) */}
        <button
          aria-controls={open ? "mobile-navigation" : undefined}
          aria-expanded={open}
          aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
          className="menu-toggle"
          onClick={handleToggle}
          ref={menuButtonRef}
          type="button"
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobile Drawer (Half-Screen Slide-in from Right with Slide-out Close Animation) */}
      {mounted &&
        open &&
        createPortal(
          <div
            className={`mobile-drawer-portal${isClosing ? " mobile-drawer-portal--closing" : ""}`}
          >
            <div
              aria-label="Tutup navigasi"
              className="mobile-drawer-overlay"
              onClick={handleClose}
              role="button"
              tabIndex={-1}
            />
            <aside
              aria-label="Navigasi mobile"
              className="mobile-drawer"
              id="mobile-navigation"
              ref={drawerRef}
            >
              <div className="mobile-drawer__header">
                <div className="mobile-drawer__brand">
                  <Image
                    alt="Logo HIMANIKA"
                    className="mobile-drawer__logo"
                    height={28}
                    src="/images/logos/Logo-MIF-2020-nav.webp"
                    width={28}
                  />
                  <span className="mobile-drawer__tag">SIMANIKA</span>
                </div>
                <button
                  type="button"
                  className="mobile-drawer__close-btn"
                  onClick={handleClose}
                  aria-label="Tutup menu"
                >
                  <CloseSmallIcon size={18} />
                </button>
              </div>

              <nav className="mobile-drawer__nav">
                {links.map((link) => (
                  <Link
                    aria-current={isActiveLink(link.href) ? "page" : undefined}
                    className={
                      isActiveLink(link.href)
                        ? "mobile-drawer__link mobile-drawer__link--active"
                        : "mobile-drawer__link"
                    }
                    href={link.href}
                    key={link.href}
                    onClick={handleClose}
                  >
                    <span className="mobile-drawer__icon-wrap">
                      <AnimatedNavIcon name={link.icon} />
                    </span>
                    <span className="mobile-drawer__label">{link.label}</span>
                    <span className="mobile-drawer__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="mobile-drawer__footer">
                <Link
                  className="mobile-drawer__login"
                  href="/login"
                  onClick={handleClose}
                >
                  <span className="mobile-drawer__login-tile" aria-hidden="true">
                    <AnimatedUserIcon />
                  </span>
                  <span>Masuk ke akun</span>
                </Link>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}
