"use client";

import { useEffect, useState } from "react";

export function EventCountdown({ deadline, initialNow }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const update = () => { if (!document.hidden) setNow(Date.now()); };
    update();
    const interval = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, []);
  const targetMs = typeof deadline === "string" && deadline.length === 10
    ? Date.parse(`${deadline}T23:59:59.999+07:00`)
    : Date.parse(deadline);
  const minutes = Math.max(0, Math.ceil((targetMs - now) / 60000));
  if (!minutes) return <p className="event-deadline-ended">Batas pendaftaran telah berakhir.</p>;
  return <div className="event-countdown" aria-label="Sisa waktu pendaftaran">
    {[[Math.floor(minutes / 1440), "hari"], [Math.floor(minutes / 60) % 24, "jam"], [minutes % 60, "menit"]].map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
  </div>;
}
