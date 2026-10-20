"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, FolderOpen, X } from "lucide-react";
import { publicApi } from "@/services/publicApi";
import { formatAlbumDate, safeDriveUrl, validAlbumSlug } from "@/lib/galleryAlbums";
import { InView } from "@/components/motion/InView";
import { useScrollLock } from "@/components/motion/SmoothScroll";

function Lightbox({ photos, index, onChange, onClose }) {
  useScrollLock(true);
  const go = useCallback((step) => onChange((index + step + photos.length) % photos.length), [index, photos.length, onChange]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const photo = photos[index];
  return (
    <div className="galeri-lightbox" role="dialog" aria-modal="true" aria-label={`Foto ${index + 1} dari ${photos.length}`} data-lenis-prevent onClick={(event) => event.target === event.currentTarget && onClose()}>
      <button type="button" className="galeri-lightbox__close" onClick={onClose} aria-label="Tutup foto" autoFocus><X size={22} aria-hidden="true" /></button>
      {photos.length > 1 && <button type="button" className="galeri-lightbox__nav galeri-lightbox__nav--prev" onClick={() => go(-1)} aria-label="Foto sebelumnya"><ChevronLeft size={26} aria-hidden="true" /></button>}
      <img src={photo.image_url} alt={photo.alt || ""} />
      {photos.length > 1 && <button type="button" className="galeri-lightbox__nav galeri-lightbox__nav--next" onClick={() => go(1)} aria-label="Foto berikutnya"><ChevronRight size={26} aria-hidden="true" /></button>}
      <span className="galeri-lightbox__count galeri-mono">{index + 1} / {photos.length}</span>
    </div>
  );
}

export function AlbumDetail() {
  const slug = useSearchParams().get("slug");
  const [state, setState] = useState({ loading: true, album: null, error: "" });
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!validAlbumSlug(slug)) {
      setState({ loading: false, album: null, error: "Album tidak ditemukan." });
      return undefined;
    }
    const controller = new AbortController();
    setState({ loading: true, album: null, error: "" });
    publicApi.get(`/public/gallery-albums/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ data }) => setState({ loading: false, album: data?.data ?? null, error: data?.data ? "" : "Album tidak ditemukan." }))
      .catch((error) => { if (!controller.signal.aborted) setState({ loading: false, album: null, error: error.response?.status === 404 ? "Album tidak ditemukan." : "Album belum bisa dimuat. Coba lagi nanti." }); });
    return () => controller.abort();
  }, [slug]);

  const back = <Link className="galeri-back" href="/galeri"><ArrowLeft size={16} aria-hidden="true" /> Semua album</Link>;

  if (state.loading) {
    return (
      <div className="galeri-container galeri-directory" role="status" aria-busy="true" aria-label="Memuat album">
        <span className="skeleton skeleton--title" style={{ width: "40%", marginBottom: "2rem" }} />
        <div className="galeri-photos">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton galeri-photo-skeleton" />)}</div>
      </div>
    );
  }

  if (!state.album) {
    return (
      <div className="galeri-container galeri-directory">
        {back}
        <div className="galeri-empty"><h2>{state.error}</h2></div>
      </div>
    );
  }

  const { album } = state;
  const photos = album.photos || [];
  const driveUrl = safeDriveUrl(album.drive_url);

  return (
    <div className="galeri-container galeri-directory">
      {back}
      <InView as="header" className="galeri-header galeri-header--album">
        <span className="galeri-mono galeri-eyebrow"><span aria-hidden="true" />{album.event_date ? formatAlbumDate(album.event_date).toUpperCase() : "GALERI KEGIATAN"} · {photos.length} FOTO</span>
        <h1>{album.title}</h1>
        {album.description && <p>{album.description}</p>}
        {driveUrl && (
          <a className="galeri-drive" href={driveUrl} target="_blank" rel="noopener noreferrer">
            <FolderOpen size={18} aria-hidden="true" /> Lihat dokumentasi lengkap di Google Drive <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </InView>

      {photos.length ? (
        <InView stagger className="galeri-photos">
          {photos.map((photo, index) => (
            <button key={photo.id} type="button" className="galeri-photo" onClick={() => setOpen(index)} aria-label={`Perbesar foto ${index + 1}${photo.alt ? `: ${photo.alt}` : ""}`}>
              <img src={photo.image_url} alt={photo.alt || ""} loading={index < 6 ? "eager" : "lazy"} decoding="async" />
            </button>
          ))}
        </InView>
      ) : (
        <div className="galeri-empty"><p>Belum ada foto di album ini{driveUrl ? ", lihat dokumentasi lengkap di Google Drive." : "."}</p></div>
      )}

      {open !== null && photos[open] && <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
