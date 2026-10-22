"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
import { publicApi } from "@/services/publicApi";
import { formatAlbumDate, validAlbumSlug } from "@/lib/galleryAlbums";
import AnimatedContent from "@/components/ui/AnimatedContent";

export function AlbumList() {
  const [state, setState] = useState({ loading: true, albums: [], error: false });

  useEffect(() => {
    const controller = new AbortController();
    publicApi.get("/public/gallery-albums", { signal: controller.signal })
      .then(({ data }) => setState({ loading: false, albums: (Array.isArray(data?.data) ? data.data : []).filter((album) => validAlbumSlug(album?.slug)), error: false }))
      .catch(() => { if (!controller.signal.aborted) setState({ loading: false, albums: [], error: true }); });
    return () => controller.abort();
  }, []);

  if (state.loading) {
    return (
      <div className="galeri-grid" role="status" aria-busy="true" aria-label="Memuat album">
        {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton galeri-card-skeleton" />)}
      </div>
    );
  }

  if (!state.albums.length) {
    return (
      <div className="galeri-empty">
        <span className="galeri-mono">{state.error ? "GALERI / TERJEDA" : "GALERI / 00"}</span>
        <h2>{state.error ? "Galeri belum bisa dimuat." : "Belum ada dokumentasi."}</h2>
        <p>{state.error ? "Coba muat ulang halaman setelah beberapa saat." : "Dokumentasi kegiatan akan tampil di sini setelah diunggah pengurus."}</p>
      </div>
    );
  }

  return (
    <AnimatedContent stagger={0.08} distance={50} className="galeri-grid">
      {state.albums.map((album) => (
        <Link key={album.id} className="galeri-card" href={`/galeri/detail?slug=${album.slug}`}>
          <div className="galeri-card__cover">
            {album.cover_url
              ? <img src={album.cover_url} alt="" loading="lazy" decoding="async" />
              : <span className="galeri-card__placeholder" aria-hidden="true"><Images size={32} /></span>}
            <span className="galeri-card__count galeri-mono">{album.photo_count} FOTO</span>
          </div>
          <div className="galeri-card__body">
            {album.event_date && <span className="galeri-mono galeri-card__date">{formatAlbumDate(album.event_date)}</span>}
            <h2>{album.title}</h2>
            {album.description && <p>{album.description}</p>}
          </div>
        </Link>
      ))}
    </AnimatedContent>
  );
}
