import { OprecWorkspace } from "./OprecWorkspace";

export const metadata = {
  title: "Pendaftaran OPREC | SIMANIKA",
  description: "Lengkapi formulir pendaftaran open recruitment HIMANIKA dan pantau status seleksimu.",
  robots: { index: false, follow: false },
};

export default function DashboardOprecPage() {
  return <OprecWorkspace />;
}
