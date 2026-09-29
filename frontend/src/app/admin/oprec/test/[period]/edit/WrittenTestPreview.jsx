"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { WrittenTestFields } from "@/components/oprec/WrittenTestFields";
import workspaceStyles from "@/app/dashboard/oprec/oprec-workspace.module.css";

export function WrittenTestPreview({ questions, divisions }) {
  const [previewMode, setPreviewMode] = useState("all");
  const [selectedDivisions, setSelectedDivisions] = useState(() => divisions.slice(0, 3).map((division) => Number(division.id)));
  const [answers, setAnswers] = useState({});
  const visibleQuestions = questions.filter((question) => {
    const targets = (question.targetDivisions || []).map(Number);
    return previewMode === "all" || targets.length === 0 || targets.some((id) => selectedDivisions.includes(id));
  });

  function toggleDivision(id) {
    setSelectedDivisions((current) => current.includes(id)
      ? current.filter((selected) => selected !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  return (
    <aside className="oprec-test__live-preview" aria-label="Pratinjau formulir Tes Tulis peserta">
      <div className="oprec-test__live-preview-head">
        <div><span className="oprec-test__eyebrow"><Eye size={15} aria-hidden="true" /> PRATINJAU PESERTA</span><h2>Form Tes Tulis</h2><p>Perubahan soal terlihat langsung. Pratinjau ini tidak mengirim jawaban.</p></div>
        <span className="oprec-test__preview-count">{visibleQuestions.length} soal tampil</span>
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
      <div className="oprec-test__preview-form">
        <div className="oprec-test__preview-form-head"><strong>Tes Tulis OPREC</strong><span>Form peserta</span></div>
        {visibleQuestions.length ? <div className={workspaceStyles.testForm}>
          <WrittenTestFields questions={visibleQuestions} answers={answers} onAnswerChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))} idPrefix="test-preview" preview />
          <div className={workspaceStyles.testActions}><button type="button" disabled>Kirim jawaban</button></div>
        </div> : <p className="oprec-test__preview-empty">Belum ada pertanyaan untuk pilihan divisi ini.</p>}
      </div>
    </aside>
  );
}
