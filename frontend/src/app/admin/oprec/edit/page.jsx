import { Suspense } from "react";
import EditOprecContent from "./EditOprecContent";

export default function EditOprecPage() {
  return <Suspense fallback={<p>Memuat editor OPREC...</p>}><EditOprecContent /></Suspense>;
}
