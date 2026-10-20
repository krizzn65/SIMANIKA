"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useScrollLock } from "@/components/motion/SmoothScroll";
import "./dev-notice.css";

const STORAGE_KEY = "simanika-dev-notice-seen";

const developers = [
  { name: "Gilang", phoneDisplay: "+62 852-3406-3810", phone: "6285234063810" },
  { name: "Dewa", phoneDisplay: "+62 859-5089-8273", phone: "6285950898273" },
];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Development notice for public and member pages. Closing it collapses it
// into a floating "!" button instead of hiding it; admin pages never show it.
export function DevNotice() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dialogRef = useRef(null);
  const fabRef = useRef(null);
  const hidden = pathname.startsWith("/admin");
  useScrollLock(open && !hidden);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch {}
    setOpen(!seen);
    setReady(true);
  }, []);

  function close() {
    setOpen(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    requestAnimationFrame(() => fabRef.current?.focus());
  }

  useEffect(() => {
    if (!open || hidden) return;
    dialogRef.current?.querySelector("button")?.focus();
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hidden]);

  if (!ready || hidden) return null;

  if (!open) {
    return (
      <button
        ref={fabRef}
        type="button"
        className="dev-notice-fab"
        onClick={() => setOpen(true)}
        aria-label="Buka pemberitahuan tahap pengembangan"
        title="Info pengembangan & kontak developer"
      >
        <span aria-hidden="true">!</span>
      </button>
    );
  }

  return (
    <div className="dev-notice-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={dialogRef}
        className="dev-notice-card"
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-notice-title"
      >
        <button type="button" className="dev-notice-close" onClick={close} aria-label="Tutup pemberitahuan">
          <X size={18} aria-hidden="true" />
        </button>

        <div className="dev-notice-head">
          <span className="dev-notice-icon"><AlertTriangle size={20} aria-hidden="true" /></span>
          <span className="dev-notice-eyebrow">SIMANIKA / TAHAP PENGEMBANGAN</span>
        </div>

        <h2 id="dev-notice-title" className="dev-notice-title">Pemberitahuan Sistem</h2>
        <p className="dev-notice-text">
          Website ini masih dalam tahap pengembangan. Jika menemukan error atau bug, hubungi developer lewat WhatsApp:
        </p>

        <div className="dev-notice-contacts">
          {developers.map((dev) => (
            <a
              key={dev.phone}
              className="dev-notice-wa"
              href={`https://wa.me/${dev.phone}?text=${encodeURIComponent(`Halo ${dev.name}, saya ingin melaporkan kendala/bug pada website SIMANIKA.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="dev-notice-wa-icon"><WhatsAppIcon /></span>
              <span className="dev-notice-wa-text">
                <strong>{dev.name}</strong>
                <span>{dev.phoneDisplay}</span>
              </span>
              <ArrowRight size={16} className="dev-notice-wa-arrow" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="dev-notice-footer">
          <span className="dev-notice-hint">Info ini bisa dibuka lagi lewat tombol <b>!</b> di pojok kanan bawah.</span>
          <button type="button" className="dev-notice-continue" onClick={close}>
            Lanjut <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
