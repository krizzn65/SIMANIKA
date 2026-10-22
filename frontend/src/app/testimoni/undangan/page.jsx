"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { PENDING_INVITE_KEY } from "@/lib/testimonialInvite";
import "../../dashboard/dashboard.css";
import "../../events/events.css";

// Landing point of the testimonial link an admin shares: unlocks the form for this account.
function InviteContent() {
  const router = useRouter();
  const { checked, isAuthenticated, isAdmin } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("k");
    if (!token) { setError("Link testimoni tidak lengkap."); return; }
    if (!checked) return;
    if (!isAuthenticated) {
      // Kept for the dashboard to claim after login; Google sign-in drops ?next=.
      try { localStorage.setItem(PENDING_INVITE_KEY, token); } catch {}
      router.replace(`/login?next=${encodeURIComponent(`/testimoni/undangan?k=${token}`)}`);
      return;
    }
    if (isAdmin) { setError("Link ini untuk akun user. Akun pengurus tidak perlu mengisi testimoni."); return; }
    api.post("/user/testimonial/claim", { token })
      .then(() => {
        try { localStorage.removeItem(PENDING_INVITE_KEY); } catch {}
        router.replace("/dashboard/testimoni/");
      })
      .catch((cause) => setError(cause.response?.data?.message || cause.message || "Link testimoni belum bisa dibuka."));
  }, [checked, isAuthenticated, isAdmin, router]);

  return (
    <main className="dashboard-page" id="dashboard-content">
      <div className="dashboard-container" style={{ maxWidth: 640 }}>
        {error ? (
          <div className="event-form-feedback" role="alert"><h3>Link testimoni tidak bisa dipakai.</h3><p>{error}</p><Link href="/dashboard/">Ke dashboard</Link></div>
        ) : (
          <div className="dashboard-state" role="status"><span className="dashboard-state__loading" aria-hidden="true" /><p>Membuka formulir testimoni...</p></div>
        )}
      </div>
    </main>
  );
}

export default function TestimonialInvitePage() {
  return <div className="site-root dashboard-root"><Navbar /><InviteContent /></div>;
}
