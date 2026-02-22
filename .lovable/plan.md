

# Rewrite Image Display, Zoom, and Pan

## The core problem

The current approach wraps the image in a div that is `w-full h-full` (100% of the slot), with the `<img>` using `object-cover`. When the wrapper scales down, the image **still** uses `object-cover` relative to the wrapper, so the browser just crops the same portion smaller -- it never reveals more of the original picture.

`object-cover` is the enemy here. It tells the browser to crop the image to fill its container, which is exactly what we do NOT want when zooming out.

## The fix: render the image at its natural "cover" size, no `object-fit`

Instead of relying on CSS `object-cover`, we will:

1. **Track each image's natural dimensions** via an `onLoad` handler, storing `{ naturalWidth, naturalHeight }` per slot in a ref/state map.
2. **Compute the "cover" size manually**: given the slot's pixel dimensions and the image's aspect ratio, calculate the width and height needed so the image just covers the slot (same math as `object-cover`, but we control it).
3. **Render the `<img>` at that computed size** with NO `object-fit`, positioned absolutely and centered in the slot.
4. **Apply the user's `scale` and `offset` as a CSS transform** on the image itself.

This means:
- At **scale = 1**, the image covers the slot exactly (same as before).
- At **scale < 1**, the image physically shrinks below the slot size, revealing its edges -- the full picture becomes visible.
- At **scale > 1**, the image grows beyond the slot and is clipped by `overflow: hidden`.
- **Panning** shifts the image within the clipped area.

## Changes

### 1. CanvasEditor.tsx -- image rendering rewrite

**Add natural dimensions tracking:**
- Add a state: `imageDimensions: Record<string, { w: number; h: number }>`
- On each `<img>` element, add an `onLoad` handler that reads `e.target.naturalWidth` / `naturalHeight` and stores them keyed by `slotId`

**Replace the image wrapper + img markup:**
- Remove the wrapper `<div>` with transform
- Render the `<img>` directly, absolutely positioned
- Use the slot's rendered pixel size (from a ref on the slot div) and the natural dimensions to compute cover-fit width/height
- Apply `transform: translate(offsetX, offsetY) scale(userScale)` and `transformOrigin: center` directly on the `<img>`
- Set `left: 50%; top: 50%; transform: translate(-50%, -50%) translate(offsetX, offsetY) scale(scale)` to center it

**Concrete style for the `<img>`:**
```
position: absolute
left: 50%
top: 50%
transform: translate(-50%, -50%) translate(offsetXpx, offsetYpx) scale(s)
transformOrigin: center center
width: computed cover width
height: computed cover height
pointer-events: none
(no object-fit at all)
```

The cover size computation:
```
imgRatio = naturalWidth / naturalHeight
slotRatio = slotPixelWidth / slotPixelHeight
if imgRatio > slotRatio:
  coverHeight = slotPixelHeight
  coverWidth = coverHeight * imgRatio
else:
  coverWidth = slotPixelWidth
  coverHeight = coverWidth / imgRatio
```

Before natural dimensions are known (image still loading), fall back to `width: 100%; height: 100%; object-fit: cover` as a placeholder.

### 2. PostThumbnail.tsx -- match the same approach

Update the thumbnail renderer to use the same rendering logic so thumbnails accurately reflect the editor view. Since thumbnails are small and non-interactive, a simpler version is fine: just remove `object-cover` and apply the same computed sizing.

### 3. exportCanvas.ts -- no changes needed

The export function already does manual cover-size computation (lines 54-63) and draws with `drawImage`, so it already handles this correctly and will stay in sync.

### 4. Double-tap reset -- already implemented

The double-tap detection in `handlePointerDown` is already in place and resets `offsetX`, `offsetY`, and `scale` to their defaults.

## Technical details

### Files to modify

**`src/pages/CanvasEditor.tsx`**
- Add `imageDimensions` state: `Record<string, { w: number; h: number }>`
- Add `onLoad` handler to each `<img>` to populate dimensions
- Replace image slot rendering (lines 288-301): remove wrapper div, render img directly with computed cover size and combined transform
- The slot container div keeps `overflow-hidden` and `position: absolute`

**`src/components/PostThumbnail.tsx`**
- Apply same rendering approach to thumbnail images (simpler version without interactivity)

### No data model changes
`CanvasImageData` fields (`offsetX`, `offsetY`, `scale`) remain the same. The only change is how the browser renders them.
