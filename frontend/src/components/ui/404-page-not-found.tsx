"use client";

import Link from "next/link";
import type { ReactNode } from "react";

// The animated "lost/electrocuted" illustration from the original component; kept as is.
const ILLUSTRATION = "https://cdn.21st.dev/assets/mirror/35/354f63f88b57aceea4536df0c0cff0c3592aa46fe887ff910751fefc12f3e76c.gif";

type Action = { label: string; href?: string; onClick?: () => void; variant?: "primary" | "secondary" };

type StatusPageProps = {
  code: string;
  eyebrow: string;
  title: string;
  message: ReactNode;
  actions: Action[];
};

const buttonBase = "inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155eef]";
// "!" because the site-wide link colour would otherwise win over these utilities.
const buttonVariants = {
  primary: "border border-[#155eef] bg-[#155eef] text-white! hover:bg-[#0f48c2]",
  secondary: "border border-[#c8d5e8] bg-white text-[#101b2d]! hover:border-[#155eef] hover:text-[#155eef]!",
};

export function StatusPage({ code, eyebrow, title, message, actions }: StatusPageProps) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <div
          className="h-[250px] bg-contain bg-center bg-no-repeat sm:h-[350px] md:h-[400px]"
          style={{ backgroundImage: `url(${ILLUSTRATION})` }}
          aria-hidden="true"
        >
          <p className="pt-6 text-6xl font-bold tracking-tight text-[#101b2d] sm:pt-8 sm:text-7xl md:text-8xl">{code}</p>
        </div>

        <div className="mt-[-50px]">
          <span className="font-['IBM_Plex_Mono',monospace] text-xs font-semibold uppercase tracking-[0.12em] text-[#0f48c2]">{eyebrow}</span>
          <h1 className="mb-3 mt-2 text-2xl font-bold tracking-tight text-[#101b2d] sm:text-3xl">{title}</h1>
          <p className="mx-auto mb-6 max-w-md text-[15px] leading-relaxed text-[#53647a]">{message}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {actions.map(({ label, href, onClick, variant = "primary" }) => {
              const className = `${buttonBase} ${buttonVariants[variant]}`;
              return href
                ? <Link key={label} href={href} className={className}>{label}</Link>
                : <button key={label} type="button" onClick={onClick} className={className}>{label}</button>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      eyebrow="SIMANIKA / HALAMAN TIDAK DITEMUKAN"
      title="Sepertinya kamu tersesat"
      message="Halaman yang kamu cari tidak tersedia, sudah dipindahkan, atau alamatnya salah ketik."
      actions={[{ label: "Kembali ke Beranda", href: "/" }, { label: "Ke Dashboard", href: "/dashboard/", variant: "secondary" }]}
    />
  );
}

export function ServerErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <StatusPage
      code="500"
      eyebrow="SIMANIKA / KESALAHAN SISTEM"
      title="Ada yang korslet di sistem kami"
      message="Terjadi kesalahan saat memuat halaman ini. Coba lagi sebentar; kalau masih terjadi, hubungi pengelola."
      actions={[
        ...(onRetry ? [{ label: "Coba lagi", onClick: onRetry }] : []),
        { label: "Kembali ke Beranda", href: "/", variant: onRetry ? "secondary" : "primary" },
      ]}
    />
  );
}

export function MaintenancePage({ message }: { message?: string }) {
  return (
    <StatusPage
      code="503"
      eyebrow="SIMANIKA / SEDANG PERBAIKAN"
      title="Website sedang dalam perbaikan"
      message={message || "Kami sedang merapikan beberapa hal. SIMANIKA akan kembali sebentar lagi."}
      actions={[{ label: "Muat ulang", onClick: () => window.location.reload() }]}
    />
  );
}
