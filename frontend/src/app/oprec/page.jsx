import { Oprec } from "@/components/oprec/Oprec";
import { getOprec } from "@/services/oprecService";

export const metadata = {
  title: "OPREC — SIMANIKA",
  description: "Kenali divisi HIMANIKA dan lihat pratinjau open recruitment terbaru beserta status pendaftarannya.",
};

export default async function OprecPage() {
  return <Oprec oprec={await getOprec()} />;
}
