"use client";

import { useEffect, useRef, useState } from "react";
import { MissionAccordion } from "@/components/ui/MissionAccordion";
import { ScrollRevealAccent } from "@/components/ui/ScrollRevealAccent";
import { InteractiveGrid } from "@/components/ui/InteractiveGrid";
import { ReplayIcon } from "@/components/ui/ReplayIcon";

const missions = [
  {
    index: "01",
    title: "Wadah aspirasi",
    tag: "ASPIRASI",
    description:
      "Menampung aspirasi mahasiswa Manajemen Informatika di semua angkatan, khususnya di bidang teknologi informasi, dan menindaklanjutinya secara terbuka.",
  },
  {
    index: "02",
    title: "Skill dan karier",
    tag: "KARIER",
    description:
      "Menyelenggarakan pelatihan di bidang teknologi informasi yang relevan dengan kebutuhan industri, serta menghubungkan mahasiswa dengan alumni dan mitra industri untuk persiapan magang dan portofolio.",
  },
  {
    index: "03",
    title: "Jembatan prestasi",
    tag: "PRESTASI",
    description:
      "Menjadi jembatan bagi mahasiswa untuk berprestasi, melalui pendampingan, informasi, dan fasilitasi mengikuti kompetisi di tingkat kampus, nasional, hingga internasional.",
  },
  {
    index: "04",
    title: "Karakter dan wirausaha",
    tag: "WIRAUSAHA",
    description:
      "Membangun mahasiswa yang berintegritas, kolaboratif, dan berjiwa wirausaha lewat organisasi yang solid dan kekeluargaan.",
  },
];

function VisionVideo() {
  const videoRef = useRef(null);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Play video from beginning or resume if not finished yet
          if (!video.ended) {
            video.play().catch(() => {});
          }
        } else {
          // Pause if scrolled away while playing
          if (!video.ended) {
            video.pause();
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleEnded = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setIsEnded(true);
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video || !isEnded) return;

    setIsEnded(false);
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  return (
    <div className="vision-video-wrapper">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        className="vision-video"
        src="/videos/animasi-logo.mp4"
        onEnded={handleEnded}
      />
      <button
        type="button"
        className={`vision-replay-btn ${isEnded ? "vision-replay-btn--active" : "vision-replay-btn--disabled"}`}
        disabled={!isEnded}
        onClick={handleReplay}
        aria-label={isEnded ? "Putar ulang video" : "Video sedang diputar"}
        title={isEnded ? "Putar ulang video dari awal" : "Video sedang berjalan"}
      >
        <ReplayIcon size={12} className="vision-replay-btn__icon" />
        <span className="vision-replay-btn__text">Replay</span>
      </button>
    </div>
  );
}

export function VisiMisiSection({ visi, misi }) {
  const displayedMissions = missions.map((mission, index) => ({ ...mission, description: misi?.[index] || mission.description }));
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
          {visi ? visi : <>
            Menjadi rumah tumbuh bagi mahasiswa Manajemen Informatika Polije
            untuk menjadi <ScrollRevealAccent text="talenta digital terapan" />:
            siap kerja, cakap data dan AI, berjiwa wirausaha, dan{" "}
            <ScrollRevealAccent text="berdampak bagi masyarakat" />.
          </>}
        </h2>

        <div className="vision-content">
          <div className="vision-video-panel">
            <VisionVideo />
          </div>

          <MissionAccordion items={displayedMissions} />
        </div>

        <p className="vision-footer-copy">
          KAMI TIDAK SEKADAR MENYUSUN PROGRAM; KAMI MEMBANGUN RUANG YANG
          MENGUBAH IDE MENJADI KARYA, DAN KARYA MENJADI DAMPAK.
        </p>
      </div>
    </section>
  );
}
