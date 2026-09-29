export function scoreTone(raw) {
  if (raw === "" || raw === null || raw === undefined) return "border-slate-300 bg-white text-slate-900";
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > 10) return "border-red-500 bg-red-50 text-red-900";
  if (value < 5) return "border-red-300 bg-red-50 text-red-900";
  if (value < 8) return "border-amber-300 bg-amber-50 text-amber-950";
  if (value < 10) return "border-green-300 bg-green-50 text-green-900";
  return "border-blue-400 bg-blue-50 text-blue-900";
}

export function validScore(value) {
  return value === "" || /^(?:10(?:[.,]0)?|[0-9](?:[.,][0-9])?)$/.test(value);
}
