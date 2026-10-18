"use client";

import { useSearchParams } from "next/navigation";
import { OprecWorkspace } from "./OprecWorkspace";

export default function DashboardOprecContent() {
  return <OprecWorkspace oprecId={useSearchParams().get("oprec_id")} />;
}
