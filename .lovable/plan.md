# Phase 5: Polish, Export, and Thumbnails

## What's included

### 1. Image Export (Canvas to downloadable image)

- Wire the existing "Export" button to render the canvas as a 1080px-wide image using the HTML Canvas API
- Draw all image slots, text areas, and background onto an offscreen canvas at export resolution
- Trigger a browser download of the resulting PNG
- Support batch export: add an "Export All" option on the Posts screen that downloads all posts in the project as individual images

### 2. Live Post Thumbnails

- On the Posts screen, replace the generic placeholder icons with a mini rendered preview of each post's actual canvas data (images + background + layout)
- On the Projects screen, show the first few post thumbnails in each project card instead of gray placeholder boxes
- Use the stored `canvas_data` and template definition to render these previews

### 3. Canvas Editor Toolbar

- Add a bottom toolbar panel to the canvas editor with:
  - **Background color picker**: a row of preset color swatches plus a custom color input
  - **Text controls** (shown when a text area is focused): font selection (Northwell & Amiri), font size slider, color picker, alignment toggle (left/center/right)
  - **Image slot actions** (shown when clicking a filled image slot): Replace and Remove buttons instead of immediately opening the file picker

### 4. Delete Actions

- Add swipe-to-delete or a delete button on post thumbnails in the Posts screen
- Add a delete/archive option on project cards in the Projects screen

### 5. UI Polish

- Add smooth page transition animations between Projects, Posts, and Canvas screens
- Improve loading states with skeleton placeholders instead of plain "Loading..." text
- Ensure touch targets are at least 44px on mobile

---

## Technical details

### Export implementation

- Create a utility function `exportCanvasToImage(canvasData, template, aspectRatio)` in `src/lib/exportCanvas.ts`
- Uses `OffscreenCanvas` or a hidden `<canvas>` element
- Loads all slot images via `Image()` objects, draws them at their positions with offset/scale transforms
- Renders text areas with matching font, size, color, alignment
- Outputs as PNG blob, triggers download via `URL.createObjectURL` + hidden anchor click
- For batch export, iterates all posts in the project and downloads each

### Thumbnail rendering

- Create a `PostThumbnail` component that takes `canvasData`, `templateDefinition`, and `aspectRatio`
- Renders a small DOM-based preview (reuses the same layout logic as the canvas but at thumbnail scale)
- Images are shown via `<img>` tags with `object-cover`; text is rendered but truncated for small sizes

### Editor toolbar

- Add state tracking for `activeElement` (which slot or text area is selected)
- Conditionally render image controls vs text controls based on selection
- Background color updates `canvasData.background`; text controls update the matching entry in `canvasData.texts`

### Files to create/modify

- **New**: `src/lib/exportCanvas.ts` (export utility)
- **New**: `src/components/PostThumbnail.tsx` (reusable thumbnail)
- **New**: `src/components/EditorToolbar.tsx` (bottom toolbar for canvas)
- **Modified**: `src/pages/CanvasEditor.tsx` (integrate toolbar, wire export, add slot selection logic)
- **Modified**: `src/pages/PostsScreen.tsx` (use PostThumbnail, add delete action)
- **Modified**: `src/pages/Projects.tsx` (fetch post thumbnails, add delete action, skeleton loading)