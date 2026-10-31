import { Suspense } from "react";
import AddRegistrantContent from "./AddRegistrantContent";

export default function AddRegistrantPage() {
  return <Suspense fallback={<p>Memuat formulir admin…</p>}><AddRegistrantContent /></Suspense>;
}
