"use client";

import { useSearchParams } from "next/navigation";
import OprecBuilder from "../OprecBuilder";

export default function EditOprecContent() {
  const id = useSearchParams().get("id");
  return id ? <OprecBuilder oprecId={id} /> : <p role="alert">Periode OPREC tidak ditemukan.</p>;
}
