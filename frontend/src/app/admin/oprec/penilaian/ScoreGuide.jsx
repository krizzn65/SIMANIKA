import { Info } from "lucide-react";

const bands = [
  ["neutral", "Kosong", "Belum dinilai"],
  ["red", "0–<5", "Merah"],
  ["amber", "5–<8", "Kuning"],
  ["green", "8–<10", "Hijau"],
  ["blue", "10", "Biru"],
];

export default function ScoreGuide() {
  return <section className="assessment-guide" aria-labelledby="assessment-guide-title">
    <div className="assessment-guide__intro">
      <Info size={18} aria-hidden="true" />
      <div><h2 id="assessment-guide-title">Panduan penilaian</h2><p>Isi 0–10, maksimal satu desimal. Contoh: 7,5.</p></div>
    </div>
    <ul className="assessment-guide__bands" aria-label="Rentang warna nilai">
      {bands.map(([tone, range, label]) => <li key={tone} className={`assessment-band assessment-band--${tone}`}><strong>{range}</strong><span>{label}</span></li>)}
    </ul>
    <p className="assessment-guide__note">Nilai <strong>0 tetap dihitung</strong>. Total = jumlah enam nilai ÷ 60 × 100. Rata-rata memakai Total penilai yang sudah melengkapi enam aspek, pada skala 0–100.</p>
  </section>;
}
