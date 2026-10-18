import { Suspense } from "react";
import EventWorkspaceContent from "./EventWorkspaceContent";

export const metadata = { title: "Detail Pendaftaran | SIMANIKA", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense fallback={<p>Memuat pendaftaran event...</p>}><EventWorkspaceContent /></Suspense>;
}
