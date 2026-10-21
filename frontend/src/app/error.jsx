"use client";

import { ServerErrorPage } from "@/components/ui/404-page-not-found";

export default function RootError({ reset }) {
  return <ServerErrorPage onRetry={reset} />;
}
