"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileSpreadsheet, UploadCloud, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { normalizeOprec } from "@/lib/oprec";
import { mapOprecSheetRecord, parseOprecSheet, safeDriveUrl } from "@/lib/oprecSheetImport.mjs";
import { OprecForm } from "@/components/oprec/OprecForm";
import workspaceStyles from "@/app/dashboard/oprec/oprec-workspace.module.css";
import "@/app/events/events.css";
import "@/app/oprec/oprec.css";
import "./add-registrant.css";

const EMPTY_RECORD = { email: "", values: {}, files: {}, references: [], extras: [], timestamp: "" };

class FormErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("FormErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="add-oprec__notice add-oprec__notice--error" role="alert" style={{ display: "block", margin: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
            <AlertCircle size={18} /> Terjadi kendala saat memuat formulir
          </div>
          <p style={{ margin: "6px 0 10px", fontSize: "13px" }}>
            {this.state.error?.message || "Terdapat data yang tidak sesuai. Silakan klik tombol di bawah untuk memuat ulang formulir."}
          </p>
          <button
            type="button"
            className="event-button"
            style={{ padding: "6px 14px", fontSize: "12px", minHeight: "auto" }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
          >
            Muat Ulang Formulir
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AddRegistrantContent() {
  const search = useSearchParams();
  const { user } = useAuth();
  const urlPeriodId = search.get("id");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(urlPeriodId || "");
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sheet, setSheet] = useState(null);
  const [sheetInput, setSheetInput] = useState("");
  const [sheetError, setSheetError] = useState("");
  const [rowIndex, setRowIndex] = useState(-1);
  const [formVersion, setFormVersion] = useState(0);
  const [email, setEmail] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountSearch, setAccountSearch] = useState({ status: "idle", term: "", matches: [] });
  const [successNotice, setSuccessNotice] = useState("");
  const [done, setDone] = useState({});

  // 1. Fetch all periods on initial load
  useEffect(() => {
    let active = true;
    api.get("/admin/oprec")
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setPeriods(list);

        // Determine target period:
        // Priority: 1. URL param matching a period, 2. Period with status 'open', 3. First period in list
        let target = null;
        if (urlPeriodId) {
          target = list.find((p) => String(p.id) === String(urlPeriodId) || p.periode === urlPeriodId);
        }
        if (!target) {
          target = list.find((p) => p.status === "open") || list[0] || null;
        }

        if (target) {
          setSelectedPeriodId(String(target.id));
          if (!urlPeriodId && typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("id", String(target.id));
            window.history.replaceState({}, "", url.toString());
          }
        } else if (list.length === 0) {
          setLoadError("Belum ada periode OPREC yang dibuat. Buat periode OPREC terlebih dahulu.");
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.response?.data?.message || error.message || "Gagal memuat daftar periode OPREC.");
        setLoading(false);
      });

    return () => { active = false; };
  }, [urlPeriodId]);

  // 2. Fetch specific period details whenever selectedPeriodId changes
  useEffect(() => {
    if (!selectedPeriodId) return;
    let active = true;
    setLoading(true);
    setLoadError("");

    api.get(`/admin/oprec/${encodeURIComponent(selectedPeriodId)}`)
      .then(({ data }) => {
        if (!active) return;
        try {
          const normalized = normalizeOprec(data?.data);
          setPeriod(normalized);
          setLoadError("");
        } catch (normErr) {
          setLoadError(normErr.message || "Skema periode OPREC tidak valid.");
        }
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.response?.data?.message || error.message || "Gagal memuat detail periode OPREC.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedPeriodId]);

  const record = sheet?.records[rowIndex] || null;
  const mapped = useMemo(() => record && period
    ? mapOprecSheetRecord(record, period.formFields, period.divisiTersedia)
    : EMPTY_RECORD, [record, period]);

  useEffect(() => {
    const term = email.trim();
    if (selectedAccount?.email.toLowerCase() === term.toLowerCase()) {
      setAccountSearch({ status: "selected", term, matches: [] });
      return;
    }
    if (!period || term.length < 2) {
      setAccountSearch({ status: "idle", term, matches: [] });
      return;
    }
    let active = true;
    setAccountSearch({ status: "checking", term, matches: [] });
    const timer = setTimeout(() => {
      api.get(`/admin/oprec/${period.id}/registrants/account`, { params: { q: term } }).then(({ data }) => {
        if (!active) return;
        const matches = Array.isArray(data?.data?.matches) ? data.data.matches : [];
        setAccountSearch({ status: matches.length ? "results" : "missing", term, matches });
      }).catch(() => { if (active) setAccountSearch({ status: "error", term, matches: [] }); });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [email, period, selectedAccount]);

  function handlePeriodSwitch(newId) {
    if (String(newId) === String(selectedPeriodId)) return;
    setSelectedPeriodId(String(newId));
    setRowIndex(-1);
    setSheet(null);
    setSheetInput("");
    setSheetError("");
    setEmail("");
    setSelectedAccount(null);
    setSuccessNotice("");
    setDone({});
    setFormVersion((v) => v + 1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", String(newId));
      window.history.replaceState({}, "", url.toString());
    }
  }

  function selectRow(index, source = sheet) {
    const next = index < 0 || !source?.records[index] || !period
      ? EMPTY_RECORD
      : mapOprecSheetRecord(source.records[index], period.formFields, period.divisiTersedia);
    setRowIndex(index);
    setEmail(next.email);
    setSelectedAccount(null);
    setFormVersion((value) => value + 1);
    setSuccessNotice("");
  }

  function importText(text) {
    try {
      const parsed = parseOprecSheet(text);
      setSheet(parsed); setSheetError(""); setDone({});
      selectRow(0, parsed);
    } catch (error) { setSheetError(error.message); }
  }

  async function uploadSheet(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!/\.(csv|tsv|txt)$/i.test(file.name) || file.size > 2 * 1024 * 1024) {
      setSheetError("Gunakan CSV/TSV maksimal 2 MB dari Google Sheets.");
      return;
    }
    importText(await file.text());
  }

  function onSaved() {
    const name = mapped.values.nama || selectedAccount?.name || "Peserta";
    if (record) setDone((current) => ({ ...current, [rowIndex]: true }));
    const next = record && rowIndex + 1 < sheet.records.length ? rowIndex + 1 : -1;
    selectRow(next);
    setSuccessNotice(`${name} berhasil ditambahkan ke periode ${period.periode}.`);
  }

  const term = email.trim();
  const accountReady = Boolean(selectedAccount && !selectedAccount.alreadyRegistered && selectedAccount.email.toLowerCase() === term.toLowerCase());
  const status = accountReady ? "selected" : term.length < 2 ? "idle" : accountSearch.term === term ? accountSearch.status : "checking";
  const sources = [...mapped.references, ...mapped.extras];

  if (!["super_admin", "admin"].includes(user?.role)) return <main className="add-oprec"><p>Halaman ini hanya tersedia untuk admin.</p></main>;

  return (
    <main className="add-oprec">
      <Link className="add-oprec__back" href="/admin/oprec">
        <ArrowLeft size={16} /> Kembali ke daftar pendaftar
      </Link>
      <header className="add-oprec__heading">
        <div>
          <span className="add-oprec__eyebrow">OPREC / PENDAFTARAN</span>
          <h1>Tambah peserta</h1>
          <p>Gunakan formulir pendaftaran yang sama untuk memasukkan peserta yang sudah mempunyai akun.</p>
        </div>
        <div className="add-oprec__period-selector-wrap">
          {periods.length > 0 ? (
            <div className="add-oprec__period-selector">
              <label htmlFor="add-oprec-period-select" className="add-oprec__period-select-label">
                Pilih Periode:
              </label>
              <select
                id="add-oprec-period-select"
                className="add-oprec__period-select"
                value={selectedPeriodId}
                onChange={(e) => handlePeriodSwitch(e.target.value)}
                disabled={loading}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    Periode {p.periode} {p.status === "open" ? "(Terbuka)" : p.status === "closed" ? "(Ditutup)" : "(Draf)"}
                  </option>
                ))}
              </select>
            </div>
          ) : period ? (
            <span className="add-oprec__period">Periode {period.periode}</span>
          ) : null}
        </div>
      </header>

      {loadError && <p role="alert" className="add-oprec__notice add-oprec__notice--error">{loadError}</p>}

      {loading && !period && (
        <div className="add-oprec__notice" style={{ background: "#f0f4f9", color: "#324b67" }}>
          <RefreshCw size={16} className="add-oprec__spinner" /> Memuat formulir periode OPREC...
        </div>
      )}

      {period && (
        <div className="add-oprec__layout">
          <aside className="add-oprec__aside">
            <section className="add-oprec__panel">
              <h2><FileSpreadsheet size={18} /> Spreadsheet Google Form</h2>
              <p>Unduh Google Sheets sebagai CSV, unggah di sini, atau tempel tabel lengkap dengan judul kolom. Setiap peserta ditinjau sebelum disimpan.</p>
              <label className="add-oprec__upload">
                <UploadCloud size={16} /> Pilih CSV / TSV
                <input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={uploadSheet} />
              </label>
              <textarea
                aria-label="Tempel data spreadsheet"
                placeholder="Tempel tabel dari Google Sheets…"
                rows={4}
                value={sheetInput}
                onChange={(event) => setSheetInput(event.target.value)}
              />
              <button type="button" onClick={() => importText(sheetInput)} disabled={!sheetInput.trim()}>
                Baca tabel
              </button>
              {sheetError && <p role="alert" className="add-oprec__notice add-oprec__notice--error">{sheetError}</p>}
            </section>
            <section className="add-oprec__panel">
              <h2>Daftar peserta</h2>
              <button type="button" className={rowIndex === -1 ? "selected" : ""} onClick={() => selectRow(-1)}>
                + Isi manual
              </button>
              {sheet?.records.map((item, index) => {
                const data = mapOprecSheetRecord(item, period.formFields, period.divisiTersedia);
                return (
                  <button key={index} type="button" className={rowIndex === index ? "selected" : ""} onClick={() => selectRow(index)}>
                    <span>
                      {data.values.nama || `Baris ${item.line}`}
                      <small>{data.email || "Email belum diisi"}</small>
                    </span>
                    {done[index] && <CheckCircle2 size={17} aria-label="Sudah tersimpan" />}
                  </button>
                );
              })}
            </section>
          </aside>
          <section className={`${workspaceStyles.workspace} add-oprec__main`} aria-label="Formulir pendaftaran peserta">
            <div className="add-oprec__form-heading">
              <span className="add-oprec__eyebrow">{record ? `BARIS ${record.line}` : "ENTRI MANUAL"}</span>
              <h2>Formulir pendaftaran OPREC</h2>
              <p>Kolom, pilihan divisi, jabatan, dan pertanyaan otomatis mengikuti pendaftaran reguler periode {period.periode}.</p>
            </div>
            {successNotice && (
              <p role="status" className="add-oprec__notice add-oprec__notice--success">
                <CheckCircle2 size={17} /> {successNotice}
              </p>
            )}
            <div className="add-oprec__account">
              <label htmlFor="add-oprec-email">Cari akun peserta <b>*</b></label>
              <input
                id="add-oprec-email"
                type="search"
                value={email}
                autoComplete="off"
                onChange={(event) => { setEmail(event.target.value); setSelectedAccount(null); }}
                placeholder="Ketik nama atau email"
                aria-describedby="add-oprec-account-status"
                aria-controls="add-oprec-account-results"
                aria-expanded={status === "results"}
              />
              <p id="add-oprec-account-status" role="status" className={`add-oprec__account-status add-oprec__account-status--${status}`}>
                {!term ? "Ketik nama atau email peserta, lalu pilih akun dari hasil pencarian." : status === "idle" ? "Ketik minimal 2 karakter untuk mencari akun." : status === "checking" ? "Mencari akun…" : status === "results" ? "Pilih akun yang sesuai dari daftar di bawah." : status === "selected" ? `Akun dipilih: ${selectedAccount.name} (${selectedAccount.email})` : status === "missing" ? "Akun tidak ditemukan." : "Pencarian akun gagal. Coba ketik lagi."}
              </p>
              {status === "results" && (
                <div id="add-oprec-account-results" className="add-oprec__account-results" aria-label="Hasil pencarian akun">
                  {accountSearch.matches.map((match) => (
                    <button
                      key={match.email}
                      type="button"
                      disabled={match.alreadyRegistered}
                      onClick={() => { setEmail(match.email); setSelectedAccount(match); }}
                    >
                      <span>
                        <strong>{match.name || "Tanpa nama"}</strong>
                        <small>{match.email}</small>
                      </span>
                      {match.alreadyRegistered && <em>Sudah terdaftar</em>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {record && (
              <p className="add-oprec__hint">
                Tanggal lahir tidak ada di Google Form; isi sebelum mengirim. Tautan Drive pada kolom berkas hanya referensi, jadi unduh lalu unggah berkasnya.
              </p>
            )}
            {sources.length > 0 && (
              <details className="add-oprec__references">
                <summary>Kolom Google Form yang perlu ditinjau ({sources.length})</summary>
                <div>
                  {sources.map((item, index) => (
                    <p key={index}>
                      <strong>{item.label}</strong>
                      {safeDriveUrl(item.value) ? (
                        <a href={safeDriveUrl(item.value)} target="_blank" rel="noopener noreferrer">
                          Buka di Drive <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span>{item.value}</span>
                      )}
                    </p>
                  ))}
                </div>
              </details>
            )}
            <FormErrorBoundary onReset={() => setFormVersion((v) => v + 1)}>
              <OprecForm
                key={`${period.id}:${formVersion}`}
                oprec={period}
                onSuccess={onSaved}
                adminEntry={{
                  email,
                  accountReady,
                  values: mapped.values,
                  files: mapped.files,
                  seedKey: formVersion,
                }}
              />
            </FormErrorBoundary>
          </section>
        </div>
      )}
    </main>
  );
}
