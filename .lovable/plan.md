

# Image Optimization with Thumbnails

## Problem
Currently, full-resolution images are loaded everywhere -- including the small post grid thumbnails on the Posts screen. A user might upload a 4000x6000px photo, and that same file gets loaded for a ~120px wide thumbnail card. This wastes bandwidth and slows down rendering.

## Solution
Use Supabase Storage's built-in image transformation API to serve resized images for thumbnails. No new dependencies or edge functions needed.

Supabase Storage supports on-the-fly transforms via the `/render/image/` URL path with query parameters like `width`, `quality`, and `format`. We'll create a utility that converts a standard public URL into a transformed one.

## Changes

### 1. New utility: `src/lib/imageUtils.ts`

Create a helper function that takes a Supabase Storage public URL and returns a transformed URL:

```typescript
export function getThumbnailUrl(
  imageUrl: string,
  width = 300,
  quality = 75
): string {
  // Convert .../object/public/... to .../render/image/public/...
  return imageUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  ) + `?width=${width}&quality=${quality}`;
}
```

This works because Supabase Storage URLs follow a predictable pattern. The original URL stays untouched in `canvasData` (needed for full-res editing and export).

### 2. Update `PostThumbnail.tsx`

Import `getThumbnailUrl` and use it for the `<img src>`. Since thumbnails render at roughly 120px wide in a 3-column grid, requesting a 300px wide image (for retina) is sufficient:

```typescript
src={getThumbnailUrl(imgData.imageUrl, 300)}
```

### 3. Update `CanvasEditor.tsx` (no change to image src)

The editor needs full-resolution images for quality editing and export, so we do NOT apply thumbnailing there. No changes needed.

## Technical details

### Files to create
- **`src/lib/imageUtils.ts`** -- `getThumbnailUrl()` utility function

### Files to modify
- **`src/components/PostThumbnail.tsx`** -- use `getThumbnailUrl()` for image `src`

### How Supabase image transforms work
- Standard public URL: `{url}/storage/v1/object/public/post-images/{path}`
- Transform URL: `{url}/storage/v1/render/image/public/post-images/{path}?width=300&quality=75`
- Supabase caches transformed images automatically
- Original files remain untouched

### What this achieves
- Thumbnail images drop from potentially several MB to ~20-50KB each
- Faster Posts screen load, especially with many posts
- No impact on editor quality or export resolution

