"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { currentUser, resendVerification } from "@/services/authClient";
import "../register/register.css";
import "../reset-password/recovery.css";

export default function VerifyEmailPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    currentUser()
      .then((response) => setUser(response?.data ?? null))
      .catch((error) => {
        if (error.response?.status !== 401) setMessage("Status akun belum dapat diperiksa. Muat ulang halaman ini.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function resend() {
    if (sending) return;
    setSending(true);
    setMessage("");
    try {
      await resendVerification();
      setMessage("Permintaan pengiriman berhasil diproses. Periksa kotak masuk dan folder spam.");
    } catch (error) {
      setMessage(error?.response?.status === 404
        ? "Layanan kirim ulang verifikasi belum tersedia. Hubungi pengelola situs."
        : error instanceof Error ? error.message : "Email belum dapat dikirim. Coba lagi nanti.");
    } finally {
      setSending(false);
    }
  }

  const verified = Boolean(user?.emailVerifiedAt);

  return (
    <main className="register-page recovery-page">
      <div className="register-card recovery-card">
        <div className="register-heading">
          <p className="register-eyebrow">SIMANIKA / VERIFIKASI EMAIL</p>
          <h1>Periksa <em>emailmu.</em></h1>
          <p>{verified ? "Alamat email berhasil diverifikasi." : "Verifikasi alamat email sebelum menggunakan akunmu."}</p>
        </div>
        <div className="recovery-notice" role="status">
          <p className="recovery-notice__text">
            {loading ? "Memeriksa akun..." : verified
              ? "Akun siap digunakan. Silakan lanjutkan."
              : user
                ? `Jika menerima email verifikasi di ${user.email}, buka tautannya. Jika belum, coba kirim ulang di bawah ini.`
                : "Masuk ke akunmu untuk mengirim ulang tautan verifikasi."}
          </p>
          {message && <p className="recovery-notice__text" role="alert">{message}</p>}
        </div>
        {!loading && !verified && user && (
          <button className="register-submit" type="button" disabled={sending} onClick={resend}>
            {sending ? "Mengirim..." : "Kirim ulang tautan"}
          </button>
        )}
        <p className="register-login">
          <Link href={verified && user ? "/dashboard" : "/login"}>{verified && user ? "Lanjut ke dashboard" : "Masuk ke akun"}</Link>
        </p>
      </div>
    </main>
  );
}
