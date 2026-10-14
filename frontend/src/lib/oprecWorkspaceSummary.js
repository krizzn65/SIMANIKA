import { OPREC_FIXED_FIELDS } from "./oprec.js";

const hiddenKeys = new Set([
  "nama", "nama_lengkap", "namaLengkap", "nim", "tanggal_lahir",
  "divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3",
  "jabatan_pilihan_1", "jabatan_pilihan_2", "jabatan_pilihan_3",
]);

const showValue = (value) => typeof value === "boolean" ? (value ? "Ya" : "Tidak") : String(value ?? "—");

export function getOprecSummaryRows(registration, formFields = [], divisionMap = new Map(), fullName = "—", birthDate = "—") {
  if (!registration) return [];
  const formData = registration.formData || {};
  const fields = Array.isArray(formFields) ? formFields : [];
  const byName = new Map(fields.map((field) => [field.name, field]));
  const uploaded = new Set(registration.uploadedFileFields || []);
  const shown = new Set(hiddenKeys);
  const rows = [
    { key: "nama", label: "Nama lengkap", value: fullName },
    { key: "nim", label: "NIM", value: registration.nim || formData.nim || "—" },
    { key: "tanggal_lahir", label: "Tanggal lahir", value: birthDate || "—" },
  ];

  const append = (field) => {
    if (!field?.name || shown.has(field.name)) return;
    shown.add(field.name);
    if (field.type === "file") {
      if (uploaded.has(field.name)) rows.push({ key: field.name, label: field.label || field.name, value: "Berkas diunggah" });
    } else if (Object.hasOwn(formData, field.name)) {
      rows.push({ key: field.name, label: field.label || field.name, value: showValue(formData[field.name]) });
    }
  };

  for (const field of OPREC_FIXED_FIELDS.slice(3)) append(byName.get(field.name));
  for (const field of fields) append(field);

  for (const rank of [1, 2, 3]) {
    const id = registration[`divisiPilihan${rank}`];
    if (!id) continue;
    const division = divisionMap.get(Number(id)) || `Divisi #${id}`;
    const position = formData[`jabatan_pilihan_${rank}`];
    rows.push({ key: `divisi_pilihan_${rank}`, label: `Divisi Pilihan ${rank}`, value: position ? `${division} (${position})` : division });
  }

  for (const [key, value] of Object.entries(formData)) {
    if (!shown.has(key)) rows.push({ key, label: byName.get(key)?.label || key, value: showValue(value) });
  }
  return rows;
}
