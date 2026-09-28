import { OprecWorkspace } from "./OprecWorkspace";

export const metadata = {
  title: "Pendaftaran OPREC | SIMANIKA",
  description: "Lengkapi formulir pendaftaran open recruitment HIMANIKA dan pantau status seleksimu.",
  robots: { index: false, follow: false },
};

export default async function DashboardOprecPage({ searchParams }) {
  const { oprec_id: oprecId } = (await searchParams) ?? {};
  return <OprecWorkspace oprecId={typeof oprecId === "string" ? oprecId : null} />;
}
