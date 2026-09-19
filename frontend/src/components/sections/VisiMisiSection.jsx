"use client";

import { useEffect, useRef } from "react";
import { MissionAccordion } from "@/components/ui/MissionAccordion";
import { ScrollRevealAccent } from "@/components/ui/ScrollRevealAccent";
import { InteractiveGrid } from "@/components/ui/InteractiveGrid";

const missions = [
  {
    index: "01",
    title: "Potensi SDM yang unggul",
    tag: "SDM",
    description:
      "Mengembangkan potensi SDM yang unggul serta membangun dan memelihara hubungan internal maupun eksternal.",
  },
  {
    index: "02",
    title: "Wadah aspirasi mahasiswa",
    tag: "ASPIRASI",
    description:
      "Menjadi wadah aspirasi mahasiswa Manajemen Informatika dalam seluruh bidang, khususnya teknologi informasi.",
  },
  {
    index: "03",
    title: "Jiwa kewirausahaan",
    tag: "INDUSTRI 4.0",
    description:
      "Membangun jiwa kewirausahaan yang kreatif dan mampu bersaing di era Industri 4.0.",
  },
  {
    index: "04",
    title: "Keterampilan berwirausaha",
    tag: "PROMOSI",
    description:
      "Meningkatkan keterampilan berwirausaha serta mengorganisasi acara-acara promosi dan pameran yang dihasilkan oleh pengurus HIMANIKA.",
  },
];

function VisionVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="metadata"
      className="vision-video"
      src="/videos/animasi logo.mp4"
    />
  );
}

export function VisiMisiSection() {
  return (
    <section className="vision-section" id="visi-misi" aria-labelledby="vision-title">
      <div className="vision-shell">
        <InteractiveGrid />

        <div className="vision-pixel-field" aria-hidden="true">
          <i className="vision-pixel-field__node vision-pixel-field__node--one" />
          <i className="vision-pixel-field__node vision-pixel-field__node--two" />
          <i className="vision-pixel-field__node vision-pixel-field__node--three" />
          <i className="vision-pixel-field__node vision-pixel-field__node--four" />
        </div>

        <p className="vision-eyebrow">
          <span aria-hidden="true" />
          02 / VISI &amp; MISI
        </p>

        <h2 className="vision-title" id="vision-title">
          Menjadi <ScrollRevealAccent text="wadah inovasi" /> dan{" "}
          <ScrollRevealAccent text="pengembangan SDM" /> yang unggul secara
          progresif dan berbasis entrepreneur dengan pemanfaatan teknologi
          informasi.
        </h2>

        <div className="vision-content">
          <div className="vision-video-panel">
            <VisionVideo />
          </div>

          <MissionAccordion items={missions} />
        </div>

        <p className="vision-footer-copy">
          KAMI TIDAK SEKADAR MENYUSUN PROGRAM; KAMI MEMBANGUN RUANG YANG
          MENGUBAH IDE MENJADI KARYA, DAN KARYA MENJADI DAMPAK.
        </p>
      </div>
    </section>
  );
}
