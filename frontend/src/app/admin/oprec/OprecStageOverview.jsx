"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Plus, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../AdminErrorNotice";
import OprecCreateDialog from "./OprecCreateDialog";

const labels = {
  test_tulis: { title: "Tes tulis", description: "Atur jadwal, poster, dan pertanyaan seleksi pada periode yang dipilih." },
  pengumuman: { title: "Pengumuman", description: "Atur jadwal dan informasi hasil seleksi. Hasil hanya muncul saat tahap diterbitkan." },
};

function date(value) {
  return value ? new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "Belum diatur";
}

export default function OprecStageOverview({ type }) {
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const config = labels[type];

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/admin/oprec");
      const list = response.data?.data || [];
      setPeriods(list);
      setPeriodId((current) => list.some((item) => String(item.id) === current) ? current : String(list[0]?.id || ""));
    } catch (reason) { setError(reason.message || "Gagal memuat tahapan OPREC."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  const period = periods.find((item) => String(item.id) === periodId);
  const stage = period?.stages?.find((item) => item.type === type);

  return <section className="oprec-review">
    <div className="oprec-review__header"><div><span className="oprec-review__eyebrow">KELOLA OPREC / {config.title.toUpperCase()}</span><h1>{config.title}</h1><p>{config.description}</p></div><Link className="oprec-review__back" href="/admin/oprec">Kembali ke pendaftaran</Link></div>
    <div className="oprec-review__filters"><label>Periode<select value={periodId} onChange={(event) => setPeriodId(event.target.value)} disabled={loading}>
      {!periods.length && <option value="">Belum ada periode</option>}{periods.map((item) => <option key={item.id} value={item.id}>{item.periode}</option>)}
    </select></label><button type="button" className="oprec-review__refresh" onClick={reload} disabled={loading}><RefreshCw aria-hidden="true" size={16} className={loading ? "animate-spin" : ""} /> Muat ulang</button></div>
    <AdminErrorNotice message={error} onRetry={reload} />
    {!loading && !period && !error && <div className="oprec-review__empty">Buat periode pendaftaran dahulu sebelum menambahkan {config.title.toLowerCase()}. <Link href="/admin/oprec">Buka pendaftaran</Link></div>}
    {period && <div className="oprec-review__panel oprec-review__stage-panel"><div className="oprec-review__panel-head"><div><h2>{stage?.headline || `${config.title} belum dibuat`}</h2><p>Periode {period.periode} · {stage ? stage.published ? "Sudah terbit" : "Belum terbit" : "Tahap belum tersedia"}</p></div><span className="oprec-review__legend">{stage?.published ? "Aktif sesuai jadwal" : "Draft"}</span></div>
      {stage ? <div className="oprec-review__stage-body"><p>{stage.deskripsi || "Belum ada deskripsi."}</p><dl><div><dt>Mulai</dt><dd>{date(stage.tanggalBuka)}</dd></div>{type === "test_tulis" && <div><dt>Selesai</dt><dd>{date(stage.tanggalTutup)}</dd></div>}{type === "test_tulis" && <div><dt>Pertanyaan</dt><dd>{stage.formFields?.length || 0} isian</dd></div>}</dl><div className="oprec-review__stage-actions"><button type="button" className="oprec-review__back" onClick={() => { setEditingStage(stage); setDialogOpen(true); }}><Pencil aria-hidden="true" size={16} /> Edit informasi</button>{type === "test_tulis" && <Link href={`/admin/oprec/${period.id}/stages/${stage.id}/form`} className="oprec-review__back">Kelola soal <ArrowRight aria-hidden="true" size={16} /></Link>}</div></div>
      : <div className="oprec-review__stage-body"><p>Belum ada tahap {config.title.toLowerCase()} untuk periode ini.</p><button type="button" className="oprec-review__back" onClick={() => { setEditingStage(null); setDialogOpen(true); }}><Plus aria-hidden="true" size={17} /> Tambah {config.title.toLowerCase()}</button></div>}
    </div>}
    <OprecCreateDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingStage(null); }} onCreated={reload} selectedOprec={period} editingStage={editingStage} initialType={type} />
  </section>;
}
