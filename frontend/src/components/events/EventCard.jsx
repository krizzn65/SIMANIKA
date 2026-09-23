import Link from "next/link";
import { eventDate, registrationState } from "@/lib/events";
import { EventPoster } from "./EventPoster";

export function EventCard({ event, now }) {
  const state = registrationState(event, now);
  return (
    <article className="event-card">
      <EventPoster src={event.poster} title={event.judul} />
      <div className="event-card__body">
        <div className="event-card__tags"><span className="event-category">{event.kategori}</span><span>{event.tipePendaftaran === "tim" ? "Tim" : "Individu"}</span></div>
        <h3><Link prefetch={false} href={`/events/${event.slug}`}>{event.judul}</Link></h3>
        <p className="event-card__date">{eventDate(event.tanggalMulai, true)}</p>
        <p className="event-card__location">{event.tipe && <span>{event.tipe} · </span>}{event.lokasi}</p>
        <div className="event-card__bottom">
          <div><span className={`event-status event-status--${state.key}`}><span aria-hidden="true">{state.icon}</span> {state.label}</span></div>
          <Link className="event-card__arrow" prefetch={false} href={`/events/${event.slug}`} aria-label={`Lihat detail ${event.judul}`}>↗</Link>
        </div>
      </div>
    </article>
  );
}
