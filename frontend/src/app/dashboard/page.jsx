"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { DashboardEventActions } from "./DashboardEventActions";
import "../events/events.css";
import "./dashboard.css";
import "./dashboard-actions.css";

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

function RegistrationCard({ item, onComplete }) {
  const type = item.kind === "oprec" ? "OPEN RECRUITMENT" : item.kind === "team" ? "COMPETITION / TIM" : "EVENT / COMPETITION";
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
      <DashboardEventActions item={item} onComplete={onComplete} />
      <div className="dashboard-entry__bottom">
        <span>{date ? (item.kind === "oprec" ? "Pengumuman" : "Pelaksanaan") + " · " + date : "Pendaftaran tercatat"}</span>
        <Link href={item.href}>Lihat detail <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/admin");
    }
  }, [user?.role, router]);

  useEffect(() => {
    if (!user || user?.role === "admin") return;
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
  }, [user?.id, user?.role, attempt]);

  if (user?.role === "admin") {
    return null;
  }

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
              {items.map((item) => <RegistrationCard key={item.key} item={item} onComplete={() => setAttempt((value) => value + 1)} />)}
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
