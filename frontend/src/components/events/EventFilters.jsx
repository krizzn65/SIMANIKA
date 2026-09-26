"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { eventListHref } from "@/lib/events";

export function EventFilters({ filters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search || "");
  const debounceTimer = useRef(null);
  const lastQueryRef = useRef(filters.search || "");

  // Sync internal state if URL filter changes externally (e.g. clicking 'Reset filter' or browser navigation)
  useEffect(() => {
    const currentPropSearch = filters.search || "";
    if (currentPropSearch !== lastQueryRef.current) {
      setSearch(currentPropSearch);
      lastQueryRef.current = currentPropSearch;
    }
  }, [filters.search]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const triggerSearch = (queryText) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const trimmed = (queryText || "").trim();
    if (trimmed === lastQueryRef.current) return;

    lastQueryRef.current = trimmed;
    const targetHref = eventListHref(filters, { search: trimmed, page: 1 });

    startTransition(() => {
      router.replace(targetHref, { scroll: false });
    });
  };

  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    setSearch(nextValue);

    // If completely cleared (e.g. backspace all or clicked native search clear)
    if (nextValue.trim() === "" && lastQueryRef.current !== "") {
      triggerSearch("");
      return;
    }

    // Debounce live search (280ms)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      triggerSearch(nextValue);
    }, 280);
  };

  const handleClear = () => {
    setSearch("");
    triggerSearch("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && search) {
      e.preventDefault();
      handleClear();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerSearch(search);
  };

  return (
    <div className="event-utility">
      <Form
        action="/events"
        className="event-filter-form"
        onSubmit={handleSubmit}
        aria-busy={pending}
        aria-label="Cari kegiatan"
      >
        <label className="event-search" htmlFor="event-search">
          Cari kegiatan
          <div className="event-search__input-wrapper">
            <input
              id="event-search"
              name="search"
              type="search"
              value={search}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nama event atau topik yang kamu suka…"
              maxLength={100}
              autoComplete="off"
              spellCheck="false"
            />
            {search && (
              <button
                type="button"
                className="event-search__clear-btn"
                onClick={handleClear}
                aria-label="Hapus kata kunci pencarian"
                title="Hapus pencarian"
              >
                <svg viewBox="0 0 16 16" fill="none" width="10" height="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            )}
          </div>
        </label>
        <button
          className={`event-button ${pending ? "event-button--searching" : ""}`}
          type="submit"
          disabled={pending}
          aria-label={pending ? "Sedang mencari event..." : "Cari kegiatan"}
        >
          {pending ? (
            <>
              <span className="event-spinner" aria-hidden="true" />
              <span>Mencari…</span>
            </>
          ) : (
            <>
              <span>Cari</span>
              <span aria-hidden="true">↗</span>
            </>
          )}
        </button>
      </Form>
    </div>
  );
}
