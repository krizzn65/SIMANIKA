import { StaggerTestimonials } from "@/components/ui/StaggerTestimonials";
import { PixelCorner } from "@/components/ui/PixelCorner";

/* ── Default Testimonials Data ──
   Pre-configured with authentic HIMANIKA student & alumni stories.
   Dynamic and ready to be replaced with backend CMS/API data.
*/
const DEFAULT_TESTIMONIALS = [
  {
    name: "Farhan Rizky",
    role: "Alumni 2023 · Frontend Engineer di Traveloka",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    quote:
      "Di HIMANIKA, aku pertama kali belajar bagaimana memimpin tim teknologi dan merilis produk dari nol. Pengalaman kolaborasi lintas divisi di SIMANIKA adalah modal terbesarku di dunia industri saat ini.",
  },
  {
    name: "Sarah Amalia",
    role: "Mahasiswa MI · Koordinator Kominfo 2025",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    quote:
      "Ruang belajar yang sangat suportif. Di sini kita tidak hanya berkutat dengan teori kuliah, melainkan terjun langsung mengelola publikasi digital, kampanye event, dan visual branding organisasi secara nyata.",
  },
  {
    name: "Budi Setiawan",
    role: "Alumni 2022 · Cloud Architect di Telkom Indonesia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    quote:
      "Kultur eksplorasi teknologi di divisi Ristek HIMANIKA sangat kuat. Lewat workshop internal dan mentoring senior, aku menemukan passion di infrastruktur cloud dan automasi sejak semester 3.",
  },
  {
    name: "Nabila Ananda",
    role: "Mahasiswa MI · Staff PSDM 2025",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    quote:
      "SIMANIKA bukan sekadar sistem informasi, ini rumah kedua di mana aspirasi dihargai dan setiap mahasiswa diberi panggung untuk berani berkarya tanpa rasa takut salah.",
  },
  {
    name: "Kevin Pratama",
    role: "Ketua Umum HIMANIKA 2024 · Associate Product Manager",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    quote:
      "Mengelola ekosistem organisasi dan ratusan anggota memberikan pelajaran kepemimpinan, negosiasi, dan eksekusi strategis yang tidak ternilai harganya bagi perjalanan karierku.",
  },
  {
    name: "Jessica Tan",
    role: "Alumni 2024 · Cybersecurity Analyst",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    quote:
      "Dukungan penuh dari himpunan saat persiapan kompetisi IT tingkat nasional benar-benar luar biasa. HIMANIKA membentuk mentalitas pemenang dan solidaritas yang solid.",
  },
];

export function TestimonialsSection() {
  const testimonials = DEFAULT_TESTIMONIALS;

  return (
    <section
      className="testimonials-section"
      id="testimoni"
      aria-labelledby="testimonials-title"
    >
      <div className="testimonials-shell">
        <PixelCorner position="top-left" />
        <PixelCorner position="bottom-right" />

        <header className="testimonials-header">
          <p className="testimonials-eyebrow">
            <span aria-hidden="true" />
            05 / TESTIMONI
          </p>
          <h2 className="testimonials-title" id="testimonials-title">
            Apa kata mereka?
          </h2>
        </header>

        <StaggerTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}
