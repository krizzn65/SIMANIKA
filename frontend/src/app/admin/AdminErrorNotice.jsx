import { AlertCircle } from "lucide-react";

export function AdminErrorNotice({ message, onRetry }) {
  if (!message) return null;
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
    <p className="min-w-0 flex-1">{message}</p>
    {onRetry && <button type="button" onClick={onRetry} className="admin-btn admin-btn--secondary min-h-11">Coba lagi</button>}
  </div>;
}
