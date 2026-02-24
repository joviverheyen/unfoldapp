/**
 * Convert a Supabase Storage public URL into a transformed thumbnail URL.
 * Uses Supabase's built-in image transformation API to serve resized images.
 *
 * Only applies to URLs containing the standard `/storage/v1/object/public/` path.
 * Non-matching URLs (e.g. external images) are returned unchanged.
 */
export function getThumbnailUrl(
  imageUrl: string,
  width = 600,
  quality = 85
): string {
  if (!imageUrl.includes("/storage/v1/object/public/")) {
    return imageUrl;
  }
  return (
    imageUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    ) + `?width=${width}&quality=${quality}&resize=cover`
  );
}
