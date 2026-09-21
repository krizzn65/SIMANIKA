"use client";

export default function OprecError({ reset }) {
  return <div className="oprec-container oprec-error" role="alert"><span className="oprec-mono">OPREC / INFORMASI BELUM TERSEDIA</span><h1>Informasi belum bisa dimuat.</h1><p>Ada kendala saat mengambil informasi rekrutmen. Coba lagi sebentar, ya.</p><button className="oprec-button" type="button" onClick={reset}>Coba lagi ↗</button></div>;
}
