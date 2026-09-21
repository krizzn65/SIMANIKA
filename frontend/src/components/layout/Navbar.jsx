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

const landingSections = [
  {
    id: "hero",
    href: "/#hero",
    badge: "00",
    title: "Beranda",
    shortTitle: "Beranda",
    desc: "Awal & tagline HIMANIKA",
  },
  {
    id: "tentang",
    href: "/#tentang",
    badge: "01",
    title: "Tentang HIMANIKA",
    shortTitle: "Tentang",
    desc: "Profil, visi bersama, & pilar",
  },
  {
    id: "visi-misi",
    href: "/#visi-misi",
    badge: "02",
    title: "Visi & Misi",
    shortTitle: "Visi-Misi",
    desc: "Arah gerak & 4 pilar misi",
  },
  {
    id: "divisi",
    href: "/#divisi",
    badge: "03",
    title: "Divisi Kami",
    shortTitle: "Divisi",
    desc: "6 divisi & struktur organisasi",
  },
  {
    id: "gallery",
    href: "/#gallery",
    badge: "04",
    title: "Galeri Kegiatan",
    shortTitle: "Galeri",
    desc: "Dokumentasi & momen kegiatan",
  },
  {
    id: "testimoni",
    href: "/#testimoni",
    badge: "05",
    title: "Apa Kata Mereka",
    shortTitle: "Testimoni",
    desc: "Cerita anggota & alumni",
  },
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
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [mobileHomeExpanded, setMobileHomeExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const homeDropdownRef = useRef(null);
  const subbarRef = useRef(null);
  const homeMenuTimer = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActiveLink = (href) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  // Scroll spy on home page to highlight active landing section
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["hero", "tentang", "visi-misi", "divisi", "gallery", "testimoni"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    let offsets = [];
    let frame = 0;
    let currentSection = "";

    const updateActiveSection = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const scrollPos = scrollY + 180;
      let nextSection = "hero";

      if (scrollY >= 260) {
        for (let i = offsets.length - 1; i >= 0; i--) {
          if (scrollPos >= offsets[i].top) {
            nextSection = offsets[i].id;
            break;
          }
        }
      }

      if (nextSection !== currentSection) {
        currentSection = nextSection;
        setActiveSection(nextSection);
      }
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    const measureSections = () => {
      offsets = sections.map((section) => ({
        id: section.id,
        top: section.getBoundingClientRect().top + window.scrollY,
      }));
      scheduleUpdate();
    };

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(measureSections)
        : null;
    sections.forEach((section) => resizeObserver?.observe(section));
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measureSections, { passive: true });
    measureSections();

    return () => {
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measureSections);
    };
  }, [pathname]);

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

  // Hover handlers for Home dropdown
  const handleHomeMouseEnter = () => {
    if (homeMenuTimer.current) {
      clearTimeout(homeMenuTimer.current);
      homeMenuTimer.current = null;
    }
    setIsHomeMenuOpen(true);
  };

  const handleHomeMouseLeave = () => {
    homeMenuTimer.current = setTimeout(() => {
      setIsHomeMenuOpen(false);
    }, 180);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    // Toggle dropdown on click
    setIsHomeMenuOpen((prev) => !prev);
  };

  // Section click handler with smooth scroll if on home page
  const handleSectionClick = (e, sectionId) => {
    setIsHomeMenuOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      if (sectionId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isHomeMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        homeDropdownRef.current &&
        !homeDropdownRef.current.contains(event.target) &&
        subbarRef.current &&
        !subbarRef.current.contains(event.target)
      ) {
        setIsHomeMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isHomeMenuOpen]);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        if (isHomeMenuOpen) setIsHomeMenuOpen(false);
        if (open) {
          handleClose();
          menuButtonRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [open, isClosing, isHomeMenuOpen]);

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
            {links.map((link) => {
              const isHome = link.href === "/";
              const active = isActiveLink(link.href);

              if (isHome) {
                return (
                  <div
                    key={link.href}
                    className={`nav-dropdown ${isHomeMenuOpen ? "nav-dropdown--open" : ""}`}
                    ref={homeDropdownRef}
                    onMouseEnter={handleHomeMouseEnter}
                    onMouseLeave={handleHomeMouseLeave}
                  >
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={active ? "nav-link nav-link--active" : "nav-link"}
                      href={link.href}
                      onClick={handleHomeClick}
                      aria-expanded={isHomeMenuOpen}
                      aria-haspopup="true"
                    >
                      <AnimatedNavIcon name={link.icon} />
                      <span>{link.label}</span>
                      <span className="nav-dropdown__chevron" aria-hidden="true">
                        <svg viewBox="0 0 12 12" fill="none" width="9" height="9">
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={active ? "nav-link nav-link--active" : "nav-link"}
                  href={link.href}
                  key={link.href}
                >
                  <AnimatedNavIcon name={link.icon} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Multi-Column Sub-Navbar Grid */}
          <div
            className={`nav-subgrid ${isHomeMenuOpen ? "nav-subgrid--open" : ""}`}
            ref={subbarRef}
            onMouseEnter={handleHomeMouseEnter}
            onMouseLeave={handleHomeMouseLeave}
            role="menu"
            aria-label="Sub navigasi landing page"
          >
            <div className="nav-subgrid__header">
              <span className="nav-subgrid__tag">BAGIAN LANDING PAGE</span>
              <span className="nav-subgrid__hint">PILIH BAGIAN</span>
            </div>
            <div className="nav-subgrid__list">
              {landingSections.map((sec) => (
                <Link
                  key={sec.id}
                  href={sec.href}
                  className={`nav-subgrid__item ${activeSection === sec.id ? "nav-subgrid__item--active" : ""}`}
                  onClick={(e) => handleSectionClick(e, sec.id)}
                  role="menuitem"
                >
                  <span className="nav-subgrid__badge">{sec.badge}</span>
                  <div className="nav-subgrid__body">
                    <span className="nav-subgrid__title">{sec.title}</span>
                    <span className="nav-subgrid__desc">{sec.desc}</span>
                  </div>
                  <span className="nav-subgrid__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
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

      {/* Mobile Drawer (Half-Screen Slide-in from Right) */}
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
                {links.map((link) => {
                  const isHome = link.href === "/";
                  const active = isActiveLink(link.href);

                  if (isHome) {
                    return (
                      <div className="mobile-drawer__group" key={link.href}>
                        <div className="mobile-drawer__link-row">
                          <Link
                            aria-current={active ? "page" : undefined}
                            className={
                              active
                                ? "mobile-drawer__link mobile-drawer__link--active"
                                : "mobile-drawer__link"
                            }
                            href={link.href}
                            onClick={handleClose}
                          >
                            <span className="mobile-drawer__icon-wrap">
                              <AnimatedNavIcon name={link.icon} />
                            </span>
                            <span className="mobile-drawer__label">
                              {link.label}
                            </span>
                          </Link>
                          <button
                            type="button"
                            className={`mobile-drawer__sub-toggle ${mobileHomeExpanded ? "mobile-drawer__sub-toggle--open" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMobileHomeExpanded((prev) => !prev);
                            }}
                            aria-label="Tampilkan sub-bagian landing page"
                            title="Sub-bagian landing page"
                          >
                            <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
                              <path
                                d="M2.5 4.5L6 8L9.5 4.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>

                        {mobileHomeExpanded && (
                          <div className="mobile-drawer__sub-list">
                            {landingSections.map((sec) => (
                              <Link
                                key={sec.id}
                                href={sec.href}
                                className="mobile-drawer__sub-item"
                                onClick={(e) => {
                                  handleSectionClick(e, sec.id);
                                  handleClose();
                                }}
                              >
                                <span className="mobile-drawer__sub-badge">
                                  {sec.badge}
                                </span>
                                <span className="mobile-drawer__sub-title">
                                  {sec.title}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={
                        active
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
                  );
                })}
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
