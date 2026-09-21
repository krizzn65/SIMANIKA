"use client";
import { useEffect, useState } from "react";

export function OprecCountdown({ target, initialNow, label }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    let timer;
    const update = () => setNow(Date.now());
    const resume = () => {
      clearInterval(timer);
      if (!document.hidden) { update(); timer = setInterval(update, 1000); }
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", resume); };
  }, [target]);
  const seconds = Math.max(0, Math.ceil((Date.parse(target) - now) / 1000));
  const parts = [[Math.floor(seconds / 86400), "hari"], [Math.floor(seconds / 3600) % 24, "jam"], [Math.floor(seconds / 60) % 60, "menit"], [seconds % 60, "detik"]];
  return <div className="oprec-countdown-wrap"><p className="oprec-mono">{label}</p><div className="oprec-countdown" role="timer" aria-live="off" aria-label={label}>{parts.map(([value, unit]) => <div key={unit}><strong>{String(value).padStart(2, "0")}</strong><span>{unit}</span></div>)}</div></div>;
}
