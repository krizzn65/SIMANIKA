export function EventGridSkeleton() {
  return (
    <div className="event-results" role="status" aria-busy="true" aria-label="Memuat daftar event">
      <span className="skeleton skeleton--line" style={{ width: "8rem", marginBottom: "1.25rem" }} />
      <div className="event-grid" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="skeleton event-card-skeleton">
            <span className="skeleton--glow skeleton--line" style={{ width: "40%" }} />
            <span className="skeleton--glow skeleton--title" />
            <span className="skeleton--glow skeleton--line" style={{ width: "65%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventPageSkeleton() {
  return (
    <>
      <div className="skeleton event-toolbar-skeleton" aria-hidden="true" />
      <EventGridSkeleton />
    </>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="event-container event-detail-skeleton" role="status" aria-busy="true" aria-label="Memuat detail event">
      <div className="skeleton event-detail-skeleton__art" aria-hidden="true" />
      <div className="event-detail-skeleton__body" aria-hidden="true">
        <span className="skeleton skeleton--line" style={{ width: "30%" }} />
        <span className="skeleton skeleton--title" />
        <span className="skeleton skeleton--title" style={{ width: "70%" }} />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line" style={{ width: "55%" }} />
        <span className="skeleton skeleton--button" />
      </div>
    </div>
  );
}
