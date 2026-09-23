"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
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

        {user?.role === "admin" && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(21, 94, 239, 0.08), rgba(21, 94, 239, 0.16))",
            border: "1px solid rgba(21, 94, 239, 0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>⚡</span>
              <div>
                <strong style={{ display: "block", fontSize: "0.88rem", color: "#155eef" }}>Anda teridentifikasi sebagai Administrator</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Akses seluruh sistem, kelola event, dan verifikasi OPREC melalui Admin Console.</span>
              </div>
            </div>
            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 1rem",
                borderRadius: "10px",
                background: "#155eef",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(21, 94, 239, 0.35)"
              }}
            >
              <span>Buka Admin Console</span>
              <span>→</span>
            </Link>
          </div>
        )}

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
            <div className="dashboard-state__mark">
              <CalendarPlusIcon size={48} />
            </div>
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
