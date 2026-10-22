import Link from "next/link";
import { eventListHref } from "@/lib/events";
import { EventCard } from "./EventCard";
import AnimatedContent from "@/components/ui/AnimatedContent";

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
        <AnimatedContent stagger={0.08} distance={50} className="event-grid">{result.events.map((event) => <EventCard key={event.slug} event={event} now={now} />)}</AnimatedContent>
      ) : (
        <div className="event-empty">
          <div className="event-empty__inventory" aria-hidden="true"><span>+</span></div>
          <span className="event-mono">{result.unavailable ? "AGENDA / TERJEDA" : filtered ? "PENCARIAN / 00" : "AGENDA / 00"}</span>
          <h3>{result.unavailable ? "Event belum bisa dimuat." : filtered ? "Belum ada yang cocok." : "Belum ada event saat ini."}</h3>
          <p>{result.unavailable ? "Layanan event sedang tidak merespons. Coba muat ulang halaman setelah beberapa saat." : filtered ? "Coba kata kunci lain atau hapus filter untuk melihat agenda lainnya." : "Belum ada event yang dipublikasikan. Kembali lagi nanti untuk menemukan kegiatan terbaru dari HIMANIKA."}</p>
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
