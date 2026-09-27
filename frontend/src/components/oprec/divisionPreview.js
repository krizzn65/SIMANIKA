import { getDefaultJabatan } from "../../lib/oprec";

export { getDefaultJabatan };

export const divisionPreview = [
  { id: "bph", nama: "BPH", namaLengkap: "Badan Pengurus Harian", deskripsi: "Mengatur arah dan koordinasi organisasi.", logo: "/images/divisi/bph.webp", jabatan: getDefaultJabatan("BPH") },
  { id: "humas", nama: "Humas", namaLengkap: "Hubungan Masyarakat", deskripsi: "Menjalin komunikasi dan relasi HIMANIKA.", logo: "/images/divisi/humas.webp", jabatan: getDefaultJabatan("Humas") },
  { id: "psdm", nama: "PSDM", namaLengkap: "Pengembangan Sumberdaya Mahasiswa", deskripsi: "Mengembangkan potensi anggota dan mahasiswa.", logo: "/images/divisi/psdm.webp", jabatan: getDefaultJabatan("PSDM") },
  { id: "kominfo", nama: "Kominfo", namaLengkap: "Komunikasi & Informasi", deskripsi: "Mengelola informasi dan konten kreatif.", logo: "/images/divisi/kominfo.webp", jabatan: getDefaultJabatan("Kominfo") },
  { id: "kwu", nama: "KWU", namaLengkap: "Kewirausahaan", deskripsi: "Mengembangkan usaha dan merchandise organisasi.", logo: "/images/divisi/kwu.webp", jabatan: getDefaultJabatan("KWU") },
  { id: "ristek", nama: "Ristek", namaLengkap: "Riset & Teknologi", deskripsi: "Mendorong riset dan karya teknologi.", jabatan: getDefaultJabatan("Ristek") },
];

