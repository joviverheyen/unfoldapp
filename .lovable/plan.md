

# Generate Thumbnail Images on Save

## Overview
Instead of live-rendering post thumbnails with complex calculations in the browser, generate a static 600px-wide PNG thumbnail whenever a post is saved. Store it in the `post-images` bucket and reference it via a `thumbnail_url` column on the `posts` table. The Projects and PostsScreen pages then simply display an `<img>` tag.

## How it works

1. When the canvas auto-saves in `CanvasEditor` (the debounced save that already runs every 1.5s), also generate a thumbnail using the existing `exportCanvasToImage` function (at 600px width instead of 1080px) and upload it to storage.
2. Store the public URL in a new `thumbnail_url` column on the `posts` table.
3. Replace the `PostThumbnail` component usage in `Projects.tsx` and `PostsScreen.tsx` with a simple `<img src={post.thumbnail_url}>` tag.

## Changes

### 1. Database: Add `thumbnail_url` column to `posts`

```sql
ALTER TABLE public.posts ADD COLUMN thumbnail_url text;
```

### 2. Update `exportCanvasToImage` to accept a custom width

The function already uses `config.exportWidth` (1080). Add an optional `outputWidth` parameter so we can call it at 600px for thumbnails without changing the export behavior.

### 3. Update `CanvasEditor.tsx` -- generate thumbnail on save

Modify the `saveCanvas` function to:
- Call `exportCanvasToImage(canvasData, template, aspectRatio, 600)` to produce a small PNG blob
- Upload it to `post-images` storage at a path like `{userId}/{postId}/thumbnail.png` (overwriting each time)
- Save the public URL to the `thumbnail_url` column alongside the `canvas_data` update

To avoid generating a thumbnail on every keystroke, the existing 1.5s debounce is sufficient. The thumbnail generation runs in the background and doesn't block the UI.

### 4. Update `PostsScreen.tsx` -- use `thumbnail_url`

- Fetch `thumbnail_url` in the posts query
- Replace `<PostThumbnail>` with a simple `<img src={post.thumbnail_url}>` (with a fallback placeholder if no thumbnail exists yet)
- Remove the `PostThumbnail` import

### 5. Update `Projects.tsx` -- use `thumbnail_url`

- Fetch `thumbnail_url` in the posts query  
- Replace `<PostThumbnail>` with `<img src={post.thumbnail_url}>` (with fallback)
- Remove the `PostThumbnail` import

### 6. Clean up

- The `PostThumbnail` component can be deleted entirely since it's no longer used anywhere
- The `imageUtils.ts` file (with `getThumbnailUrl`) can also be deleted since thumbnails are now pre-generated

## Technical details

### Files to modify
- **`src/lib/exportCanvas.ts`** -- add optional `outputWidth` parameter
- **`src/pages/CanvasEditor.tsx`** -- generate and upload thumbnail during save
- **`src/pages/PostsScreen.tsx`** -- replace `PostThumbnail` with `<img>`
- **`src/pages/Projects.tsx`** -- replace `PostThumbnail` with `<img>`

### Files to delete
- **`src/components/PostThumbnail.tsx`** -- no longer needed
- **`src/lib/imageUtils.ts`** -- no longer needed

### Database migration
- Add `thumbnail_url text` column to `posts` table

### Performance benefits
- Eliminates per-thumbnail ResizeObserver, image dimension tracking, and scale calculations on every render
- Projects page and PostsScreen load a single small pre-rendered image per post instead of computing layouts
- Reduces JavaScript execution on list pages significantly
- Thumbnail generation cost is paid once on save (in the editor, where the user is already waiting) rather than repeatedly on every list render

