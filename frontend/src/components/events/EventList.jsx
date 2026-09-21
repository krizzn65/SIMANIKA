import Link from "next/link";
import { eventListHref } from "@/lib/events";
import { EventCard } from "./EventCard";

export function EventList({ result, filters }) {
  const filtered = Boolean(filters.search || filters.kategori || filters.status || filters.page > 1);
  const now = Date.now();
  return (
    <section className="event-results" aria-label="Daftar kegiatan" id="agenda">
      {(filtered || result.events.length > 0) && (
        <div className="event-results__meta">
          <p role="status" aria-live="polite">{result.total} event{filtered ? " ditemukan" : " tersedia"}</p>
          {filtered && <Link className="event-reset" href="/events">Reset filter ↗</Link>}
        </div>
      )}
      {result.events.length ? (
        <div className="event-grid">{result.events.map((event) => <EventCard key={event.slug} event={event} now={now} />)}</div>
      ) : (
        <div className="event-empty">
          <div className="event-empty__inventory" aria-hidden="true"><span>+</span></div>
          <span className="event-mono">{filtered ? "PENCARIAN / 00" : "AGENDA / 00"}</span>
          <h3>{filtered ? "Belum ada yang cocok." : "Belum ada event saat ini."}</h3>
          <p>{filtered ? "Coba kata kunci lain atau hapus filter untuk melihat agenda lainnya." : "Belum ada event yang dipublikasikan. Kembali lagi nanti untuk menemukan kegiatan terbaru dari HIMANIKA."}</p>
          {filtered && (
            <Link className="event-button event-button--outline" href="/events">
              Lihat semua event<span aria-hidden="true">↗</span>
            </Link>
          )}
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
