import { Suspense } from "react";
import { AlbumDetail } from "@/components/gallery/AlbumDetail";

export const metadata = { title: "Album Kegiatan — SIMANIKA" };

export default function AlbumPage() {
  return <Suspense fallback={null}><AlbumDetail /></Suspense>;
}
