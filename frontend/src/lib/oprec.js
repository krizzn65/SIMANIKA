const text = (value) => typeof value === "string" ? value.trim() : "";
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const FIELD_TYPES = new Set(["text", "email", "tel", "number", "date", "textarea", "select", "radio", "checkbox", "file"]);
const FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png"];
const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype", "oprec_id", "schema_version"]);

function date(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error("Invalid OPREC date");
  return value;
}

export function safePosterUrl(value) {
  if (typeof value !== "string") return null;
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function normalizeFields(fields = []) {
  if (!Array.isArray(fields) || fields.length > 40) throw new Error("Invalid OPREC form schema");
  const seen = new Set();
  const normalized = fields.map((field) => {
    if (!field || !/^[a-z][a-z0-9_]{0,49}$/.test(field.name) || RESERVED_KEYS.has(field.name) || seen.has(field.name) || !FIELD_TYPES.has(field.type) || !text(field.label)) throw new Error("Invalid OPREC field");
    seen.add(field.name);
    const options = ["select", "radio"].includes(field.type) ? (field.options || []).map((option) => {
      const value = typeof option === "string" ? option : option?.value;
      const label = typeof option === "string" ? option : option?.label;
      if (!text(value) || !text(label)) throw new Error("Invalid field option");
      return { value: text(value), label: text(label) };
    }) : [];
    if (["select", "radio"].includes(field.type) && (!options.length || options.length > 100 || new Set(options.map(({ value }) => value)).size !== options.length)) throw new Error("Invalid field options");
    const accept = field.type === "file" ? (Array.isArray(field.accept) ? field.accept.filter((type) => FILE_TYPES.includes(type)) : FILE_TYPES) : [];
    if (field.type === "file" && !accept.length) throw new Error("Invalid file types");
    const min = typeof field.min === "number" && Number.isFinite(field.min) ? field.min : null;
    const max = typeof field.max === "number" && Number.isFinite(field.max) ? field.max : null;
    if (min !== null && max !== null && min > max) throw new Error("Invalid field range");
    return {
      name: field.name, type: field.type, label: text(field.label), required: field.required === true,
      help: text(field.help), placeholder: text(field.placeholder), options, accept, min, max,
      maxLength: Math.min(Math.max(count(field.maxLength ?? field.max_length) ?? (field.type === "textarea" ? 3000 : 255), 1), 5000),
      maxSizeMB: Math.min(Math.max(count(field.maxSizeMB ?? field.max_size_mb) ?? 5, 1), 10),
    };
  });
  // Identity fields are configured by admin but required for private result lookup.
  if (normalized.length && ![ ["nim", "text"], ["tanggal_lahir", "date"] ].every(([name, type]) => normalized.some((field) => field.name === name && field.type === type && field.required))) throw new Error("OPREC identity fields are required");
  return normalized;
}

export function normalizeOprec(raw) {
  if (raw === null) return null;
  if (!raw || !["open", "closed"].includes(raw.status) || !text(raw.periode) || !/^[a-zA-Z0-9_-]{1,80}$/.test(String(raw.id ?? ""))) throw new Error("Invalid public OPREC data");
  const tanggalBuka = date(raw.tanggalBuka ?? raw.tanggal_buka);
  const tanggalTutup = date(raw.tanggalTutup ?? raw.tanggal_tutup);
  if (tanggalBuka && tanggalTutup && Date.parse(tanggalTutup) <= Date.parse(tanggalBuka)) throw new Error("Invalid OPREC date range");
  const divisions = raw.divisiTersedia ?? raw.divisi_tersedia ?? [];
  if (!Array.isArray(divisions)) throw new Error("Invalid OPREC divisions");
  const announcement = raw.pengumuman ?? {};
  return {
    id: String(raw.id), periode: text(raw.periode), status: raw.status, tanggalBuka, tanggalTutup,
    headline: text(raw.headline), deskripsi: text(raw.deskripsi), poster: safePosterUrl(raw.poster),
    posterAlt: text(raw.posterAlt ?? raw.poster_alt) || `Poster OPREC ${text(raw.periode)}`,
    schemaVersion: String(raw.schemaVersion ?? raw.schema_version ?? "1"),
    formFields: normalizeFields(raw.formFields ?? raw.form_fields ?? []),
    formIntro: text(raw.formIntro ?? raw.form_intro),
    divisiTersedia: divisions.map((item, index) => {
      if (!item || !text(item.nama)) throw new Error("Invalid OPREC division");
      return { id: String(item.id ?? index), nama: text(item.nama), namaLengkap: text(item.namaLengkap ?? item.nama_lengkap), deskripsi: text(item.deskripsi), logo: safePosterUrl(item.logo), kuota: count(item.kuota) };
    }),
    pengumuman: { published: announcement.published === true, tanggal: date(announcement.tanggal), pesan: text(announcement.pesan) },
    faq: (Array.isArray(raw.faq) ? raw.faq : []).filter((item) => item && text(item.pertanyaan) && text(item.jawaban)).map((item) => ({ pertanyaan: text(item.pertanyaan), jawaban: text(item.jawaban) })),
  };
}

export function oprecState(oprec, now = Date.now()) {
  if (!oprec) return { key: "empty", label: "BELUM DIBUKA", title: "Kesempatan baru akan datang.", message: "Belum ada periode rekrutmen yang dibuka. Pantau halaman ini untuk informasi OPREC berikutnya." };
  const closed = oprec.status === "closed" || (oprec.tanggalTutup && now >= Date.parse(oprec.tanggalTutup));
  if (closed) {
    const announcement = oprec.pengumuman;
    if (announcement.published && (!announcement.tanggal || now >= Date.parse(announcement.tanggal))) return { key: "announcement", label: "PENGUMUMAN", title: "Temukan langkah berikutnya.", message: announcement.pesan || "Cek hasil seleksi menggunakan NIM dan tanggal lahir yang kamu isi saat mendaftar." };
    return { key: "closed", label: "PENDAFTARAN DITUTUP", title: "Terima kasih sudah mengambil langkah.", message: "Pendaftaran sudah ditutup. Hasil seleksi akan diumumkan di bagian ini.", target: announcement.published && announcement.tanggal && Date.parse(announcement.tanggal) > now ? announcement.tanggal : null };
  }
  if (oprec.tanggalBuka && now < Date.parse(oprec.tanggalBuka)) return { key: "soon", label: "SEGERA DIBUKA", title: "Bersiap untuk cerita barumu.", message: `Pendaftaran dimulai ${oprecDate(oprec.tanggalBuka)}.`, target: oprec.tanggalBuka };
  if (!oprec.tanggalBuka || !oprec.tanggalTutup) return { key: "empty", label: "JADWAL MENYUSUL", title: "Sampai bertemu di periode berikutnya.", message: "Jadwal pendaftaran belum diumumkan oleh pengurus." };
  if (!oprec.divisiTersedia.length) return { key: "empty", label: "DIVISI MENYUSUL", title: "Temukan peranmu sebentar lagi.", message: "Divisi untuk periode ini belum diumumkan. Formulir akan tersedia setelah pengurus menyiapkannya." };
  return { key: "open", label: "PENDAFTARAN DIBUKA", title: "Sekarang, giliranmu.", message: `Lengkapi formulir sebelum ${oprecDate(oprec.tanggalTutup)}.` };
}

export function oprecDate(value) {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) + " WIB" : "Belum diumumkan";
}

