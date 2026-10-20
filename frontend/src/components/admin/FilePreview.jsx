"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { downloadErrorMessage, fetchAuthenticatedFile, saveObjectUrl } from "@/lib/downloadFile";
import "./file-preview.css";

// Opens protected registration/test files in an in-page viewer (images and
// PDF render inline; other types fall back to a download button).
export function useFilePreview() {
  const [file, setFile] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState("");
  const dialog = useRef(null);

  async function openPreview(url, name) {
    if (!url || loadingUrl) return;
    setLoadingUrl(url);
    try {
      const { blob, objectUrl, headerName } = await fetchAuthenticatedFile(url);
      setFile({ objectUrl, type: blob.type, name: name || headerName || "Berkas" });
    } catch (error) {
      toast.error(downloadErrorMessage(error));
    } finally {
      setLoadingUrl("");
    }
  }

  useEffect(() => {
    if (!file) return undefined;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      URL.revokeObjectURL(file.objectUrl);
    };
  }, [file]);

  const kind = file?.type.startsWith("image/") ? "image" : file?.type === "application/pdf" ? "pdf" : "other";
  const preview = file && (
    <dialog ref={dialog} className="file-preview" aria-labelledby="file-preview-title" onClose={() => setFile(null)} onClick={(event) => { if (event.target === event.currentTarget) setFile(null); }}>
      <div className="file-preview__card">
        <header className="file-preview__header">
          <h2 id="file-preview-title">{file.name}</h2>
          <button type="button" className="file-preview__button" onClick={() => saveObjectUrl(file.objectUrl, file.name)}><Download size={15} aria-hidden="true" /> Unduh</button>
          <button type="button" className="file-preview__close" onClick={() => setFile(null)} aria-label="Tutup pratinjau"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="file-preview__body">
          {kind === "image" && <img src={file.objectUrl} alt={file.name} />}
          {kind === "pdf" && <iframe src={file.objectUrl} title={file.name} />}
          {kind === "other" && <p>Pratinjau tidak tersedia untuk jenis berkas ini. Gunakan tombol Unduh untuk membukanya.</p>}
        </div>
      </div>
    </dialog>
  );

  return { openPreview, loadingUrl, preview };
}

export function PreviewButton({ url, label, loadingUrl, onPreview, className }) {
  const loading = loadingUrl === url;
  return (
    <button type="button" className={className} disabled={Boolean(loadingUrl)} onClick={onPreview} aria-label={`Lihat ${label}`}>
      {loading ? <Loader2 size={14} className="file-preview__spin" aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
      <span>{loading ? "Membuka…" : "Lihat"}</span>
    </button>
  );
}
