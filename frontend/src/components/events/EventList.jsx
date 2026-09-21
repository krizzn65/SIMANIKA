import Link from "next/link";
import { eventListHref } from "@/lib/events";
import { EventCard } from "./EventCard";

export function EventList({ result, filters }) {
  const filtered = Boolean(filters.search || filters.kategori || filters.status || filters.page > 1);
  const now = Date.now();
  return (
    <section className="event-results" aria-labelledby="event-results-title" id="agenda">
      <div className="event-results__heading">
        <div><span className="event-mono">// PILIH LANGKAHMU</span><h2 id="event-results-title">{filtered ? "Hasil pencarianmu." : "Semua kesempatan."}</h2></div>
        <div className="event-results__count"><p role="status" aria-live="polite">{result.total} event{filtered ? " ditemukan" : " tersedia"}</p>{filtered && <Link className="event-reset" href="/events">Reset filter ↗</Link>}</div>
      </div>
      {result.events.length ? (
        <div className="event-grid">{result.events.map((event) => <EventCard key={event.slug} event={event} now={now} />)}</div>
      ) : (
        <div className="event-empty">
          <div className="event-empty__inventory" aria-hidden="true"><span>+</span></div>
          <span className="event-mono">{filtered ? "PENCARIAN / 00" : "AGENDA / 00"}</span>
          <h3>{filtered ? "Belum ada yang cocok." : "Cerita baru segera dimulai."}</h3>
          <p>{filtered ? "Coba kata kunci lain atau hapus filter untuk melihat agenda lainnya." : "Belum ada event yang dipublikasikan. Kembali lagi untuk menemukan kegiatan terbaru dari HIMANIKA."}</p>
          <Link className="event-button event-button--outline" href={filtered ? "/events" : "/#gallery"}>{filtered ? "Lihat semua event" : "Lihat keseruan sebelumnya"}<span aria-hidden="true">↗</span></Link>
        </div>
      )}
      {result.lastPage > 1 && <nav className="event-pagination" aria-label="Halaman daftar event">
        {result.currentPage > 1 ? <Link prefetch={false} href={eventListHref(filters, { page: result.currentPage - 1 })}>← Sebelumnya</Link> : <span aria-disabled="true">← Sebelumnya</span>}
        <span aria-current="page">{result.currentPage} / {result.lastPage}</span>
        {result.currentPage < result.lastPage ? <Link prefetch={false} href={eventListHref(filters, { page: result.currentPage + 1 })}>Berikutnya →</Link> : <span aria-disabled="true">Berikutnya →</span>}
      </nav>}
    </section>
  );
}
