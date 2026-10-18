import { Suspense } from "react";
import DashboardOprecContent from "./DashboardOprecContent";

export const metadata = {
  title: "Pendaftaran OPREC | SIMANIKA",
  description: "Lengkapi formulir pendaftaran open recruitment HIMANIKA dan pantau status seleksimu.",
  robots: { index: false, follow: false },
};

export default function DashboardOprecPage() {
  return <Suspense fallback={<p>Memuat pendaftaran OPREC...</p>}><DashboardOprecContent /></Suspense>;
}
