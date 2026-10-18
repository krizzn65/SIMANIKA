"use client";

import { useSearchParams } from "next/navigation";
import EventBuilder from "../EventBuilder";

export default function EventBuilderContent() {
  const id = useSearchParams().get("id");
  return id ? <EventBuilder id={id} /> : <p role="alert">Event tidak ditemukan.</p>;
}