export function validBirthDate(value, now = Date.now()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value && value >= "1900-01-01" && time <= now;
}

export function validateOprecForm(fields, form, now = Date.now()) {
  const errors = {};
  for (const field of fields) {
    const values = form.getAll(field.name);
    const value = values[0];
    const file = field.type === "file";
    const empty = value == null || (file ? value.size === 0 : typeof value !== "string" || !value.trim());
    if (values.length > 1) { errors[field.name] = "Isi satu jawaban untuk kolom ini."; continue; }
    if (empty) { if (field.required) errors[field.name] = `${field.label} wajib diisi.`; continue; }
    if (file) {
      const extension = `.${String(value.name || "").split(".").pop().toLowerCase()}`;
      if (typeof value.size !== "number" || !field.accept.includes(extension)) errors[field.name] = `Gunakan berkas ${field.accept.join(", ")}.`;
      else if (value.size > field.maxSizeMB * 1024 * 1024) errors[field.name] = `Ukuran maksimal ${field.maxSizeMB} MB.`;
      continue;
    }
    if (typeof value !== "string") { errors[field.name] = "Jawaban tidak valid."; continue; }
    if (value.length > field.maxLength && !["date", "checkbox", "number"].includes(field.type)) errors[field.name] = `Maksimal ${field.maxLength} karakter.`;
    else if (field.name === "nim" && !/^[a-zA-Z0-9.-]{3,32}$/.test(value.trim())) errors[field.name] = "Isi NIM yang valid (3–32 karakter).";
    else if (field.name === "tanggal_lahir" && !validBirthDate(value, now)) errors[field.name] = "Isi tanggal lahir yang valid.";
    else if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors[field.name] = "Isi tanggal yang valid.";
    else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = "Isi alamat email yang valid.";
    else if (field.type === "number" && (!Number.isFinite(Number(value)) || (field.min !== null && Number(value) < field.min) || (field.max !== null && Number(value) > field.max))) errors[field.name] = "Angka berada di luar batas yang diperbolehkan.";
    else if (["select", "radio"].includes(field.type) && !field.options.some((option) => option.value === value)) errors[field.name] = "Pilih salah satu pilihan yang tersedia.";
    else if (field.type === "checkbox" && value !== "on") errors[field.name] = "Nilai persetujuan tidak valid.";
  }
  return errors;
}
