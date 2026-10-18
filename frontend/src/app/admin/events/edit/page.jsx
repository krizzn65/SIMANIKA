import { Suspense } from "react";
import EventBuilderContent from "./EventBuilderContent";

export default function Page() {
  return <Suspense fallback={<p>Memuat editor event...</p>}><EventBuilderContent /></Suspense>;
}
