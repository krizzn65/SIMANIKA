import { isFieldApplicable } from "./oprec.js";

const IDENTITY_FIELDS = new Set([
  "nama", "nama_lengkap", "namaLengkap", "nim", "tanggal_lahir", "angkatan",
  "divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3",
]);

export function getOprecTableFields(formFields) {
  if (!Array.isArray(formFields)) return [];
  const seen = new Set();
  return formFields.filter((field) => {
    if (!field || typeof field.name !== "string" || IDENTITY_FIELDS.has(field.name) || seen.has(field.name)) return false;
    seen.add(field.name);
    return true;
  });
}

export function getRegistrantFormData(registrant) {
  const value = registrant?.formData;
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch { /* Old malformed records still display their fixed fields. */ }
  }
  return {};
}

export function getRegistrantFieldValue(registrant, field, divisions = []) {
  const formData = getRegistrantFormData(registrant);
  const choices = [registrant?.divisiPilihan1, registrant?.divisiPilihan2, registrant?.divisiPilihan3];
  if (!isFieldApplicable(field, choices, divisions)) return { text: "Tidak berlaku" };
  if (field.type === "file") {
    const file = registrant?.fileUploads?.[field.name];
    return file?.downloadUrl ? { text: "Unduh berkas", downloadUrl: file.downloadUrl } : { text: "—" };
  }
  const value = formData[field.name];
  if (value === null || value === undefined || value === "") return { text: "—" };
  if (typeof value === "boolean") return { text: value ? "Ya" : "Tidak" };
  if (Array.isArray(value)) return { text: value.map(String).join(", ") || "—" };
  if (typeof value === "object") return { text: "—" };
  return { text: String(value) };
}
