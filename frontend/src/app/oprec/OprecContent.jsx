"use client";

import { useCallback, useEffect, useState } from "react";
import { Oprec } from "@/components/oprec/Oprec";
import { normalizeOprec } from "@/lib/oprec";
import { publicApi } from "@/services/publicApi";
import { OprecDevNoticeModal } from "@/components/oprec/OprecDevNoticeModal";

export default function OprecContent() {
  const [showNotice, setShowNotice] = useState(true);
  const [state, setState] = useState({ loading: true, oprec: null, error: false });
  const refresh = useCallback(async () => {
    try {
      const { data } = await publicApi.get("/public/oprec");
      setState({ loading: false, oprec: normalizeOprec(data?.data), error: false });
    } catch {
      setState((current) => current.loading ? { loading: false, oprec: null, error: true } : current);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <OprecDevNoticeModal isOpen={showNotice} onClose={() => setShowNotice(false)} />
      {state.loading ? (
        <p role="status">Memuat OPREC...</p>
      ) : state.error ? (
        <p role="alert">Informasi OPREC belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>
      ) : (
        <Oprec oprec={state.oprec} onRefresh={refresh} />
      )}
    </>
  );
}

