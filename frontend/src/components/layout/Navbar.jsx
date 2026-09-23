"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatedNavIcon } from "@/components/ui/AnimatedNavIcon";
import { CloseSmallIcon } from "@/components/ui/CloseSmallIcon";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileHomeExpanded, setMobileHomeExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { user: account, checked, checkError, retryCheck, logout } = useAuth();
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const homeDropdownRef = useRef(null);
  const subbarRef = useRef(null);
  const homeMenuTimer = useRef(null);
  const accountMenuRef = useRef(null);
  const accountMenuTimer = useRef(null);
  const pathname = usePathname();

  const displayName = (() => {
    if (!account) return "";
    const raw = (account.nama || account.namaLengkap || account.name || "").trim();
    if (raw && raw.toLowerCase() !== "akun saya") return raw;
    if (account.email) {
      const emailUser = account.email.split("@")[0].trim();
      if (emailUser) {
        return emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
      }
    }
    return "User";
  })();

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
    setIsHomeMenuOpen(false);
    if (pathname !== "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    // If already on "/", smoothly scroll to top
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSectionClick = (event, sectionId) => {
    setIsHomeMenuOpen(false);
    if (pathname !== "/") return;

    event.preventDefault();
    if (sectionId === "hero") {
      window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) return;
    window.history.replaceState(null, "", `/#${sectionId}`);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Hover & click handlers for Account menu
  const handleAccountMouseEnter = () => {
    if (accountMenuTimer.current) {
      clearTimeout(accountMenuTimer.current);
      accountMenuTimer.current = null;
    }
    setIsAccountMenuOpen(true);
  };

  const handleAccountMouseLeave = () => {
    accountMenuTimer.current = setTimeout(() => {
      setIsAccountMenuOpen(false);
    }, 180);
  };

  const handleAccountToggle = () => {
    setIsAccountMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setAccountError("");
    setIsLoggingOut(true);
    setIsAccountMenuOpen(false);
    try {
      await logout();
      handleClose();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Gagal keluar dari akun. Coba lagi.");
      setIsAccountMenuOpen(true);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setIsHomeMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [pathname]);

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

  // Close account menu on outside click
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isAccountMenuOpen]);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        if (isHomeMenuOpen) setIsHomeMenuOpen(false);
        if (isAccountMenuOpen) setIsAccountMenuOpen(false);
        if (open) {
          handleClose();
          menuButtonRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [open, isClosing, isHomeMenuOpen, isAccountMenuOpen]);

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
          <Link
            className="brand-mark"
            href="/"
            aria-label="SIMANIKA — Beranda"
            onClick={() => {
              setIsHomeMenuOpen(false);
              if (pathname !== "/") {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
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
                  onClick={() => {
                    if (pathname !== link.href) {
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    }
                  }}
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

        {/* Desktop Login / Account with Sub-Navbar */}
        {!checked ? (
          <span className="login-link login-link--pending" role="status" aria-label="Memeriksa sesi akun" aria-busy="true">
            <span className="login-link__tile" aria-hidden="true"><AnimatedUserIcon /></span>
            <span>Memuat...</span>
          </span>
        ) : checkError ? (
          <button type="button" className="login-link" onClick={retryCheck} aria-label="Coba lagi periksa sesi akun">
            <span className="login-link__tile" aria-hidden="true"><AnimatedUserIcon /></span>
            <span>Coba lagi</span>
          </button>
        ) : !account ? (
          <Link className="login-link" href="/login">
            <span className="login-link__tile" aria-hidden="true">
              <AnimatedUserIcon />
            </span>
            <span>Login</span>
          </Link>
        ) : (
          <div
            className="nav-account"
            ref={accountMenuRef}
            onMouseEnter={handleAccountMouseEnter}
            onMouseLeave={handleAccountMouseLeave}
          >
            <button
              type="button"
              className={`login-link login-link--account ${isAccountMenuOpen ? "login-link--open" : ""}`}
              onClick={handleAccountToggle}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="true"
              aria-label={`Menu akun ${displayName}`}
            >
              <span className="login-link__tile login-link__tile--avatar" aria-hidden="true">
                <UserAvatar
                  src={account.fotoProfil}
                  name={displayName}
                  email={account.email}
                  fontSize="0.95rem"
                />
              </span>
              <span className="login-link__name" title={displayName}>
                {displayName}
              </span>
              <span className="login-link__chevron" aria-hidden="true">
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
            </button>

            {/* Desktop Sub-Navbar Dashboard Floating Menu */}
            <div
              className={`nav-account-menu ${isAccountMenuOpen ? "nav-account-menu--open" : ""}`}
              role="menu"
              aria-label="Sub navigasi dashboard akun"
            >
              <div className="nav-account-menu__header">
                <div className="nav-account-menu__user">
                  <div className="nav-account-menu__avatar" aria-hidden="true">
                    <UserAvatar
                      src={account.fotoProfil}
                  name={displayName}
                      email={account.email}
                      fontSize="1rem"
                    />
                  </div>
                  <div className="nav-account-menu__info">
                    <span className="nav-account-menu__name">{displayName}</span>
                    <span className="nav-account-menu__email">{account.email}</span>
                  </div>
                </div>
              </div>

              <div className="nav-account-menu__divider" role="separator" />

              <div className="nav-account-menu__list">
                {account.role === "admin" ? (
                  <Link
                    href="/admin"
                    className={`nav-account-menu__item nav-account-menu__item--admin ${pathname.startsWith("/admin") ? "nav-account-menu__item--active" : ""}`}
                    onClick={() => setIsAccountMenuOpen(false)}
                    role="menuitem"
                  >
                    <span className="nav-account-menu__icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <div className="nav-account-menu__item-text">
                      <div className="nav-account-menu__title-row">
                        <span className="nav-account-menu__item-title">Admin Console</span>
                        <span className="nav-account-menu__admin-pill">Admin</span>
                      </div>
                      <span className="nav-account-menu__item-desc">Kelola event, OPREC & sistem</span>
                    </div>
                    <span className="nav-account-menu__arrow" aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className={`nav-account-menu__item ${pathname === "/dashboard" ? "nav-account-menu__item--active" : ""}`}
                    onClick={() => setIsAccountMenuOpen(false)}
                    role="menuitem"
                  >
                    <span className="nav-account-menu__icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </span>
                    <div className="nav-account-menu__item-text">
                      <span className="nav-account-menu__item-title">Dashboard</span>
                      <span className="nav-account-menu__item-desc">Halaman utama & ringkasan</span>
                    </div>
                    <span className="nav-account-menu__arrow" aria-hidden="true">→</span>
                  </Link>
                )}
              </div>

              <div className="nav-account-menu__divider" role="separator" />

              <div className="nav-account-menu__footer">
                {accountError && <p className="nav-account-menu__error" role="alert">{accountError}</p>}
                <button
                  type="button"
                  className="nav-account-menu__logout-btn"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  role="menuitem"
                >
                  <span className="nav-account-menu__logout-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  <span>{isLoggingOut ? "Sedang keluar..." : "Keluar dari Akun"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                            onClick={() => {
                              handleClose();
                              if (pathname !== "/") {
                                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                              } else {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
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
                {!checked ? (
                  <div className="mobile-drawer__login" role="status" aria-busy="true">
                    Memeriksa sesi akun...
                  </div>
                ) : checkError ? (
                  <button type="button" className="mobile-drawer__login" onClick={retryCheck}>
                    Gagal memeriksa sesi. Coba lagi
                  </button>
                ) : account ? (
                  <div className="mobile-drawer__account-section">
                    {account.role === "admin" ? (
                      <Link
                        className="mobile-drawer__account-card"
                        href="/admin"
                        onClick={handleClose}
                        title="Buka Admin Console"
                        style={{ border: "1px solid rgba(21, 94, 239, 0.3)", background: "rgba(21, 94, 239, 0.08)" }}
                      >
                        <div className="mobile-drawer__account-avatar" style={{ background: "#155eef", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div className="mobile-drawer__account-info">
                          <span className="mobile-drawer__account-name" style={{ color: "#155eef", fontWeight: 700 }}>Admin Console</span>
                          <span className="mobile-drawer__account-link">Kelola SIMANIKA System</span>
                        </div>
                        <span className="mobile-drawer__account-chevron" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <path d="M6 12l4-4-4-4" />
                          </svg>
                        </span>
                      </Link>
                    ) : (
                      <Link
                        className="mobile-drawer__account-card"
                        href="/dashboard"
                        onClick={handleClose}
                        title="Buka Halaman Dashboard"
                      >
                        <div className="mobile-drawer__account-avatar">
                          <UserAvatar
                            src={account.fotoProfil}
                  name={displayName}
                            email={account.email}
                            size="100%"
                            fontSize="1.05rem"
                            borderRadius="50%"
                          />
                        </div>
                        <div className="mobile-drawer__account-info">
                          <span className="mobile-drawer__account-name">{displayName}</span>
                          <span className="mobile-drawer__account-link">
                            Buka Dashboard
                          </span>
                        </div>
                        <span className="mobile-drawer__account-chevron" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <path d="M6 12l4-4-4-4" />
                          </svg>
                        </span>
                      </Link>
                    )}

                    {accountError && <p className="mobile-drawer__account-error" role="alert">{accountError}</p>}
                    <button
                      type="button"
                      className="mobile-drawer__logout-btn"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>{isLoggingOut ? "Sedang keluar..." : "Keluar Akun"}</span>
                    </button>
                  </div>
                ) : (
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
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}
