import { Suspense } from "react";
import EditWrittenTestContent from "./EditWrittenTestContent";

export default function Page() {
  return <Suspense fallback={<p>Memuat editor Tes Tulis...</p>}><EditWrittenTestContent /></Suspense>;
}
