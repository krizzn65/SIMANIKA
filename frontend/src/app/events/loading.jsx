export default function EventsLoading() {
  return <div className="event-container event-loading" role="status" aria-label="Memuat informasi event" aria-busy="true"><p className="event-mono">MEMUAT AGENDA…</p><div className="event-skeleton event-skeleton--heading" /><div className="event-skeleton event-skeleton--toolbar" /><div className="event-grid" aria-hidden="true">{[0, 1, 2].map((item) => <div key={item} className="event-skeleton event-skeleton--card" />)}</div></div>;
}
