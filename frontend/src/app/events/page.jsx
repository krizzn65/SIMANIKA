import { EventFilters } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { eventFilters } from "@/lib/events";
import { getEvents } from "@/services/eventService";

export const metadata = {
  title: "Event — SIMANIKA",
  description: "Temukan lomba, seminar, dan workshop HIMANIKA. Jelajahi agenda, jadwal, serta informasi pendaftaran event terbaru.",
};

export default async function EventsPage({ searchParams }) {
  const filters = eventFilters(await searchParams);
  const result = await getEvents(filters);
  return (
    <>
      <header className="events-hero event-container">
        <div className="events-hero__copy">
          <span className="event-mono events-eyebrow"><span aria-hidden="true" /> HIMANIKA / AGENDA & KEGIATAN</span>
          <h1>Di luar kelas,<br />ada <em>kesempatan.</em></h1>
          <p>Temukan tantangan baru, pertemukan ide, dan tumbuh bersama. Langkah berikutnya dimulai dari sini.</p>
          <a className="event-button" href="#agenda">Jelajahi event <span aria-hidden="true">↓</span></a>
        </div>
        <div className="events-ticket" aria-hidden="true">
          <div className="events-ticket__top event-mono"><span>YOUR NEXT CHAPTER</span><span>↗</span></div>
          <div className="events-ticket__art"><svg viewBox="0 0 160 130" fill="none"><path d="M30 20h100v90H30z" stroke="currentColor" strokeWidth="5"/><path d="M30 45h100M53 8v26M107 8v26" stroke="currentColor" strokeWidth="5"/><path d="M48 60h14v14H48zm24 0h14v14H72zm24 0h14v14H96zM48 84h14v14H48zm24 0h14v14H72z" fill="currentColor"/><path d="m112 76 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#155eef" stroke="currentColor" strokeWidth="3"/></svg></div>
          <strong>SHOW UP.<br />LEVEL UP.</strong>
          <div className="events-ticket__bottom"><span className="event-mono">BELAJAR / BERKARYA / BERTEMU</span><div className="events-ticket__barcode" /></div>
        </div>
      </header>
      <div className="events-signal" aria-hidden="true"><span>IDE BARU</span><b>+</b><span>RELASI BARU</span><b>+</b><span>PENGALAMAN BARU</span><b>↗</b><span>VERSI BARU DIRIMU</span></div>
      <div className="event-container events-directory">
        <EventFilters key={JSON.stringify(filters)} filters={filters} />
        <EventList result={result} filters={filters} />
      </div>
      <aside className="event-bottom-note event-container"><span className="event-mono">SETIAP PERTEMUAN, ADA CERITA.</span><p>Datang dengan rasa ingin tahu.<br /><strong>Pulang dengan sesuatu yang baru.</strong></p><a href="/#gallery">Kenali kegiatan HIMANIKA <span aria-hidden="true">↗</span></a></aside>
    </>
  );
}
