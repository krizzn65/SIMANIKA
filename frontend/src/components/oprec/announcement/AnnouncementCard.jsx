"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button, Card } from "./Primitives";
import { RollingCountdown } from "./RollingCountdown";
import { ResultLookup } from "./ResultLookup";
import { formatAnnouncementDate } from "@/lib/oprecAnnouncement.mjs";

export function AnnouncementCard({ periodId, period, announcement, serverNow }) {
  const [data, setData] = useState(announcement);
  const [clock, setClock] = useState(serverNow);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef(null);
  const refreshing = useRef(false);
  useEffect(() => { setData(announcement); setClock(serverNow); }, [announcement, serverNow]);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const response = await fetch(`/api/oprec/announcement/${periodId}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error();
      const body = await response.json();
      setData(body.data); setClock(body.server_now); setError("");
    } catch { setError("Status belum dapat diperbarui. Coba periksa kembali."); }
    finally { refreshing.current = false; }
  }, [periodId]);
  useEffect(() => {
    const resume = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [refresh]);
  if (!data?.exists) return null;
  return <><Card className="oa-public-card" id="pengumuman">
    <div className="oa-public-content"><span className="oa-eyebrow">Hasil seleksi · {period}</span><h3>{data.title}</h3>
      <p className="oa-muted"><CalendarDays size={15} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 8 }} />{formatAnnouncementDate(data.release_at)}</p>
      <p className="oa-muted">{data.released ? (data.description || "Terima kasih sudah menjadi bagian dari proses seleksi HIMANIKA. Hasilmu sudah tersedia.") : "Perjalanan berikutnya segera dimulai. Hasil seleksi dapat dilihat sesuai jadwal berikut."}</p>
      {!data.released && data.release_at && clock && <RollingCountdown target={data.release_at} serverNow={clock} onElapsed={refresh} />}
      {error && <p className="oa-error" role="alert">{error} <button type="button" onClick={refresh}>Periksa kembali</button></p>}
      <div style={{ marginTop: 24 }}><Button ref={trigger} variant="red" disabled={!data.released} onClick={() => setOpen(true)}>{data.released ? "Lihat Pengumuman" : "Pengumuman belum dibuka"}<ArrowRight size={16} /></Button></div>
    </div>
    <div className="oa-public-art">{data.poster_url ? <img src={data.poster_url} alt={`Poster ${data.title}`} loading="lazy" /> : <span>HIMANIKA<br />PENGUMUMAN<br />{period}</span>}</div>
  </Card><ResultLookup periodId={periodId} open={open} onOpenChange={setOpen} triggerRef={trigger} /></>;
}
