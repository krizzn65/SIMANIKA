import EventWorkspace from "./EventWorkspace";

export const metadata = { title: "Detail Pendaftaran | SIMANIKA", robots: { index: false, follow: false } };

export default async function Page({ params }) {
  const { id } = await params;
  return <EventWorkspace eventId={id} />;
}
