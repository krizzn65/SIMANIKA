"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { WrittenTestFields } from "@/components/oprec/WrittenTestFields";
import workspaceStyles from "@/app/dashboard/oprec/oprec-workspace.module.css";

export function WrittenTestPreview({ questions, divisions }) {
  const [previewMode, setPreviewMode] = useState("all");
  const [selectedDivisions, setSelectedDivisions] = useState(() => divisions.slice(0, 3).map((division) => Number(division.id)));
  const [answers, setAnswers] = useState({});
  const [registrationStatus, setRegistrationStatus] = useState("Anggota Baru");
  const visibleQuestions = questions.filter((question) => {
    const targets = (question.targetDivisions || []).map(Number);
    return previewMode === "all" || targets.length === 0 || targets.some((id) => selectedDivisions.includes(id));
  });
  const previewQuestions = registrationStatus === "Melanjutkan Periode kedua"
    ? [...visibleQuestions, { id: "alasan_melanjutkan_kepengurusan_2026", label: "Alasan melanjutkan Kepengurusan 2026", type: "paragraph", required: true, help: "Khusus peserta yang melanjutkan periode kedua.", options: [] }]
    : visibleQuestions;

  function toggleDivision(id) {
    setSelectedDivisions((current) => current.includes(id)
      ? current.filter((selected) => selected !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  return (
    <aside className="oprec-test__live-preview" aria-label="Pratinjau formulir Tes Tulis peserta">
      <div className="oprec-test__live-preview-head">
        <div><span className="oprec-test__eyebrow"><Eye size={15} aria-hidden="true" /> PRATINJAU PESERTA</span><h2>Form Tes Tulis</h2><p>Perubahan soal terlihat langsung. Pratinjau ini tidak mengirim jawaban.</p></div>
        <span className="oprec-test__preview-count">{previewQuestions.length} soal tampil</span>
      </div>
      {divisions.length > 0 && <section className="oprec-test__preview-divisions" aria-label="Simulasi pilihan divisi">
        <strong>Simulasi pilihan divisi</strong>
        <p>Pilih tampilan semua soal atau simulasi maksimal tiga pilihan divisi peserta.</p>
        <div className="oprec-test__preview-mode" role="group" aria-label="Mode pratinjau divisi">
          <button type="button" className={previewMode === "all" ? "is-active" : ""} aria-pressed={previewMode === "all"} onClick={() => setPreviewMode("all")}><strong>Semua Divisi</strong><small>Tampilkan seluruh soal Tes Tulis</small></button>
          <button type="button" className={previewMode === "specific" ? "is-active" : ""} aria-pressed={previewMode === "specific"} onClick={() => setPreviewMode("specific")}><strong>Divisi Tertentu</strong><small>Simulasikan pilihan peserta</small></button>
        </div>
        {previewMode === "specific" && <div className="oprec-test__preview-division-options">{divisions.map((division) => {
          const id = Number(division.id);
          return <label key={division.id}><input type="checkbox" checked={selectedDivisions.includes(id)} disabled={!selectedDivisions.includes(id) && selectedDivisions.length >= 3} onChange={() => toggleDivision(id)} /> {division.nama}</label>;
        })}</div>}
      </section>}
      <section className="oprec-test__preview-status">
        <label htmlFor="oprec-preview-status">Simulasi Status Kepengurusan</label>
        <select id="oprec-preview-status" value={registrationStatus} onChange={(event) => setRegistrationStatus(event.target.value)}>
          <option>Anggota Baru</option><option>Melanjutkan Periode kedua</option>
        </select>
        <small>Alasan melanjutkan hanya muncul untuk status periode kedua.</small>
      </section>
      <div className="oprec-test__preview-form">
        <div className="oprec-test__preview-form-head"><strong>Tes Tulis OPREC</strong><span>Form peserta</span></div>
        {previewQuestions.length ? <div className={workspaceStyles.testForm}>
          <WrittenTestFields questions={previewQuestions} answers={answers} onAnswerChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))} idPrefix="test-preview" preview />
          <div className={workspaceStyles.testActions}><button type="button" disabled>Kirim jawaban</button></div>
        </div> : <p className="oprec-test__preview-empty">Belum ada pertanyaan untuk pilihan divisi ini.</p>}
      </div>
    </aside>
  );
}
