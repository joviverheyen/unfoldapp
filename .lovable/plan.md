

# Fix Image Aspect Ratio Distortion

## Problem
Images are being distorted because `slotEl.offsetWidth` / `offsetHeight` are read directly during render. These values can be 0 or stale before layout completes, causing the cover-size computation to produce incorrect dimensions. The image then stretches to fill the slot without respecting its natural aspect ratio.

## Solution
Replace the direct DOM measurement (`slotEl.offsetWidth`) with a `ResizeObserver`-based approach that stores slot pixel dimensions in state. This ensures:
- Dimensions are always accurate and up-to-date
- A re-render is triggered whenever slot size changes (e.g., window resize)
- The cover-size math always receives valid inputs

## Changes

### 1. CanvasEditor.tsx

- Add a `slotSizes` state: `Record<string, { w: number; h: number }>`
- Add a `useEffect` with a `ResizeObserver` that watches all slot ref elements and updates `slotSizes` when they change
- In the image rendering logic, read from `slotSizes[slot.id]` instead of `slotEl.offsetWidth` / `slotEl.offsetHeight`
- Add a guard: if slot size is 0 or unknown, use the `objectFit: 'cover'` fallback (which correctly preserves aspect ratio)

### 2. PostThumbnail.tsx

- Apply the same `ResizeObserver` approach to keep thumbnail rendering consistent with the editor

## Technical details

### Files to modify
- **`src/pages/CanvasEditor.tsx`** -- add `slotSizes` state, `ResizeObserver` effect, replace `slotEl.offsetWidth/Height` reads with state lookups
- **`src/components/PostThumbnail.tsx`** -- same pattern for thumbnail image rendering

### Key code pattern
```typescript
const [slotSizes, setSlotSizes] = useState<Record<string, { w: number; h: number }>>({});

useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    const updates: Record<string, { w: number; h: number }> = {};
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.slotId;
      if (id) {
        updates[id] = { w: entry.contentRect.width, h: entry.contentRect.height };
      }
    }
    if (Object.keys(updates).length > 0) {
      setSlotSizes((prev) => ({ ...prev, ...updates }));
    }
  });
  Object.values(slotRefs.current).forEach((el) => {
    if (el) observer.observe(el);
  });
  return () => observer.disconnect();
}, [template]);
```

Then in the image rendering:
```typescript
const slotSize = slotSizes[slot.id];
if (dims && slotSize && slotSize.w > 0 && slotSize.h > 0) {
  // use slotSize.w and slotSize.h for cover computation
} else {
  // fallback: objectFit: 'cover'
}
```

This guarantees dimensions are measured after layout and updated on resize, so the cover computation always produces correct aspect-ratio-preserving sizes.
