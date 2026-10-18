"use client";

import { useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const developers = [
  {
    name: "Gilang",
    phoneDisplay: "+62 852-3406-3810",
    phoneClean: "6285234063810",
    message: "Halo Gilang, saya ingin melaporkan kendala/bug pada website OPREC SIMANIKA.",
  },
  {
    name: "Dewa",
    phoneDisplay: "+62 859-5089-8273",
    phoneClean: "6285950898273",
    message: "Halo Dewa, saya ingin melaporkan kendala/bug pada website OPREC SIMANIKA.",
  },
];

export function OprecDevNoticeModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Pemberitahuan Tahap Pengembangan"
      className="fixed top-16 sm:top-[4.25rem] left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-1.25rem)] max-w-2xl animate-in slide-in-from-top-4 fade-in duration-200"
    >
      <div className="relative bg-white/95 backdrop-blur-md border border-amber-300/90 rounded-2xl shadow-xl shadow-slate-900/10 p-3 sm:p-4 overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-blue-500" />

        <div className="flex items-start gap-3">
          {/* Alert Icon Badge */}
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200/70">
                Tahap Pengembangan
              </span>
              <span className="text-xs font-semibold text-slate-800">
                Pemberitahuan Sistem
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Website ini masih dalam tahap pengembangan. Jika terkendala error atau menemukan bug, silakan hubungi developer:
            </p>

            {/* Developers WhatsApp Contacts & Lanjut Button */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {developers.map((dev) => {
                  const waUrl = `https://wa.me/${dev.phoneClean}?text=${encodeURIComponent(dev.message)}`;
                  return (
                    <a
                      key={dev.phoneClean}
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-xs font-medium transition-all hover:shadow-xs group cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <span>
                        {dev.name}:{" "}
                        <strong className="font-mono text-emerald-950 underline decoration-emerald-400 underline-offset-2">
                          {dev.phoneDisplay}
                        </strong>
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Button Lanjut */}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Close Icon ('X') */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemberitahuan"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
