

# Image Zoom and Pan Inside Slots

## What it does
When an image is placed inside a slot, users will be able to:
- **Zoom**: Use a slider in the toolbar to scale the image (0.5x to 3x) within its frame
- **Pan/Move**: Drag the image with touch or mouse to reposition it inside the frame

The data model already supports this -- `CanvasImageData` has `offsetX`, `offsetY`, and `scale` fields, and the export logic in `exportCanvas.ts` already renders them. We just need to wire up the UI controls.

---

## Changes

### 1. Drag-to-pan on image slots (CanvasEditor.tsx)
- Add `onPointerDown` / `onPointerMove` / `onPointerUp` handlers to image slot `<div>`s (only when the slot is active and has an image)
- Track drag start position, compute delta, and update `imgData.offsetX` / `offsetY` in `canvasData`
- Use `pointer-events` and `touch-action: none` so it works on both desktop and mobile

### 2. Zoom slider in the toolbar (EditorToolbar.tsx)
- When an image slot is selected, show a zoom `<Slider>` (range 0.5 to 3, step 0.05, default 1) alongside the existing Replace/Remove buttons
- Add a new `onImageUpdate` callback prop to pass scale changes back to the parent

### 3. Wire it together (CanvasEditor.tsx)
- Add a `handleImageUpdate(slotId, updates)` function that merges partial updates (`scale`, `offsetX`, `offsetY`) into the matching `CanvasImageData`
- Pass it to `EditorToolbar` as `onImageUpdate`

---

## Technical details

### Files to modify

**`src/pages/CanvasEditor.tsx`**
- New `handleImageUpdate(slotId, updates: Partial<CanvasImageData>)` function
- Add drag state refs: `isDragging`, `dragStart { x, y }`, `dragSlotId`
- Attach `onPointerDown`, `onPointerMove`, `onPointerUp` to each image slot div
- On drag: compute delta from start, update `offsetX`/`offsetY` via `handleImageUpdate`
- Pass `onImageUpdate` prop to `EditorToolbar`

**`src/components/EditorToolbar.tsx`**
- Add `onImageUpdate` to props interface
- In the image-selected section, add a `<Slider>` for zoom (value = `activeImage.scale`, range 0.5-3)
- On slider change, call `onImageUpdate(slotId, { scale: value })`
- Layout: zoom slider above the Replace/Remove buttons

### No data model changes needed
`CanvasImageData` already has `offsetX`, `offsetY`, `scale` and the export logic already uses them.
