export async function resizeImage(file: File, maxWidth = 2000): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  if (bitmap.width <= maxWidth) {
    bitmap.close();
    return file;
  }

  const scale = maxWidth / bitmap.width;
  const width = maxWidth;
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try WebP first, fall back to PNG
  try {
    return await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
  } catch {
    return await canvas.convertToBlob({ type: "image/png" });
  }
}
