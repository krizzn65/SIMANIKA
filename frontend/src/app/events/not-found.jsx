import Link from "next/link";

export default function EventNotFound() {
  return <div className="event-container event-route-message"><span className="event-mono">EVENT / 404</span><h1>Event tidak ditemukan.</h1><p>Event ini belum dipublikasikan, sudah dihapus, atau alamatnya telah berubah.</p><Link className="event-button" href="/events">Lihat semua event ↗</Link></div>;
}
