"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { VisiMisiSection } from "./VisiMisiSection";
import { DivisiSection } from "./DivisiSection";
import { GallerySection } from "./GallerySection";
import { TestimonialsSection } from "./TestimonialsSection";

export function LandingManagedSections() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    fetch(`${base.replace(/\/+$/, "")}/public/home`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (result?.data) setContent(result.data); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return <>
    <HeroSection tagline={content?.hero_tagline} subtitle={content?.hero_subtitle} />
    <AboutSection about={content?.about} />
    <VisiMisiSection visi={content?.visi} misi={content?.misi} />
    <DivisiSection />
    <GallerySection images={content?.gallery_managed ? content.gallery.map((item) => ({ imgUrl: item.image_url, alt: item.alt })) : undefined} />
    <TestimonialsSection testimonials={content?.testimonials_managed ? content.testimonials.map((item) => ({ text: item.quote, image: item.foto_url || "/images/logos/Logo-MIF-2020-nav.webp", name: item.nama, role: item.angkatan || "HIMANIKA" })) : undefined} />
  </>;
}
