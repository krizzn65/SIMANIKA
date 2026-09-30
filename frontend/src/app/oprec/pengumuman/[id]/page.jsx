import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/oprec/announcement/Primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hasil Seleksi OPREC — SIMANIKA", robots: { index: false, follow: false } };

export default async function AnnouncementResultPage({ params }) {
  const { id } = await params;
  const ticket = /^\d+$/.test(id) ? (await cookies()).get(`oprec_result_${id}`)?.value : null;
  let result = null;
  let failed = false;
  if (ticket) {
    try {
      const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${base?.replace(/\/+$/, "")}/public/oprec/${id}/announcement/result`, {
        method: "POST", body: JSON.stringify({ ticket }), headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store", signal: AbortSignal.timeout(15000), redirect: "error",
      });
      if (response.ok) result = (await response.json()).data;
      else failed = response.status >= 500 || response.status === 429;
    } catch { failed = true; }
  }
  if (!result) return <div className="oa-result"><Card className="oa-result-card"><span className="oa-eyebrow">Hasil seleksi OPREC</span><h1>{failed ? "Hasil belum dapat dimuat." : "Periksa identitasmu kembali."}</h1><p className="oa-result-intro">{failed ? "Layanan sedang sibuk. Tunggu sebentar, lalu muat ulang halaman ini." : "Sesi verifikasi belum tersedia atau sudah berakhir. Masukkan NIM dan tanggal lahir melalui kartu Pengumuman."}</p><Link href="/oprec#pengumuman" className="oa-button oa-button--outline">Kembali ke Pengumuman</Link></Card></div>;
  const accepted = result.status === "accepted";
  return <div className="oa-result"><Card className={`oa-result-card ${accepted ? "" : "oa-result-card--rejected"}`}>
    <span className="oa-eyebrow">HIMANIKA · Hasil seleksi {result.period}</span>
    <h1>{accepted ? "Selamat, kamu diterima!" : "Terima kasih atas perjuanganmu."}</h1>
    <p className="oa-result-intro">{accepted ? "Perjalanan barumu bersama HIMANIKA dimulai di sini. Kami menantikan kontribusi dan ide-ide terbaikmu." : "Mohon maaf, kamu belum diterima pada periode ini. Hasil ini tidak mengurangi potensi yang kamu miliki. Tetap semangat belajar, berkarya, dan mencoba kesempatan berikutnya."}</p>
    <span className={`oa-badge ${accepted ? "oa-badge--live" : ""}`}>{accepted && <CheckCircle2 size={14} style={{ marginRight: 6 }} />} {accepted ? "Diterima" : "Belum diterima"}</span>
    <dl className="oa-result-grid"><div><dt>Nama</dt><dd>{result.name}</dd></div><div><dt>NIM</dt><dd>{result.nim}</dd></div>{accepted && <><div><dt>Divisi penerimaan</dt><dd>{result.division || "Belum tercatat"}</dd></div><div><dt>Jabatan</dt><dd>{result.position || "Belum tercatat"}</dd></div></>}</dl>
    <div className="oa-result-footer"><Link href="/oprec#pengumuman">Kembali ke OPREC</Link>{accepted && /^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]+(?:\?[^\s]*)?$/.test(result.whatsapp_url || "") && <a className="oa-button oa-button--primary" href={result.whatsapp_url} target="_blank" rel="noopener noreferrer">Gabung grup WhatsApp <ArrowUpRight size={17} /></a>}</div>
  </Card></div>;
}
