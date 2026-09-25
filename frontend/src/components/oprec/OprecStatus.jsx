"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { oprecState, oprecDate } from "@/lib/oprec";
import { OprecCountdown } from "./OprecCountdown";
import { OprecForm } from "./OprecForm";
import { OprecResult } from "./OprecResult";
import { OprecTestForm } from "./OprecTestForm";

export function OprecStatus({ oprec, stage = null, initialNow }) {
  const [now, setNow] = useState(initialNow);
  const router = useRouter();
  useEffect(() => {
    const update = () => { if (!document.hidden) { setNow(Date.now()); router.refresh(); } };
    const dates = [oprec?.tanggalBuka, oprec?.tanggalTutup, oprec?.pengumuman.tanggal, stage?.tanggalBuka, stage?.tanggalTutup].filter(Boolean).map(Date.parse).filter((date) => date > Date.now());
    const nextDate = dates.length ? Math.min(...dates) : null;
    // Refresh at lifecycle boundaries and once per minute; no per-second form renders.
    const boundary = nextDate ? setTimeout(update, Math.min(nextDate - Date.now() + 50, 2147483647)) : null;
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    setNow(Date.now());
    return () => { clearInterval(timer); clearTimeout(boundary); document.removeEventListener("visibilitychange", update); };
  }, [oprec, stage, router]);
  const state = oprecState(oprec, now);
  if (stage?.type === "test_tulis") {
    const start = Date.parse(stage.tanggalBuka);
    const end = Date.parse(stage.tanggalTutup);
    const phase = now < start ? "soon" : now >= end ? "closed" : "open";
    return <div className="oprec-stage"><div className="oprec-stage__intro"><span className="oprec-badge">TES TULIS · {phase === "open" ? "DIBUKA" : phase === "soon" ? "SEGERA" : "SELESAI"}</span><h3>{stage.headline}</h3><p>{stage.deskripsi || "Tes tulis untuk peserta OPREC yang telah mendaftar."}</p></div>{phase === "soon" && <OprecCountdown target={stage.tanggalBuka} initialNow={now} label="TES DIMULAI DALAM" />}{phase === "open" && <OprecTestForm stageId={stage.id} />}{phase === "closed" && <div className="oprec-stage__waiting"><p>Waktu tes tulis sudah berakhir. Pantau tahap pengumuman untuk hasil seleksi.</p></div>}</div>;
  }
  return <div className="oprec-stage">
    <div className="oprec-stage__intro"><span className={`oprec-badge oprec-badge--${state.key}`}><span aria-hidden="true">{state.key === "open" ? "●" : state.key === "announcement" ? "✓" : "◷"}</span>{state.label}</span><h3>{state.title}</h3><p>{state.message}</p></div>
    {state.target && <OprecCountdown key={state.target} target={state.target} initialNow={now} label={state.key === "soon" ? "PENDAFTARAN DIMULAI DALAM" : "PENGUMUMAN TERSEDIA DALAM"} />}
    {state.key === "open" && <OprecForm key={`${oprec.id}-${oprec.schemaVersion}`} oprec={oprec} />}
    {state.key === "announcement" && <OprecResult key={oprec.id} oprecId={oprec.id} />}
    {["empty", "closed"].includes(state.key) && !state.target && <div className="oprec-stage__waiting"><span aria-hidden="true">↗</span><p>{state.key === "closed" ? "Simpan NIM dan tanggal lahirmu. Keduanya digunakan untuk mengecek hasil seleksi saat pengumuman dibuka." : "Informasi terbaru akan muncul di sini setelah diumumkan oleh pengurus."}</p></div>}
    {oprec && state.key !== "open" && state.key !== "announcement" && <div className="oprec-stage__dates"><span>Periode {oprec.periode}</span>{oprec.tanggalBuka && <span>Mulai {oprecDate(oprec.tanggalBuka)}</span>}</div>}
  </div>;
}
