import { ClipboardCheck } from "lucide-react";

export const metadata = {
  title: "Penilaian OPREC — SIMANIKA",
};

export default function OprecAssessmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-blue-600">OPREC · PENILAIAN</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Penilaian OPREC</h1>
        <p className="mt-2 text-sm text-slate-500">Ruang kerja penjurian peserta OPREC.</p>
      </header>

      <section className="border border-slate-200 bg-white px-6 py-10 sm:px-8" aria-labelledby="assessment-empty-title">
        <div className="flex max-w-2xl flex-col items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center border border-blue-200 bg-blue-50 text-blue-600" aria-hidden="true">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 id="assessment-empty-title" className="text-lg font-semibold text-slate-900">Penilaian belum dikonfigurasi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Halaman penjurian sudah tersedia. Kriteria, alur, dan hak penilai akan ditambahkan setelah aturannya ditetapkan.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
