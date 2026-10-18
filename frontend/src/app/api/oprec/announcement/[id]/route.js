export const runtime = "nodejs";
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ message: "Periode tidak ditemukan." }, { status: 404 });
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  try {
    const response = await fetch(`${base?.replace(/\/+$/, "")}/public/oprec/${id}/announcement`, { cache: "no-store", signal: AbortSignal.timeout(12000), redirect: "error", headers: { Accept: "application/json" } });
    if (!response.ok) return Response.json({ message: "Pengumuman belum tersedia." }, { status: response.status === 404 ? 404 : 503 });
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "Layanan belum tersedia." }, { status: 503 }); }
}
