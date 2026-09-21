import Link from "next/link";
import { eventDate, registrationState } from "@/lib/events";
import { EventCountdown } from "./EventCountdown";
import { EventPoster } from "./EventPoster";

export function EventDetail({ event }) {
  const now = Date.now();
  const state = registrationState(event, now);
  const checkpoints = [
    ["Pendaftaran dibuka", event.bukaPendaftaran],
    ["Batas pendaftaran", event.deadlinePendaftaran],
    ["Pelaksanaan event", event.tanggalMulai],
    ["Event selesai", event.tanggalSelesai],
  ].filter(([, value]) => value);
  return <article className="event-detail event-container">
    <Link href="/events" className="event-back">← Semua event</Link>
    <header className="event-detail__heading"><span className="event-mono">HIMANIKA / {event.kategori.toUpperCase()}</span><h1>{event.judul}</h1></header>
    <div className="event-detail__grid">
      <div className="event-detail__content">
        <EventPoster src={event.poster} title={event.judul} eager />
        <section className="event-detail__section"><h2>Tentang event</h2><div className="event-description">{event.deskripsi || "Informasi lengkap event akan diumumkan oleh penyelenggara."}</div></section>
        {checkpoints.length > 0 && <section className="event-detail__section"><h2>Catat waktunya.</h2><ol className="event-timeline">{checkpoints.map(([title, value]) => <li key={title}><h3>{title}</h3><time dateTime={value}>{eventDate(value, true)}</time></li>)}</ol></section>}
        {event.syarat.length > 0 && <section className="event-detail__section"><h2>Sebelum ikut.</h2><ul className="event-detail__list">{event.syarat.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
        {event.hadiah.length > 0 && <section className="event-detail__section"><h2>Yang bisa kamu dapatkan.</h2><ul className="event-detail__list">{event.hadiah.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
      </div>
      <aside className="event-detail__aside" aria-label="Informasi pendaftaran">
        <div className="event-registration">
          <span className={`event-status event-status--${state.key}`}><span aria-hidden="true">{state.icon}</span> {state.label}</span>
          <h2>Satu langkah<br />untuk mulai.</h2>
          <dl>
            <div><dt>Waktu pelaksanaan</dt><dd>{eventDate(event.tanggalMulai, true)}</dd></div>
            <div><dt>Lokasi{event.tipe ? ` / ${event.tipe}` : ""}</dt><dd>{event.lokasi}</dd></div>
            <div><dt>Peserta</dt><dd>{event.tipePendaftaran === "tim" ? "Tim" : "Individu"}{event.tipePendaftaran === "tim" && event.minAnggota !== null && event.maxAnggota !== null && ` · ${event.minAnggota}–${event.maxAnggota} anggota`}</dd></div>
            {event.sisaKuota !== null && <div><dt>Ketersediaan</dt><dd>{event.sisaKuota} slot {event.tipePendaftaran === "tim" ? "tim" : "peserta"} tersisa</dd></div>}
            {event.deadlinePendaftaran && <div><dt>Batas pendaftaran</dt><dd>{eventDate(event.deadlinePendaftaran, true)}</dd></div>}
          </dl>
          {state.key === "open" && event.deadlinePendaftaran && <EventCountdown deadline={event.deadlinePendaftaran} initialNow={now} />}
          {state.key === "open" && event.registrationUrl ? <a className="event-button" href={event.registrationUrl} rel="nofollow">{event.tipePendaftaran === "tim" ? "Bentuk tim" : "Daftar sekarang"} <span aria-hidden="true">↗</span></a> : <p className="event-registration__notice">{state.key === "open" ? "Tautan pendaftaran akan diumumkan oleh penyelenggara." : state.key === "soon" ? "Pantau halaman ini untuk informasi pembukaan pendaftaran." : "Pendaftaran event ini sudah tidak tersedia."}</p>}
        </div>
      </aside>
    </div>
  </article>;
}
