"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageSquare,
  Quote,
  Send,
  UserCheck,
  Lock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  EyeOff,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { publicApi } from "@/services/publicApi";

export default function TestimoniContent() {
  const { user, loading: authLoading } = useAuth();

  const [testimonials, setTestimonials] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [myTestimonials, setMyTestimonials] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);

  // Form states
  const [quote, setQuote] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Fetch public testimonials
  const fetchPublicTestimonials = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await publicApi.get("/public/testimonials");
      if (Array.isArray(res.data?.data)) {
        setTestimonials(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch logged in user's submitted testimonials
  const fetchMyTestimonials = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingMine(true);
      const res = await api.get("/user/testimonials");
      if (Array.isArray(res.data?.data)) {
        setMyTestimonials(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMine(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicTestimonials();
  }, [fetchPublicTestimonials]);

  useEffect(() => {
    if (user) {
      fetchMyTestimonials();
      fetchPublicTestimonials();
    }
  }, [user, fetchMyTestimonials]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      toast.error("Silakan masuk ke akun terlebih dahulu.");
      return;
    }

    const trimmedQuote = quote.trim();
    if (!trimmedQuote || trimmedQuote.length < 10) {
      toast.error("Testimoni minimal berisi 10 karakter.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        quote: trimmedQuote,
        angkatan: angkatan.trim() || undefined,
      };

      const res = await api.post("/user/testimonials", payload);
      toast.success(res.data?.message || "Testimoni berhasil dikirim!");
      setQuote("");
      setAngkatan("");
      setSubmittedSuccess(true);
      fetchMyTestimonials();
      fetchPublicTestimonials();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.quote?.[0] ||
        "Gagal mengirim testimoni. Silakan coba beberapa saat lagi.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = user ? user.nama || user.name || (user.email ? user.email.split("@")[0] : "Pengguna") : "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <div className="testimoni-container">
      {/* ── HERO BANNER ── */}
      <header className="testimoni-hero">
        <div className="testimoni-hero__eyebrow">
          <span aria-hidden="true" />
          <span>HIMANIKA / TESTIMONI</span>
        </div>
        <div className="testimoni-hero__row">
          <h1 className="testimoni-hero__title">
            Setiap perjalanan<br />
            <em>punya cerita.</em>
          </h1>
          <div className="testimoni-hero__aside">
            <p className="testimoni-hero__lead">
              Bagikan pengalamanmu bersama HIMANIKA. Ceritamu bisa menginspirasi langkah teman-teman berikutnya.
            </p>
            <a href="#tulis-testimoni" className="testimoni-btn testimoni-btn--primary testimoni-hero__button">
              <span>Bagikan Ceritamu</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: FORMULIR INPUT / AJAKAN LOGIN ── */}
      <section className="testimoni-form-section" id="tulis-testimoni">
        <div className="testimoni-box-frame">
          <div className="testimoni-form-wrapper">
            <aside className="testimoni-form-intro">
              <span className="testimoni-form-intro__index">01 / BAGIKAN CERITA</span>
              <div className="testimoni-form-header">
                <span className="testimoni-tag">KONTRIBUSI PENGALAMAN</span>
                <h2>Punya cerita berkesan selama di HIMANIKA?</h2>
                <p>
                  Tulis pengalamanmu dengan kata-katamu sendiri. Ceritamu dapat menjadi dorongan bagi teman yang baru memulai.
                </p>
              </div>
              <div className="testimoni-form-intro__note">
                <Sparkles size={18} aria-hidden="true" />
                <span>Nama akunmu akan tercantum bersama cerita yang kamu kirim.</span>
              </div>
            </aside>

            <div className="testimoni-form-panel">
              <div className="testimoni-form-panel__topline">
                <span>FORMULIR TESTIMONI</span>
                <span>02 / TULIS PENGALAMAN</span>
              </div>

            {authLoading ? (
              <div className="testimoni-auth-loading">
                <RefreshCw size={24} className="animate-spin" />
                <span>Memeriksa status akun...</span>
              </div>
            ) : !user ? (
              /* KONDISI BELUM LOGIN */
              <div className="testimoni-login-gate">
                <div className="testimoni-login-gate__icon-wrap">
                  <Lock size={32} />
                </div>
                <h3>Masuk Akun untuk Mengisi Testimoni</h3>
                <p>
                  Untuk memastikan keaslian ulasan dan melindungi komunitas dari spam, pengisian testimoni hanya dapat
                  dilakukan oleh mahasiswa atau pengguna yang telah memiliki akun SIMANIKA dan masuk ke sistem.
                </p>
                <div className="testimoni-login-gate__actions">
                  <Link href="/login?next=/testimoni" className="testimoni-btn testimoni-btn--primary">
                    <span>Masuk ke Akun Sekarang</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/register?next=/testimoni" className="testimoni-btn testimoni-btn--ghost">
                    <span>Belum punya akun? Daftar gratis</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* KONDISI SUDAH LOGIN */
              <div className="testimoni-authenticated-card">
                {/* User Identity Card */}
                <div className="testimoni-user-badge">
                  <div className="testimoni-user-avatar">
                    {user.fotoProfil ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.fotoProfil} alt={displayName} />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="testimoni-user-info">
                    <div className="testimoni-user-name-row">
                      <strong>{displayName}</strong>
                      <span className="testimoni-user-verified">
                        <UserCheck size={12} />
                        <span>Akun Terverifikasi</span>
                      </span>
                    </div>
                    <span className="testimoni-user-email">{user.email}</span>
                  </div>
                </div>

                {submittedSuccess ? (
                  <div className="testimoni-success-box">
                    <CheckCircle2 size={36} className="text-emerald-600" />
                    <h3>Testimoni Berhasil Ditampilkan!</h3>
                    <p>
                      Terima kasih atas ceritamu. Testimoni kamu sudah tersimpan dan langsung tampil di halaman ini serta
                      landing page SIMANIKA.
                    </p>
                    <div className="testimoni-success-actions">
                      <a href="#daftar-testimoni" className="testimoni-btn testimoni-btn--primary">
                        <Quote size={14} />
                        <span>Lihat Testimoni di Bawah</span>
                      </a>
                      <button
                        type="button"
                        className="testimoni-btn testimoni-btn--outline"
                        onClick={() => setSubmittedSuccess(false)}
                      >
                        <Sparkles size={14} />
                        <span>Tulis Testimoni Lain</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="testimoni-form">
                    <div className="testimoni-field-group">
                      <label htmlFor="testi-angkatan">
                        <span>Angkatan / Status / Peran</span>
                        <small>(Opsional, contoh: Angkatan 2024 · Anggota Humas, atau Alumni 2023)</small>
                      </label>
                      <input
                        id="testi-angkatan"
                        type="text"
                        maxLength={120}
                        placeholder="Contoh: Mahasiswa MIF 2024 / Alumni 2023"
                        value={angkatan}
                        onChange={(e) => setAngkatan(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <div className="testimoni-field-group">
                      <div className="testimoni-label-row">
                        <label htmlFor="testi-quote">
                          <span>Kutipan & Cerita Pengalaman <span className="testimoni-required">*</span></span>
                        </label>
                        <span className="testimoni-char-count">{quote.length} / 1500</span>
                      </div>
                      <textarea
                        id="testi-quote"
                        rows={5}
                        maxLength={1500}
                        placeholder="Tuliskan pengalaman berkesan, ilmu baru yang didapat, atau bagaimana HIMANIKA membantumu bertumbuh..."
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        disabled={submitting}
                        required
                      />
                      <span className="testimoni-field-hint">Minimal 10 karakter. Tulis dengan bahasa yang nyaman untukmu.</span>
                    </div>

                    <div className="testimoni-form-notice">
                      <Sparkles size={15} />
                      <span>
                        Testimoni yang kamu kirimkan akan langsung tampil ke publik. Admin berhak mengatur visibilitas
                        atau menyembunyikan komentar jika diperlukan.
                      </span>
                    </div>

                    <div className="testimoni-form-submit">
                      <button
                        type="submit"
                        className="testimoni-btn testimoni-btn--primary"
                        disabled={submitting || quote.trim().length < 10}
                      >
                        {submitting ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Mengirimkan...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Kirimkan Testimoni</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section className="testimoni-history-section" aria-labelledby="riwayat-testimoni-title">
          <div className="testimoni-history-heading">
            <div>
              <span className="testimoni-tag">CERITA YANG PERNAH DIKIRIM</span>
              <h2 id="riwayat-testimoni-title">Riwayat Pengisian</h2>
              <p>Lihat kembali testimoni yang pernah kamu kirim dan status tampilnya.</p>
            </div>
            {!loadingMine && <span className="testimoni-count-pill">{myTestimonials.length} testimoni</span>}
          </div>
          {loadingMine ? (
            <div className="testimoni-history-empty" role="status">Memuat riwayat testimoni...</div>
          ) : myTestimonials.length > 0 ? (
            <div className="testimoni-history-list">
              {myTestimonials.map((item) => (
                <article key={item.id} className="testimoni-history-card">
                  <div className="testimoni-history-top">
                    <span className="testimoni-history-role">{item.angkatan || "Mahasiswa HIMANIKA"}</span>
                    {!item.is_visible && (
                      <span className="testimoni-badge testimoni-badge--hidden">
                        <EyeOff size={11} />
                        <span>Disembunyikan oleh Admin</span>
                      </span>
                    )}
                  </div>
                  <p className="testimoni-history-quote">“{item.quote}”</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="testimoni-history-empty">Kamu belum pernah mengirim testimoni. Ceritamu akan tercatat di sini setelah dikirim.</div>
          )}
        </section>
      )}

      {/* ── SECTION 2: DAFTAR TESTIMONI PUBLIK ── */}
      <section className="testimoni-list-section" id="daftar-testimoni">
        <div className="testimoni-section-head">
          <div>
            <span className="testimoni-tag">KUMPULAN CERITA</span>
            <h2>Apa Kata Mereka?</h2>
            <p>Kesan jujur dari mereka yang pernah dan sedang berproses bersama HIMANIKA.</p>
          </div>
          <span className="testimoni-count-pill">{loadingList ? "Memuat cerita" : `${testimonials.length} cerita tayang`}</span>
        </div>

        {loadingList ? (
          <div className="testimoni-grid-loading">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p>Memuat kumpulan cerita...</p>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="testimoni-grid">
            {testimonials.map((item, index) => {
              const cardInitial = item.nama ? item.nama.charAt(0).toUpperCase() : "A";
              return (
                <article key={item.id} className="testimoni-card">
                  <div className="testimoni-card__top">
                    <span>CERITA / {String(index + 1).padStart(2, "0")}</span>
                    <Quote size={24} aria-hidden="true" />
                  </div>
                  <p className="testimoni-card__quote">{item.quote}</p>
                  <div className="testimoni-card__footer">
                    <div className="testimoni-card__avatar">
                      {item.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.foto_url} alt={item.nama} />
                      ) : (
                        <span>{cardInitial}</span>
                      )}
                    </div>
                    <div className="testimoni-card__meta">
                      <strong className="testimoni-card__name">{item.nama}</strong>
                      <span className="testimoni-card__role">{item.angkatan || "HIMANIKA"}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="testimoni-empty-state">
            <div className="testimoni-empty-icon">
              <MessageSquare size={32} />
            </div>
            <h3>Belum Ada Testimoni yang Ditampilkan</h3>
            <p>
              Jadilah orang pertama yang menginspirasi! Masuk ke akun Anda dan kirimkan pengalaman berhargamu di form di
              atas.
            </p>
            <a href="#tulis-testimoni" className="testimoni-btn testimoni-btn--primary">
              <Send size={14} />
              <span>Tulis Testimoni Pertama</span>
            </a>
          </div>
        )}
      </section>

      {/* ── FOOTER NOTE ── */}
      <aside className="testimoni-footer-note">
        <span className="testimoni-mono">SETIAP LANGKAH, ADA MAKNA.</span>
        <p>
          Terus bertumbuh, berkarya, dan memberi dampak.<br />
          <strong>HIMANIKA — Bergerak Bersama, Berkarya Nyata.</strong>
        </p>
        <Link href="/" className="testimoni-back-link">
          Kembali ke Beranda <span aria-hidden="true">↗</span>
        </Link>
      </aside>
    </div>
  );
}
