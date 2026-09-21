"use client";

import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/events";

function Selects({ filters, prefix }) {
  return <>
    <label htmlFor={`${prefix}-category`}>Kategori<select id={`${prefix}-category`} name="kategori" defaultValue={filters.kategori}>{EVENT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label htmlFor={`${prefix}-status`}>Waktu event<select id={`${prefix}-status`} name="status" defaultValue={filters.status}>{EVENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
  </>;
}

export function EventFilters({ filters }) {
  const dialog = useRef(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function submit(event) {
    event.preventDefault();
    const query = new URLSearchParams(new FormData(event.currentTarget));
    dialog.current?.close();
    startTransition(() => router.push(`/events?${query}`));
  }
  const [search, setSearch] = useState(filters.search);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const close = () => { if (media.matches) dialog.current?.close(); };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  return (
    <div className="event-utility">
      <Form action="/events" className="event-filter-form" onSubmit={submit} aria-busy={pending} aria-label="Cari dan filter event">
        <label className="event-search" htmlFor="event-search">Cari kegiatan<input id="event-search" name="search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama event atau topik yang kamu suka…" maxLength={100} /></label>
        <div className="event-desktop-filters"><Selects filters={filters} prefix="desktop" /></div>
        <button className="event-button" type="submit" disabled={pending}>{pending ? "Mencari…" : "Cari"} <span aria-hidden="true">↗</span></button>
        <button className="event-button event-button--outline event-mobile-filter" type="button" onClick={() => dialog.current.showModal()}>Filter{(filters.kategori || filters.status) ? " •" : ""}</button>
      </Form>
      <dialog ref={dialog} className="event-filter-sheet" aria-labelledby="filter-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
        <div className="event-filter-sheet__heading"><h2 id="filter-title">Filter event</h2><button type="button" aria-label="Tutup filter" onClick={() => dialog.current.close()}>×</button></div>
        <Form action="/events" onSubmit={submit}>
          <input type="hidden" name="search" value={search} />
          <Selects filters={filters} prefix="mobile" />
          <button type="submit" className="event-button" disabled={pending}>Tampilkan event</button>
          <Link href="/events" onClick={() => dialog.current.close()} className="event-reset">Reset filter</Link>
        </Form>
      </dialog>
    </div>
  );
}
