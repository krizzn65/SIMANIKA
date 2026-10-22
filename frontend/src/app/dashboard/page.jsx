"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { STAFF_ROLES, adminHome } from "@/lib/roleAccess";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { UsersRound } from "lucide-react";
import { eventCategoryLabel } from "@/lib/events";
import { PENDING_INVITE_KEY } from "@/lib/testimonialInvite";
import "../events/events.css";
import "./dashboard.css";
import "./dashboard-actions.css";

const statusLabels = {
  pending: "Menunggu proses",
  join_pending: "Menunggu ketua",
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
  const type = item.kind === "oprec" ? "OPEN RECRUITMENT" : eventCategoryLabel(item.category || item.subtitle);
  const date = formatDate(item.date);
  const statusTone = ["accepted", "rejected"].includes(item.status) ? item.status : "pending";
  const memberCount = Number(item.teamMembers);
  const minimum = Number(item.teamMin);
  const maximum = Number(item.teamMax);
  const showTeamProgress = item.kind === "team" && item.teamMembers != null && Number.isFinite(memberCount) && Number.isFinite(maximum) && maximum > 0;
  const progress = showTeamProgress ? Math.min(100, Math.max(0, memberCount / maximum * 100)) : 0;
  const teamReady = showTeamProgress && memberCount >= minimum;
  const paymentLabel = item.paymentType === "paid" ? (item.paymentStatus === "paid" ? "Paid" : "Unpaid") : "Free";
  const paymentTone = paymentLabel.toLowerCase();
  return (
    <article className="dashboard-entry">
      <div className="dashboard-entry__top">
        <span className="dashboard-entry__type">{type}</span>
        {item.kind !== "oprec" && (
          <span className={"dashboard-entry__status dashboard-entry__status--" + statusTone}>
            {statusLabels[item.status] || "Terdaftar"}
          </span>
        )}
      </div>
      <div className="dashboard-entry__body">
        <h2>{item.title}</h2>
        {item.kind === "oprec" && <p>{item.subtitle}</p>}
        {item.kind === "team" && item.teamName && <p>{item.teamName}{item.teamCode && <> · Kode: {item.teamCode}</>}</p>}
        {showTeamProgress && (
          <div className="dashboard-entry__team-progress" aria-label={"Anggota tim " + memberCount + " dari maksimal " + maximum + ". Minimal " + minimum + " anggota."}>
            <span className="dashboard-entry__team-count"><UsersRound size={17} aria-hidden="true" /> {memberCount}/{maximum}</span>
            <span className="dashboard-entry__team-track" aria-hidden="true"><span className={teamReady ? "is-ready" : "is-waiting"} style={{ width: progress + "%" }} /></span>
          </div>
        )}
      </div>
      <div className="dashboard-entry__bottom">
        <span className={item.kind === "oprec" ? undefined : "dashboard-entry__payment dashboard-entry__payment--" + paymentTone}>{item.kind === "oprec" ? (date ? "Pengumuman · " + date : "Pendaftaran tercatat") : paymentLabel}</span>
        <Link href={item.href?.startsWith("/dashboard/events/") ? `/dashboard/events/detail?id=${encodeURIComponent(item.href.split("/")[3])}` : item.href}>Lihat detail <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}

// A testimonial link opened before signing in is kept in the browser and claimed
// here, so it survives the login (including Google, which drops ?next=).
async function loadTestimonial() {
  let token = null;
  try { token = localStorage.getItem(PENDING_INVITE_KEY); } catch {}
  if (token) {
    await api.post("/user/testimonial/claim", { token }).catch(() => {});
    try { localStorage.removeItem(PENDING_INVITE_KEY); } catch {}
  }
  const { data } = await api.get("/user/testimonial");
  return data?.data ?? null;
}

// Shown only to accounts that opened the testimonial link shared by an admin.
function TestimonialCard({ submitted }) {
  return (
    <article className="dashboard-entry dashboard-entry--testimonial">
      <div className="dashboard-entry__top">
        <span className="dashboard-entry__type">TESTIMONI</span>
        {submitted && <span className="dashboard-entry__status dashboard-entry__status--accepted">Terkirim</span>}
      </div>
      <div className="dashboard-entry__body">
        <h2>Ceritakan pengalamanmu di HIMANIKA</h2>
        <p>{submitted ? "Terima kasih, testimonimu sudah kami terima." : "Tulis kesan singkatmu dan unggah foto profil untuk ditampilkan di website SIMANIKA."}</p>
      </div>
      <div className="dashboard-entry__bottom">
        <span>{submitted ? "Testimoni sudah dikirim" : "Undangan dari pengurus"}</span>
        {!submitted && <Link href="/dashboard/testimoni/">Isi testimoni <span aria-hidden="true">↗</span></Link>}
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
  const [testimonial, setTestimonial] = useState(null);

  useEffect(() => {
    if (STAFF_ROLES.includes(user?.role)) {
      router.replace(adminHome(user?.role));
    }
  }, [user?.role, router]);

  useEffect(() => {
    if (!user || STAFF_ROLES.includes(user?.role)) return;
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

  useEffect(() => {
    if (!user || STAFF_ROLES.includes(user?.role)) return;
    loadTestimonial().then(setTestimonial).catch(() => setTestimonial(null));
  }, [user?.id, user?.role]);

  if (STAFF_ROLES.includes(user?.role)) {
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
        ) : items.length === 0 && !testimonial?.open ? (
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
              {testimonial?.open && <TestimonialCard submitted={testimonial.submitted} />}
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
