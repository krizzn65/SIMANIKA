"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { WrittenTestQuestions } from "@/components/oprec/WrittenTestQuestions";
import workspaceStyles from "@/app/dashboard/oprec/oprec-workspace.module.css";

export function WrittenTestPreview({ questions, divisions }) {
  const [selectedDivisions, setSelectedDivisions] = useState(() => divisions.slice(0, 3).map((division) => Number(division.id)));
  const [answers, setAnswers] = useState({});
  const visibleQuestions = questions.filter((question) => {
    const targets = (question.targetDivisions || []).map(Number);
    return targets.length === 0 || targets.some((id) => selectedDivisions.includes(id));
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
      {divisions.length > 0 && <fieldset className="oprec-test__preview-divisions">
        <legend>Simulasi pilihan divisi</legend>
        <p>Pilih hingga 3 divisi untuk melihat soal yang berlaku bagi peserta.</p>
        <div>{divisions.map((division) => {
          const id = Number(division.id);
          return <label key={division.id}><input type="checkbox" checked={selectedDivisions.includes(id)} disabled={!selectedDivisions.includes(id) && selectedDivisions.length >= 3} onChange={() => toggleDivision(id)} /> {division.nama}</label>;
        })}</div>
      </fieldset>}
      <div className="oprec-test__preview-form">
        <div className="oprec-test__preview-form-head"><strong>Tes Tulis OPREC</strong><span>Form peserta</span></div>
        {visibleQuestions.length ? <div className={workspaceStyles.testForm}>
          <WrittenTestQuestions questions={visibleQuestions} answers={answers} onAnswerChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))} idPrefix="test-preview" preview />
          <div className={workspaceStyles.testActions}><button type="button" disabled>Kirim jawaban</button></div>
        </div> : <p className="oprec-test__preview-empty">Belum ada pertanyaan untuk pilihan divisi ini.</p>}
      </div>
    </aside>
  );
}
