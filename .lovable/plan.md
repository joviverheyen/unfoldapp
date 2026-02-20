

# Editor Toolbar Redesign: Dynamic Panels, Font Selection, and Text Formatting

## Changes

### 1. Dynamic toolbar content based on selection
- **Nothing selected** → show background color swatches only
- **Text selected** → show text controls only (font, size, color, alignment, bold/italic/underline)
- **Image selected** → show Replace and Remove buttons only
- Remove the "always visible" background section — it only appears when nothing is selected

### 2. Font selection
Add a font picker grid (3 columns, matching the reference screenshot) with these 9 fonts:
- Montserrat, Amiri, Playfair Display, Northwell, Bebas Neue, Rustico, Canela, Cinzel, Forum
- Each font button label is rendered in its own font for a live preview
- Selected font gets a highlighted state (white background, dark text — like the screenshot)
- Fonts loaded via Google Fonts (for those available) or `@font-face` declarations

### 3. Remove labels
Remove the "Size", "Color", "Align", "Background" text labels in front of each control row

### 4. Bold, Italic, Underline controls
Add B/I/U toggle buttons to the text toolbar section. These are toggleable per text area.

### 5. Data model updates
Extend `CanvasTextData` in `src/types/template.ts` with:
- `fontFamily: string` (default: "DM Sans")
- `bold: boolean` (default: false)
- `italic: boolean` (default: false)
- `underline: boolean` (default: false)

---

## Technical details

### Files to modify
- **`src/types/template.ts`** — add `fontFamily`, `bold`, `italic`, `underline` to `CanvasTextData`
- **`src/components/EditorToolbar.tsx`** — complete rewrite of toolbar: conditional rendering by selection type, font picker grid, B/I/U toggles, remove labels
- **`src/pages/CanvasEditor.tsx`** — update `onTextUpdate` type to include new properties; apply `fontFamily`, `fontWeight`, `fontStyle`, `textDecoration` to text areas on canvas; update default text initialization to include new fields
- **`src/lib/exportCanvas.ts`** — update export to use selected font, bold/italic/underline in `ctx.font` and `ctx.textDecoration` rendering
- **`src/index.css`** — add `@import` or `@font-face` rules for all 9 fonts (Google Fonts where available)

### Font loading strategy
- Google Fonts CDN for: Montserrat, Amiri, Playfair Display, Bebas Neue, Cinzel, Forum
- For Northwell, Rustico, Canela — these are commercial/custom fonts. We'll use close Google Fonts alternatives or add placeholder `@font-face` declarations that can be swapped for real font files later:
  - Northwell → use a script font like "Dancing Script" as stand-in (or load if user provides files)
  - Rustico → use "Permanent Marker" as stand-in
  - Canela → use "Cormorant Garamond" as stand-in

### Toolbar layout
When text is selected, the toolbar shows a compact set of icon-based controls in a horizontal row (size slider, color swatches, alignment buttons, B/I/U toggles) plus a scrollable font picker grid below — similar to the reference screenshot's two-tier layout.

