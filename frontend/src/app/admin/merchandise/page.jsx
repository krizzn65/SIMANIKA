"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Sparkles, PackageCheck, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminMerchandisePage() {
  const [items] = useState([
    {
      id: 1,
      nama: "Hoodie Official HIMANIKA 2026",
      kategori: "Apparel",
      harga: "Rp 165.000",
      stok: 45,
      status: "Tersedia",
    },
    {
      id: 2,
      nama: "T-Shirt Tech Edition - Black",
      kategori: "Apparel",
      harga: "Rp 95.000",
      stok: 120,
      status: "Tersedia",
    },
    {
      id: 3,
      nama: "Lanyard & ID Card Holder Simanika",
      kategori: "Aksesoris",
      harga: "Rp 25.000",
      stok: 250,
      status: "Tersedia",
    },
    {
      id: 4,
      nama: "Tumbler Stainless Steel 500ml",
      kategori: "Merchandise",
      harga: "Rp 85.000",
      stok: 30,
      status: "Tersedia",
    },
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Merchandise & Store</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen produk official merchandise, stok, dan pemesanan HIMANIKA.
          </p>
        </div>

        <Link href="/merchandise" target="_blank" className="admin-btn admin-btn--secondary">
          <span>Katalog Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Produk Merchandise</h2>
            <p className="text-xs text-slate-500">Koleksi merchandise resmi pengurus dan mahasiswa.</p>
          </div>
          <span className="admin-badge admin-badge--blue">{items.length} Item Terdaftar</span>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga Satuan</th>
                <th>Estimasi Stok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-semibold text-slate-900">{item.nama}</div>
                    <div className="text-[11px] text-slate-400">ID #{item.id}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--neutral text-[10px] uppercase font-mono">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="font-mono text-xs font-bold text-slate-800">
                    {item.harga}
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.stok} pcs
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--published">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
