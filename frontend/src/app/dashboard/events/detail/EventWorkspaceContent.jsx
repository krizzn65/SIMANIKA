"use client";

import { useSearchParams } from "next/navigation";
import EventWorkspace from "../EventWorkspace";

export default function EventWorkspaceContent() {
  const id = useSearchParams().get("id");
  return id ? <EventWorkspace eventId={id} /> : <p role="alert">Event tidak ditemukan.</p>;
}
