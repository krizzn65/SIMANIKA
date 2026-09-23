"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export function EventResponses({ event, fields }) {
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event?.id) return;
    let active = true;
    setLoading(true); setError("");
    api.get("/admin/events/" + event.id + "/registrants", { params: { page } })
      .then(({ data }) => {
        if (!active) return;
        setRecords(data.data || []);
        setLastPage(data.last_page || 1);
      })
      .catch((err) => { if (active) setError(err.message || "Gagal memuat jawaban."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [event?.id, page]);

  async function download(url, label) {
    try {
      const response = await api.get(url, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl; link.download = label; link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) { setError(err.message || "Berkas belum bisa diunduh."); }
  }

  return <section className="event-builder-responses">
    <div><span className="event-builder-eyebrow">DATA PENDAFTAR</span><h2>Jawaban peserta</h2><p>{event.tipePendaftaran === "tim" ? "Satu respons per tim." : "Satu respons per peserta."}</p></div>
    {error && <p role="alert" className="event-builder-error">{error}</p>}
    {loading ? <p role="status">Memuat jawaban…</p> : records.length ? <div className="event-builder-response-list">{records.map((record) => <article key={record.id}>
      <header><strong>{record.name || "Tanpa nama"}</strong><span>{record.status}</span><small>{record.email}</small></header>
      <dl>{fields.map((field) => {
        const answer = record.answers?.[field.name];
        const file = record.files?.[field.name];
        if (answer == null && !file) return null;
        return <div key={field.name}><dt>{field.label}</dt><dd>{file ? <button type="button" onClick={() => download(file, "event-" + record.id + "-" + field.name)}>Unduh lampiran</button> : String(answer)}</dd></div>;
      })}</dl>
    </article>)}</div> : <p>Belum ada pendaftar.</p>}
    {lastPage > 1 && <div className="event-builder-pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>Halaman {page} / {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Berikutnya</button></div>}
  </section>;
}
