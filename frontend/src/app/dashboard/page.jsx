"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import "./dashboard.css";

const statusLabels = {
  pending: "Menunggu proses",
  accepted: "Diterima",
  rejected: "Belum diterima",
  incomplete: "Perlu dilengkapi",
  complete: "Terkirim",
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function EmptyMark() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <rect x="10" y="13" width="52" height="46" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 25h52M23 13v12M49 13v12M24 39h24M24 47h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m47 46 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RegistrationCard({ item }) {
  const type = item.kind === "oprec" ? "OPEN RECRUITMENT" : item.kind === "team" ? "LOMBA / TIM" : "EVENT / LOMBA";
  const date = formatDate(item.date);
  const statusTone = ["accepted", "rejected"].includes(item.status) ? item.status : "pending";
  return (
    <article className="dashboard-entry">
      <div className="dashboard-entry__top">
        <span className="dashboard-entry__type">{type}</span>
        <span className={"dashboard-entry__status dashboard-entry__status--" + statusTone}>
          {statusLabels[item.status] || "Terdaftar"}
        </span>
      </div>
      <div className="dashboard-entry__body">
        <h2>{item.title}</h2>
        <p>{item.subtitle}</p>
      </div>
      <div className="dashboard-entry__bottom">
        <span>{date ? (item.kind === "oprec" ? "Pengumuman" : "Pelaksanaan") + " · " + date : "Pendaftaran tercatat"}</span>
        <Link href={item.href}>Lihat detail <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    api.get("/user/dashboard", { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data?.data?.items)) throw new Error("Invalid dashboard response");
        setItems(data.data.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.id, attempt]);

  return (
    <main className="dashboard-page" id="dashboard-content">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">SIMANIKA / DASHBOARD</p>
            <h1>Halaman <span>Dashboard.</span></h1>
            <p className="dashboard-intro">Semua kegiatan yang kamu ikuti, dalam satu tempat.</p>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-state" role="status" aria-live="polite">
            <span className="dashboard-state__loading" aria-hidden="true" />
            <p>Memuat pendaftaranmu...</p>
          </div>
        ) : error ? (
          <div className="dashboard-state" role="alert">
            <p>Pendaftaran belum bisa dimuat.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>Coba lagi <span aria-hidden="true">↗</span></button>
          </div>
        ) : items.length === 0 ? (
          <div className="dashboard-state dashboard-state--empty">
            <div className="dashboard-state__mark"><EmptyMark /></div>
            <h2>Belum ada pendaftaran.</h2>
            <p>Event dan open recruitment yang kamu ikuti akan muncul di sini.</p>
          </div>
        ) : (
          <section className="dashboard-list" aria-label="Daftar pendaftaran saya">
            <div className="dashboard-list__count">{items.length} PENDAFTARAN TERCATAT</div>
            <div className="dashboard-grid">
              {items.map((item) => <RegistrationCard key={item.key} item={item} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="site-root dashboard-root">
      <Navbar />
      <ProtectedRoute><DashboardContent /></ProtectedRoute>
    </div>
  );
}
