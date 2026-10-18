import { Suspense } from "react";
import AnnouncementResultContent from "./AnnouncementResultContent";

export const metadata = { title: "Hasil Seleksi OPREC — SIMANIKA", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense fallback={<p>Memuat hasil seleksi...</p>}><AnnouncementResultContent /></Suspense>;
}
