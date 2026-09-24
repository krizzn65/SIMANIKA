import Link from "next/link";
import { eventDate, eventCategoryLabel, registrationState } from "@/lib/events";
import { EventCountdown } from "./EventCountdown";
import { EventPoster } from "./EventPoster";
import { EventEnrollButton } from "./EventEnrollButton";

export function EventDetail({ event }) {
  const now = Date.now();
  const state = registrationState(event, now);
  // Build merged timeline checkpoints ensuring no date is dropped and all are chronologically sorted
  const timelineMap = new Map();

  // 1. Add custom timeline items if provided
  if (Array.isArray(event.timeline)) {
    for (const item of event.timeline) {
      if (item && item.judul && item.tanggal) {
        timelineMap.set(item.judul.trim().toLowerCase(), {
          judul: item.judul.trim(),
          tanggal: item.tanggal,
        });
      }
    }
  }

  // 2. Add lifecycle dates if not already present by keyword or matching timestamp
  const hasItemMatching = (pattern) => {
    for (const key of timelineMap.keys()) {
      if (pattern.test(key)) return true;
    }
    return false;
  };

  const hasDateMatching = (targetDate) => {
    if (!targetDate) return false;
    const targetStr = String(targetDate).slice(0, 10);
    for (const item of timelineMap.values()) {
      if (item.tanggal && String(item.tanggal).slice(0, 10) === targetStr) {
        return true;
      }
    }
    return false;
  };

  if (event.bukaPendaftaran && !hasItemMatching(/buka|pembukaan|awal/i) && !hasDateMatching(event.bukaPendaftaran)) {
    timelineMap.set("buka pendaftaran", { judul: "Pendaftaran dibuka", tanggal: event.bukaPendaftaran.slice(0, 10) });
  }
  if (event.deadlinePendaftaran && !hasItemMatching(/batas|deadline|tutup|selesai pendaftaran/i) && !hasDateMatching(event.deadlinePendaftaran)) {
    timelineMap.set("batas pendaftaran", { judul: "Batas pendaftaran", tanggal: event.deadlinePendaftaran.slice(0, 10) });
  }
  if (event.tanggalMulai && !hasItemMatching(/pelaksanaan|mulai/i) && !hasDateMatching(event.tanggalMulai)) {
    timelineMap.set("pelaksanaan event", { judul: "Pelaksanaan event", tanggal: event.tanggalMulai.slice(0, 10) });
  }
  if (event.tanggalSelesai && !hasItemMatching(/(event|acara)?\s*(selesai|penutupan)(?! pendaftaran)/i) && !hasDateMatching(event.tanggalSelesai)) {
    timelineMap.set("event selesai", { judul: "Event selesai", tanggal: event.tanggalSelesai.slice(0, 10) });
  }

  // 3. Sort chronologically by date
  const checkpoints = Array.from(timelineMap.values())
    .filter((item) => item.judul && item.tanggal && !isNaN(new Date(item.tanggal).getTime()))
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .map((item) => [item.judul, String(item.tanggal).slice(0, 10)]);
  return <article className="event-detail event-container">
    <Link href="/events" className="event-back">← Semua event</Link>
    <header className="event-detail__heading"><span className="event-mono">HIMANIKA / {eventCategoryLabel(event.kategori).toUpperCase()}</span><h1>{event.judul}</h1></header>
    <div className="event-detail__grid">
      <div className="event-detail__content">
        <EventPoster src={event.poster} title={event.judul} eager />
        <section className="event-detail__section"><h2>Tentang event</h2><div className="event-description">{event.deskripsi || "Informasi lengkap event akan diumumkan oleh penyelenggara."}</div></section>
        {checkpoints.length > 0 && <section className="event-detail__section"><h2>Catat waktunya.</h2><ol className="event-timeline">{checkpoints.map(([title, value]) => <li key={title}><h3>{title}</h3><time dateTime={value}>{eventDate(value)}</time></li>)}</ol></section>}
        {event.syarat.length > 0 && <section className="event-detail__section"><h2>Sebelum ikut.</h2><ul className="event-detail__list">{event.syarat.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
        {event.hadiah.length > 0 && <section className="event-detail__section"><h2>Yang bisa kamu dapatkan.</h2><ul className="event-detail__list">{event.hadiah.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
      </div>
      <aside className="event-detail__aside" aria-label="Informasi pendaftaran">
        <div className="event-registration">
          <span className={`event-status event-status--${state.key}`}><span aria-hidden="true">{state.icon}</span> {state.label}</span>
          <h2>Satu langkah<br />untuk mulai.</h2>
          <dl>
            <div><dt>Waktu pelaksanaan</dt><dd>{eventDate(event.tanggalMulai)}</dd></div>
            <div><dt>Lokasi{event.tipe ? ` / ${event.tipe}` : ""}</dt><dd>{event.lokasi}</dd></div>
            <div><dt>Peserta</dt><dd>{event.tipePendaftaran === "tim" ? "Tim" : "Individu"}{event.tipePendaftaran === "tim" && event.minAnggota !== null && event.maxAnggota !== null && ` · ${event.minAnggota}–${event.maxAnggota} anggota`}</dd></div>
            {event.deadlinePendaftaran && <div><dt>Batas pendaftaran</dt><dd>{eventDate(event.deadlinePendaftaran)}</dd></div>}
          </dl>
          {state.key === "open" && event.deadlinePendaftaran && <EventCountdown deadline={event.deadlinePendaftaran} initialNow={now} />}
          {state.key === "open" && event.formFields.length > 0 ? <EventEnrollButton event={event} /> : <p className="event-registration__notice">{state.key === "open" ? "Formulir pendaftaran sedang disiapkan." : state.key === "soon" ? "Pantau halaman ini untuk informasi pembukaan pendaftaran." : "Pendaftaran event ini sudah tidak tersedia."}</p>}
        </div>
      </aside>
    </div>
  </article>;
}
