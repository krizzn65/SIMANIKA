"use client";

import { useState } from "react";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { JoinEventTeamForm } from "@/components/events/JoinEventTeamForm";

export function DashboardEventActions({ item, onComplete }) {
  const [action, setAction] = useState(null);
  if (!item.actionRequired) return null;

  if (!item.canSubmit) return <p className="dashboard-entry__notice">Periode pendaftaran sudah ditutup. Event tetap tercatat sampai selesai.</p>;

  return <div className="dashboard-entry__actions">
    {item.kind === "team" ? <div className="dashboard-entry__choices" role="group" aria-label="Cara mengikuti tim">
      <button type="button" aria-pressed={action === "create"} onClick={() => setAction(action === "create" ? null : "create")}>Buat tim</button>
      <button type="button" aria-pressed={action === "join"} onClick={() => setAction(action === "join" ? null : "join")}>Gabung tim</button>
    </div> : <button type="button" className="dashboard-entry__primary" aria-expanded={action === "form"} onClick={() => setAction(action === "form" ? null : "form")}>Lengkapi formulir</button>}
    {(action === "form" || action === "create") && <EventRegistrationForm event={item.event} onSuccess={onComplete} />}
    {action === "join" && <JoinEventTeamForm event={item.event} onSuccess={onComplete} />}
  </div>;
}
