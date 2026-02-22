

# Fix Image Zoom/Pan and Add Double-Tap Reset

## Problem
When zooming out, the image doesn't reveal more of itself because `object-cover` forces the image to always fill the slot. The transform (translate + scale) operates on an already-cropped image, so zooming out just shows the cropped portion smaller with empty space never filling in with the rest of the picture.

## Solution

### 1. Fix image rendering in slots (CanvasEditor.tsx)

Change the `<img>` element inside image slots:
- Remove `object-cover` -- this CSS property crops the image to fill the container, which defeats zooming out
- Remove `w-full h-full` -- these constrain the image dimensions to the slot
- Instead, use `absolute` positioning with a large size (e.g., `min-w-full min-h-full`) and let the transform handle framing
- Add `transform-origin: center center` so zoom scales from the middle of the slot
- Keep `overflow-hidden` on the container so the image is clipped to the slot boundary

The key change: the image should be rendered at its natural aspect ratio, centered in the slot, with scale=1 meaning "cover the slot" and scale < 1 revealing more of the image.

### 2. Add double-tap to reset (CanvasEditor.tsx)

- Track last tap time with a ref (`lastTapTime`)
- On `onPointerDown`, check if the time since last tap is < 300ms
- If so, reset the image's `offsetX`, `offsetY` to 0 and `scale` to 1
- This provides a quick way to reset framing without needing the toolbar

## Technical details

### CanvasEditor.tsx changes

**Image element styling** (around line 270):
- Change from: `className="w-full h-full object-cover pointer-events-none"`
- Change to: `className="absolute top-1/2 left-1/2 pointer-events-none"` with inline style `transform: translate(-50%, -50%) translate(offsetX, offsetY) scale(scale)` and `minWidth: 100%, minHeight: 100%, objectFit: cover` at scale 1, but switching to `objectFit: contain` isn't quite right either.

Better approach: Use the image at `width: 100%; height: 100%; object-fit: cover` but wrap it in an inner div that receives the transform. This way:
- At scale 1, the image covers the slot naturally
- At scale < 1, the inner div shrinks, revealing that the image is smaller than the slot (but the slot background shows through)
- At scale > 1, the image overflows (clipped by the slot's overflow-hidden)

Actually, the simplest correct fix:
- Keep `object-fit: cover` but set the image size larger than the slot (e.g., `width: 100%` and `height: auto` or vice versa depending on aspect ratio)
- OR: Remove `object-cover`, set `object-fit: none` (renders at natural size), center the image, and let transform handle everything

The cleanest approach: Set the image to `position: absolute; width: 100%; height: 100%; object-fit: cover;` and apply the transform to a wrapper div around it. When scale < 1, the wrapper shrinks below the slot size, revealing more of the image edges. The slot's `overflow: hidden` clips to the boundary.

**Double-tap reset**:
- Add ref: `const lastTapTime = useRef(0)`
- In `handlePointerDown`, before starting drag:
  ```
  const now = Date.now();
  if (now - lastTapTime.current < 300) {
    handleImageUpdate(slotId, { offsetX: 0, offsetY: 0, scale: 1 });
    lastTapTime.current = 0;
    return; // don't start drag
  }
  lastTapTime.current = now;
  ```

### Files to modify
- **`src/pages/CanvasEditor.tsx`** -- fix image transform approach and add double-tap reset logic

