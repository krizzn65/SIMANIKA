import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/events/EventDetailView";
import { getEvent } from "@/services/eventService";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event tidak ditemukan — SIMANIKA" };
  return { title: `${event.judul} — SIMANIKA`, description: event.deskripsi.slice(0, 160) || `Informasi ${event.judul}, jadwal, dan pendaftaran event HIMANIKA.` };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  return <EventDetailView event={event} />;
}
