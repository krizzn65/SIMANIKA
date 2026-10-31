const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function parseOprecSheet(source) {
  const input = String(source ?? "").replace(/^\uFEFF/, "");
  const firstLine = input.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("CSV memiliki tanda kutip yang belum ditutup.");
  if (row.length || cell) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(clean);
  if (headers.length < 2 || !headers.some((header) => ["email aktif", "email"].includes(key(header)))) throw new Error("Kolom Email Aktif tidak ditemukan. Gunakan ekspor CSV Google Form atau tempel tabel lengkap dengan judul kolom.");
  const records = rows.filter((cells) => cells.some((value) => clean(value))).map((cells, index) => ({
    line: index + 2,
    values: Object.fromEntries(headers.map((header, column) => [header || `Kolom ${column + 1}`, clean(cells[column])])),
  }));
  if (!records.length) throw new Error("Spreadsheet belum berisi data peserta.");
  return { headers, records };
}

const aliases = {
  nama: ["nama lengkap"], nim: ["nim"], angkatan: ["angkatan"], golongan: ["golongan"],
  nomor_wa: ["no whatsapp", "nomor whatsapp", "no wa"], username_ig: ["username ig", "username instagram"],
  status_kepengurusan: ["status kepengurusan"],
  ktm_sim_online: ["foto ktm"], surat_pernyataan: ["pengumpulan surat pernyataan"],
  visi_misi: ["pengumpulan visi misi"], portofolio: ["pengumpulan portofolio"], sertifikat: ["pengumpulan serifikat", "pengumpulan sertifikat"],
  keterampilan: ["apa keterampilan yang kamu miliki"],
  alasan_divisi_1: ["alasan memilih divisi pertama"], alasan_divisi_2: ["alasan memilih divisi kedua"], alasan_divisi_3: ["alasan memilih divisi ketiga"],
  alasan_melanjutkan: ["alasan melanjutkan kepengurusan 2026"],
  persetujuan_data_benar: ["saya menyatakan bahwa data yang saya isi dalam formulir ini benar dan dapat dipertanggungjawabkan"],
  persetujuan_penggunaan_data: ["saya memahami bahwa data yang saya berikan digunakan untuk keperluan administrasi dan seleksi oprec himanika sesuai ketentuan yang berlaku"],
};

function matchDivision(raw, divisions) {
  const name = key(raw);
  if (!name) return null;
  const knownNames = { kwu: ["kewirausahaan"], ristek: ["riset dan teknologi"], kominfo: ["komunikasi dan informasi"] };
  const scored = divisions.map((division) => {
    const short = key(division.nama), long = key(division.namaLengkap);
    const variants = [short, long, long.replace(/^divisi /, ""), ...(knownNames[short] || [])].filter(Boolean);
    const score = variants.some((variant) => name === variant || name === `divisi ${variant}`) ? 3
      : variants.some((variant) => name.startsWith(`${variant} `) || name.startsWith(`divisi ${variant} `) || name.startsWith(`bph ${variant} `)) ? 2 : 0;
    return { division, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.score && scored[0].score > (scored[1]?.score || 0) ? scored[0].division : null;
}

export function safeDriveUrl(value) {
  try {
    const url = new URL(clean(value));
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function mapOprecSheetRecord(record, fields, divisions) {
  const entries = Object.entries(record.values);
  const used = new Set();
  const find = (terms) => {
    const found = entries.find(([header]) => terms.some((term) => key(header) === key(term)));
    if (found) used.add(found[0]);
    return found?.[1] || "";
  };
  const email = find(["Email Aktif", "Email"]);
  const values = {};
  const files = {};
  const unmatchedChoices = [];
  for (const field of fields) {
    const label = key(field.label);
    const semantic = [
      ...(label.includes("portofolio") ? ["Pengumpulan Portofolio"] : []),
      ...(label.includes("sertifikat") ? ["Pengumpulan Sertifikat", "Pengumpulan Serifikat"] : []),
      ...(label.includes("visi misi") ? ["Pengumpulan Visi Misi"] : []),
      ...(label.includes("ktm") ? ["Foto KTM"] : []),
      ...(label.includes("surat pernyataan") ? ["Pengumpulan Surat Pernyataan"] : []),
    ];
    const raw = find([field.label, field.name.replaceAll("_", " "), ...(aliases[field.name] || []), ...semantic]);
    if (!raw) continue;
    if (field.type === "file") { files[field.name] = raw; continue; }
    if (field.type === "checkbox") values[field.name] = /^ya\b/i.test(raw) ? "on" : "";
    else if (["select", "radio"].includes(field.type)) values[field.name] = field.options?.find((option) => key(option.value) === key(raw) || key(option.label) === key(raw))?.value || raw;
    else values[field.name] = raw;
  }
  const choiceHeaders = ["Pilihan Pertama", "Pilihan Kedua", "Pilihan Ketiga"];
  choiceHeaders.forEach((header, index) => {
    const raw = find([header]);
    const division = matchDivision(raw, divisions);
    if (division) {
      values[`divisi_pilihan_${index + 1}`] = String(division.id);
      if (key(division.nama) === "bph") {
        const position = raw.split("-").slice(1).join("-").trim();
        if (position) {
          const match = (division.jabatan || []).find((name) => key(name) === key(position) || key(name).includes(key(position)));
          if (match) values[`jabatan_pilihan_${index + 1}`] = match;
        }
      }
    } else if (raw) unmatchedChoices.push({ label: header, value: raw });
  });
  for (const consent of ["persetujuan_data_benar", "persetujuan_penggunaan_data"]) {
    const raw = find(aliases[consent]);
    if (raw) values[consent] = /^ya\b/i.test(raw) ? "on" : "";
  }
  const referenceHeaders = ["Wajib Memfollow IG Himanika", "Wajib Memfollow Tiktok Himanika"];
  const references = [...unmatchedChoices, ...referenceHeaders.map((header) => ({ label: header, value: find([header]) })).filter((item) => item.value)];
  const extras = entries.filter(([header, value]) => value && !used.has(header) && key(header) !== "timestamp").map(([label, value]) => ({ label, value }));
  return { email, values, files, references, extras, timestamp: find(["Timestamp"]) };
}
