"use client";

export default function EventsError({ reset }) {
  return <div className="event-container event-route-message" role="alert"><span className="event-mono">AGENDA / BELUM TERHUBUNG</span><h1>Agenda belum bisa dimuat.</h1><p>Terjadi kendala saat mengambil informasi event. Coba muat ulang sebentar lagi.</p><button type="button" className="event-button" onClick={reset}>Coba lagi ↗</button></div>;
}
