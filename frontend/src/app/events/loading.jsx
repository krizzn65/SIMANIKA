import { EventPageSkeleton } from "@/components/events/EventSkeletons";

export default function Loading() {
  return <div className="event-container events-directory"><EventPageSkeleton /></div>;
}
