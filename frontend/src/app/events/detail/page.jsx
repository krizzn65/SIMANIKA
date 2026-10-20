import { Suspense } from "react";
import EventDetailContent from "./EventDetailContent";
import { EventDetailSkeleton } from "@/components/events/EventSkeletons";

export const metadata = { title: "Detail Event — SIMANIKA" };

export default function Page() {
  return <Suspense fallback={<EventDetailSkeleton />}><EventDetailContent /></Suspense>;
}
