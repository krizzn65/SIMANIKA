import { EventFilters } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { eventFilters } from "@/lib/events";
import { getEvents } from "@/services/eventService";

export const metadata = {
  title: "Event — SIMANIKA",
  description: "Temukan competition, seminar, dan workshop HIMANIKA. Jelajahi agenda, jadwal, serta informasi pendaftaran event terbaru.",
};

export default async function EventsPage({ searchParams }) {
  const filters = eventFilters(await searchParams);
  const result = await getEvents(filters);
  return (
    <>
      <div className="event-container events-directory">
        <header className="events-header">
          <span className="event-mono events-eyebrow">
            <span aria-hidden="true" />HIMANIKA / EVENTS
          </span>
        </header>
        <EventFilters key={JSON.stringify(filters)} filters={filters} />
        <EventList result={result} filters={filters} />
      </div>
      <aside className="event-bottom-note event-container"><span className="event-mono">SETIAP PERTEMUAN, ADA CERITA.</span><p>Datang dengan rasa ingin tahu.<br /><strong>Pulang dengan sesuatu yang baru.</strong></p><a href="/#gallery">Kenali kegiatan HIMANIKA <span aria-hidden="true">↗</span></a></aside>
    </>
  );
}
