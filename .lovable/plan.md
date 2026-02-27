

# Resize Large Images Before Upload

## Problem
Large photos (5MB+) are uploaded at their original resolution, which can cause aspect ratio rendering issues in the editor and wastes storage bandwidth. A 4000x6000px photo is overkill for templates that render at ~360px wide and export at 1080px.

## Solution
Create a client-side `resizeImage` utility that downscales any uploaded image to a maximum width of 2000px (preserving aspect ratio) using an HTML Canvas element before uploading to storage. This runs entirely in the browser -- no backend changes needed.

## Changes

### 1. New utility: `src/lib/resizeImage.ts`

A function that takes a `File`, draws it onto a canvas capped at 2000px width, and returns a resized `Blob`:

```typescript
export async function resizeImage(file: File, maxWidth = 2000): Promise<Blob> {
  // Load file into an Image element
  // If width <= maxWidth, return original file as-is
  // Otherwise, scale down proportionally and draw to canvas
  // Return as WebP or PNG blob
}
```

Key details:
- Preserves aspect ratio -- only scales down, never up
- Images already under 2000px wide pass through unchanged
- Outputs as `image/webp` (smaller files) with PNG fallback
- Runs entirely client-side using Canvas API

### 2. Update `src/pages/CanvasEditor.tsx` -- resize before upload

In `handleFileChange`, call `resizeImage(file)` before uploading to storage:

```typescript
const resizedBlob = await resizeImage(file, 2000);
const { error } = await supabase.storage.from("post-images").upload(path, resizedBlob);
```

This is the only code change needed in the editor. The rest of the flow (URL generation, canvas data, export) stays the same.

## Technical details

### Files to create
- **`src/lib/resizeImage.ts`** -- client-side image resize utility

### Files to modify
- **`src/pages/CanvasEditor.tsx`** -- call `resizeImage()` before `supabase.storage.upload()`

### What this achieves
- A 5MB 4000x6000 JPEG becomes roughly 200-500KB at 2000px wide
- Fixes aspect ratio rendering issues caused by browsers struggling with very large images
- 2000px is more than sufficient for 1080px exports
- No impact on existing uploaded images (only affects new uploads)
- No backend or database changes required

