const SIZE = 384;
const MAX_CHARS = 180_000;

export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file is not a photo.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);
  const url = canvas.toDataURL("image/jpeg", 0.82);
  if (url.length > MAX_CHARS) throw new Error("That photo is still too heavy. Try a tighter crop.");
  return url;
}

export function isPhotoUrl(value: string) {
  return (
    value.startsWith("data:image/jpeg") ||
    value.startsWith("data:image/png") ||
    value.startsWith("data:image/webp")
  );
}
