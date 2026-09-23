"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export function EventEnrollButton({ event }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function enroll() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const { data } = await api.post(`/user/events/${event.id}/enroll`);
      if (data?.data?.enrolled !== true) throw new Error("Pendaftaran belum dapat dipastikan.");
      router.push(`/dashboard?event=${event.id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/events/${event.slug}`)}`);
        return;
      }
      setError(err.message || "Pendaftaran belum berhasil. Coba lagi.");
      setPending(false);
    }
  }

  return <div>
    <button type="button" className="event-button" onClick={enroll} disabled={pending} aria-busy={pending}>
      {pending ? "Memproses…" : "Daftar"}
    </button>
    {error && <p className="event-registration__notice" role="alert">{error}</p>}
  </div>;
}
