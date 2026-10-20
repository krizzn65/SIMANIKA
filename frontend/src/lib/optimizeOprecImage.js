const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 900 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const formatOprecImageSize = (bytes) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.round(bytes / 1024)} KB`;

const webpBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob || blob.type !== "image/webp") {
      reject(new Error("Browser tidak dapat mengoptimalkan gambar ini. Simpan poster sebagai WebP di bawah 1 MB lalu coba lagi."));
      return;
    }
    resolve(blob);
  }, "image/webp", quality);
});

export async function optimizeOprecImage(file) {
  if (!file || !IMAGE_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) {
    throw new Error("Gunakan gambar JPG, PNG, atau WebP maksimal 5 MB.");
  }
  if (file.size <= TARGET_UPLOAD_BYTES) return file;

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Gambar tidak dapat dibaca. Pilih berkas lain."));
      image.src = objectUrl;
    });

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new Error("Dimensi gambar tidak valid.");

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak dapat memproses gambar ini.");

    let scale = Math.min(1, 1600 / Math.max(width, height));
    for (let pass = 0; pass < 6; pass += 1) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.65]) {
        const blob = await webpBlob(canvas, quality);
        if (blob.size <= TARGET_UPLOAD_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, "") || "poster";
          return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
        }
      }
      scale *= 0.75;
    }

    throw new Error("Gambar belum bisa diperkecil di bawah 1 MB. Simpan sebagai WebP berukuran lebih kecil lalu coba lagi.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Gallery photos are shown at most ~1000px wide on 2x screens, so 1920px on the
// long edge keeps them sharp while cutting multi-MB camera shots to a few
// hundred KB. Small files that are already within bounds are kept as-is.
const GALLERY_MAX_EDGE = 1920;

export async function optimizeGalleryImage(file) {
  if (!file || !IMAGE_TYPES.has(file.type)) return file;

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = objectUrl;
    });
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, GALLERY_MAX_EDGE / Math.max(width, height));
    if (scale === 1 && file.size <= 400 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await webpBlob(canvas, 0.86).catch(() => null);
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "galeri";
    return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
