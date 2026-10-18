"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Button, Card } from "./Primitives";
import { RollingCountdown } from "./RollingCountdown";
import { ResultLookup } from "./ResultLookup";
import { OprecPoster } from "../OprecPoster";
import { publicApi } from "@/services/publicApi";

export function AnnouncementCard({ periodId, period, announcement, serverNow }) {
  const [data, setData] = useState(announcement);
  const [clock, setClock] = useState(serverNow);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef(null);
  const refreshing = useRef(false);
  useEffect(() => { setData(announcement); setClock(serverNow); }, [announcement, serverNow]);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const { data: body } = await publicApi.get(`/public/oprec/${encodeURIComponent(periodId)}/announcement`);
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
  const releaseDate = data.release_at ? new Date(data.release_at) : null;
  const hasSchedule = releaseDate && Number.isFinite(releaseDate.getTime());
  const dateLabel = hasSchedule ? new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
  }).format(releaseDate) : "Segera diumumkan";
  const timeLabel = hasSchedule ? new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(releaseDate) + " WIB" : "Jam menyusul";
  return <><Card className={`oa-public-card ${active ? "oa-public-card--active" : ""}`} id="pengumuman"
    onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
    onFocus={() => setActive(true)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
    }}>
    <div className="oa-public-card__top-bar" aria-hidden="true" />
    <div className="oa-public-content"><span className="oa-eyebrow">Hasil seleksi · {period}</span><h3>{data.title}</h3>
      <div className="oa-public-facts">
        <div className="oa-public-fact"><Calendar size={14} aria-hidden="true" /><span>{dateLabel}</span></div>
        <div className="oa-public-fact"><Clock size={14} aria-hidden="true" /><span>{timeLabel}</span></div>
      </div>
      <p className="oa-muted">{data.released ? (data.description || "Terima kasih sudah menjadi bagian dari proses seleksi HIMANIKA. Hasilmu sudah tersedia.") : "Perjalanan berikutnya segera dimulai. Hasil seleksi dapat dilihat sesuai jadwal berikut."}</p>
      {!data.released && data.release_at && clock && <RollingCountdown target={data.release_at} serverNow={clock} onElapsed={refresh} />}
      {error && <p className="oa-error" role="alert">{error} <button type="button" onClick={refresh}>Periksa kembali</button></p>}
      <div style={{ marginTop: 24 }}><Button ref={trigger} variant="red" className="oa-public-cta" disabled={!data.released} onClick={() => setOpen(true)}>{data.released ? "Lihat Pengumuman" : "Pengumuman belum dibuka"}<ArrowRight size={16} /></Button></div>
    </div>
    <OprecPoster src={data.poster_url} title={data.title} alt={`Poster ${data.title}`} active={active} className="oa-public-art">
      <span className="oa-public-art__placeholder">HIMANIKA<br />PENGUMUMAN<br />{period}</span>
    </OprecPoster>
  </Card><ResultLookup periodId={periodId} open={open} onOpenChange={setOpen} triggerRef={trigger} /></>;
}
