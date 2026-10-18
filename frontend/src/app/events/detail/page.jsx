import { Suspense } from "react";
import EventDetailContent from "./EventDetailContent";

export const metadata = { title: "Detail Event — SIMANIKA" };

export default function Page() {
  return <Suspense fallback={<p className="event-container">Memuat event...</p>}><EventDetailContent /></Suspense>;
}
