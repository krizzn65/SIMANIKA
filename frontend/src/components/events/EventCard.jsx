import Link from "next/link";
import { eventCategoryLabel, eventFeeLabel, registrationState } from "@/lib/events";
import { EventPoster } from "./EventPoster";

export function EventCard({ event, now }) {
  const state = registrationState(event, now);
  return (
    <Link
      className="event-card"
      prefetch={false}
      href={"/events/" + event.slug}
      aria-label={"Masuk ke " + event.judul}
    >
      <article>
        <EventPoster src={event.poster} title={event.judul} />
        <div className="event-card__body">
          <div className="event-card__tags">
            <span className="event-category">{eventCategoryLabel(event.kategori)}</span>
          </div>
          <div className="event-card__content">
            <h3>{event.judul}</h3>
            <p className="event-card__date">{event.tipePendaftaran === "tim" ? "Tim " + (event.minAnggota || "?") + "–" + (event.maxAnggota || "?") + " anggota" : "Individu"}</p>
            <p className="event-card__fee">{eventFeeLabel(event)}</p>
            <div className="event-card__bottom">
              <span className={"event-status event-status--" + state.key}>{state.label}</span>
              <span className="event-card__entry">Detail <span aria-hidden="true">→</span></span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
