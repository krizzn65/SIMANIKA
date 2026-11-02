// Phone photos are often 3–6 MB; uploading them to the hosting can stall until
// the request times out. Shrink large JPG/PNG uploads in the browser first.
const MAX_SIDE = 1600;
const QUALITY = 0.82;
const MIN_BYTES = 500 * 1024;

async function shrink(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff"; // PNG transparency becomes white, like paper.
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.(png|jpe?g)$/i, "") + ".jpg", { type: "image/jpeg", lastModified: file.lastModified });
}

// Returns a copy of the FormData with large images compressed. `acceptsJpeg(name)`
// says whether a field may receive a JPG (a PNG-only field keeps its PNG).
export async function compressUploadImages(formData, acceptsJpeg = () => true) {
  const result = new FormData();
  for (const [name, value] of formData.entries()) {
    const image = value instanceof File && value.size > MIN_BYTES && /^image\/(jpeg|png)$/.test(value.type);
    if (image && (value.type === "image/jpeg" || acceptsJpeg(name))) {
      try { result.append(name, await shrink(value)); continue; } catch { /* keep the original */ }
    }
    result.append(name, value);
  }
  return result;
}
