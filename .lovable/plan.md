
# Fix Image Aspect Ratio in Editor

## Root Cause
The editor manually calculates "cover" dimensions using two separate state objects (`imageDimensions` from `onLoad` and `slotSizes` from ResizeObserver). These can be stale, mis-timed, or affected by rounding, causing wrong aspect ratios. The export works correctly because it uses the browser's native image loading and computes dimensions freshly each time.

## Solution
Replace the manual cover calculation with native CSS `object-fit: cover`, and apply pan/zoom as a CSS `transform`. The browser handles the aspect ratio correctly, and `overflow: hidden` on the slot container clips the result.

**Before (broken):**
```text
Track naturalWidth/Height in state --> track slot pixels via ResizeObserver --> manually compute cover dimensions --> set explicit pixel width/height on img
```

**After (reliable):**
```text
img { width: 100%; height: 100%; object-fit: cover; transform: translate(offset) scale(zoom) }
```

## Changes

### Modify `src/pages/CanvasEditor.tsx`

1. **Remove `imageDimensions` state and `slotSizes` state and `slotRefs`** -- no longer needed since the browser handles cover natively.

2. **Remove the ResizeObserver useEffect** -- no longer needed.

3. **Simplify image rendering** in the slot loop. Replace the entire manual cover calculation block with:
   ```tsx
   <img
     src={imgData.imageUrl}
     alt=""
     style={{
       width: '100%',
       height: '100%',
       objectFit: 'cover',
       transform: `translate(${imgData.offsetX}px, ${imgData.offsetY}px) scale(${imgData.scale})`,
       pointerEvents: 'none',
     }}
   />
   ```
   The `onLoad` handler for dimension tracking is also removed.

4. **Remove `data-slot-id` and `ref` assignments** on slot divs since they were only for the ResizeObserver.

### What stays the same
- Export logic (already works correctly)
- Drag-to-pan and pointer handling (unchanged, operates on `offsetX/offsetY/scale`)
- Zoom slider in toolbar (unchanged)
- Double-tap reset (unchanged)
- File upload and resize flow (unchanged)

### Why this works
- `object-fit: cover` makes the browser fill the slot while preserving the image's aspect ratio -- this is the same logic the export does manually with canvas
- `transform: translate()` shifts the covered image for panning (clipped by `overflow: hidden` on the slot container)
- `transform: scale()` zooms in/out from the image center
- No manual dimension tracking means no stale state, no timing issues, no rounding errors
