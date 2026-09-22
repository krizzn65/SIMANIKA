"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { currentUser, logout } from "@/services/authClient";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    currentUser().then((result) => {
      if (active) setUser(result.data);
    }).catch(() => {
      if (active) router.replace("/login");
    });
    return () => { active = false; };
  }, [router]);

  async function handleLogout() {
    setMessage("");
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal keluar. Coba lagi.");
    }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem", background: "#f4f7fb" }}>
      <section style={{ width: "min(100%, 560px)", padding: "2rem", background: "#fff", border: "1px solid #cad5e5" }}>
        <p style={{ color: "#0f4bcb", fontFamily: "IBM Plex Mono, monospace", fontSize: ".75rem" }}>SIMANIKA / DASHBOARD</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", margin: "1rem 0" }}>{user ? `Selamat datang${user.namaLengkap ? `, ${user.namaLengkap}` : ""}.` : "Memuat akun..."}</h1>
        {user && <p style={{ color: "#4a5568" }}>{user.email}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
          <Link href="/events" style={{ color: "#0f4bcb", textDecoration: "underline" }}>Lihat event</Link>
          <Link href="/oprec" style={{ color: "#0f4bcb", textDecoration: "underline" }}>Lihat OPREC</Link>
          {user && <button type="button" onClick={handleLogout} style={{ background: "#155eef", color: "#fff", border: 0, padding: ".65rem 1rem", cursor: "pointer" }}>Keluar</button>}
        </div>
        {message && <p role="alert">{message}</p>}
      </section>
    </main>
  );
}
