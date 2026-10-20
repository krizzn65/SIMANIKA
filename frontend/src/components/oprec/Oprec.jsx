import { AnnouncementCard } from "./announcement/AnnouncementCard";
import { OprecPreview } from "./OprecPreview";
import { OprecFaq } from "./OprecFaq";
import { divisionPreview } from "./divisionPreview";
import { InView } from "@/components/motion/InView";

const defaultFaq = [
  { pertanyaan: "Bagaimana cara mendaftar OPREC?", jawaban: "Saat pendaftaran dibuka, formulir akan tampil di bagian pendaftaran pada halaman ini. Lengkapi kolom yang diminta, unggah berkas jika diperlukan, lalu kirim. Pastikan kamu melihat konfirmasi bahwa pendaftaran berhasil diterima." },
  { pertanyaan: "Apa yang perlu saya siapkan?", jawaban: "Gunakan NIM dan tanggal lahir yang benar karena keduanya digunakan untuk mengecek hasil seleksi. Data dan berkas lainnya mengikuti formulir untuk periode rekrutmen yang sedang dibuka." },
  { pertanyaan: "Bagaimana cara melihat hasil seleksi?", jawaban: "Setelah jadwal pengumuman tiba, tekan Lihat Pengumuman pada kartu merah di bawah Pendaftaran. Masukkan NIM dan tanggal lahir yang sama dengan data saat mendaftar untuk melihat hasil seleksimu." },
];

const divisionLogos = new Map(divisionPreview.filter((division) => division.logo).map((division) => [division.nama.toLowerCase(), division.logo]));
const divisionNames = new Map(divisionPreview.map((division) => [division.nama.toLowerCase(), division.namaLengkap]));

function DivisionLogo({ division }) {
  const logo = division.logo || divisionLogos.get(division.nama.toLowerCase());
  return <span className="oprec-division__logo">
    {logo ? <img src={logo} width="72" height="72" loading="lazy" decoding="async" alt={`Logo ${division.nama}`} /> : (
      <svg viewBox="0 0 48 48" fill="none" aria-label={`Simbol ${division.nama}`} role="img">
        <rect x="4" y="8" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="3" />
        <path d="m13 19 7 6-7 6M24 31h11" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        <path d="M4 14h40" stroke="currentColor" strokeWidth="3" />
      </svg>
    )}
  </span>;
}

export function Oprec({ oprec, onRefresh }) {
  const faq = oprec?.faq.length ? oprec.faq : defaultFaq;
  const hasOpenDivisions = Boolean(oprec?.divisiTersedia.length);
  const divisions = hasOpenDivisions ? oprec.divisiTersedia : divisionPreview;
  return <>
    <header className="oprec-hero oprec-container">
      <span className="oprec-mono oprec-eyebrow"><span aria-hidden="true" />HIMANIKA / OPEN RECRUITMENT</span>
      <InView className="oprec-hero__row"><h1>{oprec?.headline || <>Ambil peran.<br /><em>Mulai ceritamu.</em></>}</h1><div><p>{oprec?.deskripsi || "Ada tempat untuk idemu, ruang untuk belajar, dan teman untuk melangkah bersama. Temukan peranmu di HIMANIKA."}</p><a className="oprec-button oprec-hero__button" href="#pendaftaran">Lihat pendaftaran & pengumuman <span aria-hidden="true">↗</span></a></div></InView>
    </header>
    <section className="oprec-divisions oprec-container" id="divisi-oprec" aria-labelledby="division-heading">
      <div className="oprec-section-heading"><div><h2 id="division-heading">Temukan tempatmu.</h2></div></div>
      {!hasOpenDivisions && <p className="oprec-division-context">Setiap divisi di HIMANIKA punya peran dan fokusnya masing-masing. Kenali lebih dekat dan temukan ruang terbaik untuk kamu berkarya serta berkembang.</p>}
      <InView stagger className="oprec-division-grid">{divisions.map((division, i) => {
        const namaLengkap = division.namaLengkap || divisionNames.get(division.nama.toLowerCase());
        return <article className="oprec-division" key={`${division.id}-${i}`}>
          <div className="oprec-division__top"><DivisionLogo division={division} /><span className="oprec-division__number oprec-mono">{String(i + 1).padStart(2, "0")}</span></div>
          <h3>{division.nama}</h3>
          {namaLengkap && <span className="oprec-division__full">{namaLengkap}</span>}
          <p>{division.deskripsi || "Informasi peran divisi akan diumumkan oleh pengurus."}</p>
        </article>;
      })}</InView>
    </section>
    <section className="oprec-registration-section" id="pendaftaran" aria-labelledby="registration-heading"><div className="oprec-container">
      <div className="oprec-section-heading"><div><h2 id="registration-heading">Pendaftaran & pengumuman.</h2></div></div>
      <OprecPreview key={oprec?.poster || "no-poster"} oprec={oprec ? { ...oprec, pengumuman: { published: false, tanggal: null, pesan: "" } } : null} initialNow={Date.now()} onRefresh={onRefresh} />
      {oprec?.announcement && <AnnouncementCard key={oprec.id} periodId={oprec.id} period={oprec.periode} announcement={oprec.announcement} serverNow={oprec.serverNow || new Date().toISOString()} />}
    </div></section>
    <section className="oprec-faq-section oprec-container" id="faq-oprec" aria-labelledby="faq-heading"><InView><h2 id="faq-heading">Masih penasaran?</h2><p>Hal-hal yang perlu kamu tahu<br />sebelum mengambil langkah pertama.</p></InView><OprecFaq faq={faq} /></section>
  </>;
}
