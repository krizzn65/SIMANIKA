"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EventFilters({ filters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);

  function submit(event) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (search && search.trim()) {
      query.set("search", search.trim());
    }
    startTransition(() =>
      router.push(query.toString() ? `/events?${query}` : `/events`),
    );
  }

  return (
    <div className="event-utility">
      <Form
        action="/events"
        className="event-filter-form"
        onSubmit={submit}
        aria-busy={pending}
        aria-label="Cari kegiatan"
      >
        <label className="event-search" htmlFor="event-search">
          Cari kegiatan
          <input
            id="event-search"
            name="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama event atau topik yang kamu suka…"
            maxLength={100}
          />
        </label>
        <button className="event-button" type="submit" disabled={pending}>
          {pending ? "Mencari…" : "Cari"} <span aria-hidden="true">↗</span>
        </button>
      </Form>
    </div>
  );
}
