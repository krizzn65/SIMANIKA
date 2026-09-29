"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

const fieldTypes = [
  ["short_text", "Teks singkat"], ["paragraph", "Paragraf"],
  ["email", "Email"], ["tel", "Nomor telepon"], ["url", "Link"],
  ["number", "Angka"], ["date", "Tanggal"],
  ["select", "Pilihan dropdown"], ["single_choice", "Pilihan satu"],
  ["checkbox", "Persetujuan"], ["file", "Unggah berkas"],
];

export function WrittenTestQuestionEditor({ question, index, count, divisions, update, move, remove }) {
  const targeted = question.targetDivisions.length > 0;
  const setTarget = (id, checked) => update(index, {
    targetDivisions: checked
      ? [...question.targetDivisions, id]
      : question.targetDivisions.filter((value) => value !== id),
  });

  return <fieldset className="oprec-test__question">
    <legend className="oprec-test__sr-only">Pertanyaan {index + 1}</legend>
    <div className="oprec-test__question-top">
      <div className="oprec-test__question-title"><span className="oprec-test__question-number">{String(index + 1).padStart(2, "0")}</span><strong>{question.label.trim() || `Pertanyaan ${index + 1}`}</strong></div>
      <div className="oprec-test__question-actions">
        <span className="oprec-test__question-tag">{targeted ? "DIVISI TERTENTU" : "SEMUA DIVISI"}</span>
        <span className="oprec-test__question-tag is-blue">TAMBAHAN</span>
        <button type="button" aria-label={`Naikkan pertanyaan ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
        <button type="button" aria-label={`Turunkan pertanyaan ${index + 1}`} disabled={index === count - 1} onClick={() => move(index, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
        <button type="button" aria-label={`Hapus pertanyaan ${index + 1}`} onClick={() => remove(index)}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <div className="oprec-test__fields">
      <label><span className="oprec-test__field-label">Label pertanyaan <b aria-hidden="true">*</b></span><input required maxLength={300} value={question.label} onChange={(event) => update(index, { label: event.target.value })} /></label>
      <label>Tipe input<select value={question.type} onChange={(event) => update(index, { type: event.target.value, options: ["select", "single_choice"].includes(event.target.value) ? ["", ""] : [] })}>{fieldTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="oprec-test__target-section oprec-test__wide">
        <strong>Target Divisi Calon Anggota</strong>
        <p>Tentukan apakah pertanyaan muncul untuk semua peserta atau hanya peserta divisi tertentu.</p>
        <div className="oprec-test__target-options" role="group" aria-label={`Target pertanyaan ${index + 1}`}>
          <button type="button" className={!targeted ? "is-active" : ""} aria-pressed={!targeted} onClick={() => update(index, { targetDivisions: [] })}><strong>Semua Divisi</strong><small>Muncul untuk semua peserta</small></button>
          <button type="button" className={targeted ? "is-active" : ""} aria-pressed={targeted} onClick={() => update(index, { targetDivisions: question.targetDivisions.length ? question.targetDivisions : divisions.length ? [Number(divisions[0].id)] : [] })} disabled={!divisions.length}><strong>Divisi Tertentu</strong><small>Hanya tampil jika memilih divisi sasaran</small></button>
        </div>
        {targeted && <div className="oprec-test__targets"><strong>Centang divisi sasaran</strong><div>{divisions.map((division) => { const id = Number(division.id); return <label key={id}><input type="checkbox" checked={question.targetDivisions.includes(id)} onChange={(event) => setTarget(id, event.target.checked)} /> {division.nama}</label>; })}</div></div>}
      </div>
      {["select", "single_choice"].includes(question.type) && <label className="oprec-test__wide">Opsi pilihan <small>Satu opsi per baris, minimal dua opsi berbeda.</small><textarea rows={4} value={question.options.join("\n")} onChange={(event) => update(index, { options: event.target.value.split("\n") })} /></label>}
      <label className="oprec-test__wide">Petunjuk / teks bantuan (opsional)<input maxLength={500} value={question.help || ""} onChange={(event) => update(index, { help: event.target.value })} placeholder="Contoh: Lampirkan berkas dalam format PDF..." /></label>
      {question.type === "file" && <p className="oprec-test__file-hint oprec-test__wide">Berkas PDF, JPG, atau PNG; maksimal 5 MB. Berkas disimpan secara privat.</p>}
      <label className="oprec-test__check oprec-test__wide"><input type="checkbox" checked={question.required} onChange={(event) => update(index, { required: event.target.checked })} /> Wajib diisi oleh peserta</label>
    </div>
  </fieldset>;
}
