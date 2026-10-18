"use client";

import { useSearchParams } from "next/navigation";
import WrittenTestEditor from "../WrittenTestEditor";

export default function EditWrittenTestContent() {
  const period = useSearchParams().get("period");
  return period ? <WrittenTestEditor period={period} /> : <p role="alert">Periode Tes Tulis tidak ditemukan.</p>;
}
