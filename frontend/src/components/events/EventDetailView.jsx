import Link from "next/link";
import { eventDate, eventCategoryLabel, eventFeeLabel, registrationDeadlineLabel, registrationState } from "@/lib/events";
import { EventCountdown } from "./EventCountdown";
import { EventEnrollButton } from "./EventEnrollButton";
import { EventPoster } from "./EventPoster";
import { EventTimelineScroller } from "./EventTimelineScroller";

export function EventDetailView({ event }) {
  const now = Date.now();
  const state = registrationState(event, now);
  const timeline = event.timeline.length ? event.timeline : [
    event.bukaPendaftaran && { judul: "Pendaftaran dibuka", tanggal: event.bukaPendaftaran },
    event.deadlinePendaftaran && { judul: "Batas pendaftaran", tanggal: event.deadlinePendaftaran },
    event.tanggalMulai && { judul: "Pelaksanaan event", tanggal: event.tanggalMulai },
    event.tanggalSelesai && { judul: "Event selesai", tanggal: event.tanggalSelesai },
  ].filter(Boolean);

  return <article className="event-showcase event-container">
    <Link href="/events" className="event-showcase__back">← Kembali ke semua event</Link>

    <section className="event-showcase__hero" aria-labelledby="event-showcase-title">
      <div className="event-showcase__art"><EventPoster src={event.poster} title={event.judul} eager /></div>
      <div className="event-showcase__intro">
        <p className="event-showcase__eyebrow">{eventCategoryLabel(event.kategori).toUpperCase()} <span aria-hidden="true">/</span> HIMANIKA</p>
        <h1 id="event-showcase-title">{event.judul}</h1>
        <p className={"event-showcase__status event-showcase__status--" + state.key}>{state.label}</p>
        <div className="event-showcase__actions">
          {state.key === "open" && event.formFields.length > 0
            ? <EventEnrollButton event={event} />
            : <span className="event-showcase__unavailable">{state.key === "open" ? "Formulir sedang disiapkan" : state.key === "soon" ? "Pendaftaran segera dibuka" : "Pendaftaran tidak tersedia"}</span>}
          {event.guidebookUrl && <a className="event-showcase__guidebook" href={event.guidebookUrl} target="_blank" rel="noopener noreferrer">Guidebook <span aria-hidden="true">↗</span></a>}
        </div>
        <dl className="event-showcase__facts">
          <div><dt>Tempat</dt><dd>{event.lokasi}</dd></div>
          <div><dt>Peserta</dt><dd>{event.tipePendaftaran === "tim" ? "Tim" + (event.minAnggota && event.maxAnggota ? " · " + event.minAnggota + "–" + event.maxAnggota + " anggota" : "") : "Individu"}</dd></div>
          <div><dt>HTM</dt><dd>{eventFeeLabel(event)}</dd></div>
          {event.deadlinePendaftaran && <div><dt>{registrationDeadlineLabel(event)}</dt><dd>{eventDate(event.deadlinePendaftaran)}</dd></div>}
        </dl>
        {state.key === "open" && event.deadlinePendaftaran && <EventCountdown deadline={event.deadlinePendaftaran} initialNow={now} />}
      </div>
    </section>

    <div className="event-showcase__details">
      <section className="event-showcase__about" aria-labelledby="event-about-title">
        <div className="event-showcase__about-heading">
          <h2 id="event-about-title">Tentang {event.judul}</h2>
        </div>
        <div className="event-showcase__about-panel">
          <div className="event-description">{event.deskripsi || "Informasi lengkap event akan diumumkan oleh penyelenggara."}</div>
        </div>
      </section>
      {timeline.length > 0 && <section className="event-showcase__schedule" aria-labelledby="event-schedule-title">
        <header className="event-showcase__schedule-heading">
          <div>
            <h2 id="event-schedule-title">Timline</h2>
            <p>Simpan tanggal pentingnya agar tidak melewatkan setiap tahap event.</p>
          </div>
        </header>
        <EventTimelineScroller items={timeline} />
      </section>}
      {event.syarat.length > 0 && <section className="event-showcase__section">
        <div><h2>Sebelum ikut.</h2><ul className="event-detail__list">{event.syarat.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
      </section>}
      {event.hadiah.length > 0 && <section className="event-showcase__section">
        <div><h2>Yang bisa kamu dapatkan.</h2><ul className="event-detail__list">{event.hadiah.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
      </section>}
    </div>
  </article>;
}
