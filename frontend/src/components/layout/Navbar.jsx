"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedNavIcon } from "@/components/ui/AnimatedNavIcon";

const links = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/events", icon: "event", label: "Event" },
  { href: "/oprec", icon: "oprec", label: "OPREC" },
  { href: "/partnership", icon: "partnership", label: "Partnership" },
];

function MenuIcon({ open }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" />
      ) : (
        <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" />
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
  const menuButtonRef = useRef(null);
  const pathname = usePathname();

  const isActiveLink = (href) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
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

          <button
            aria-controls={open ? "mobile-navigation" : undefined}
            aria-expanded={open}
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="menu-toggle"
            onClick={() => setOpen((current) => !current)}
            ref={menuButtonRef}
            type="button"
          >
            <MenuIcon open={open} />
          </button>
        </div>

        <Link className="login-link" href="/login">
          <span className="login-link__tile" aria-hidden="true">
            <AnimatedUserIcon />
          </span>
          <span>Login</span>
        </Link>

        {open ? (
          <nav
            className="mobile-nav mobile-nav--open"
            id="mobile-navigation"
            aria-label="Navigasi mobile"
          >
            {links.map((link) => (
              <Link
                aria-current={isActiveLink(link.href) ? "page" : undefined}
                className={isActiveLink(link.href) ? "mobile-nav__link mobile-nav__link--active" : "mobile-nav__link"}
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                <AnimatedNavIcon name={link.icon} />
                <span>{link.label}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
            <Link className="mobile-nav__login" href="/login" onClick={() => setOpen(false)}>
              Masuk ke akun
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
