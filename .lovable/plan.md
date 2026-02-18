
# Unfold — Mobile-First Visual Story Creator

## Overview
A 3-layer content creation app (Projects → Posts → Canvas) for building visual stories and social media posts using pre-designed templates. Cloud-backed with Supabase for persistence and image storage.

---

## Phase 1: Foundation & Data Layer

### Supabase Setup
- **Database tables**: `projects`, `posts`, `templates`
- **Storage bucket**: `post-images` for user-uploaded photos
- **Authentication**: Email-based sign-up/login so users can access their projects from any device

### Template System
- Ship with ~6 starter templates covering common layouts:
  - Single image (full bleed)
  - Two-image vertical split
  - Two-image horizontal split
  - Image + text overlay
  - Text-only with styled background
  - Three-image collage
- Templates stored as JSON definitions in the `templates` table (image slot positions, text areas, default styles)
- Designed so an admin can easily add new templates by inserting rows into the database

---

## Phase 2: Projects Screen (Home)

- List of project cards showing title, date, and small post thumbnails
- Floating "+" button to create a new project
- Tap a project card → navigate to its Posts screen
- Soft, rounded card design with gentle shadows
- Empty state with friendly illustration/message for first-time users

---

## Phase 3: Posts Screen (Project Detail)

- Header with back arrow and project title (editable)
- Grid of post thumbnails showing current state of each post
- "+" button to add a new post
- When adding a post: user selects **aspect ratio** (9:16 Story, 1:1 Square, 4:5 Portrait), then picks a template
- Template picker: browsable grid of template previews filtered to the selected format
- Tap existing post thumbnail → opens Canvas editor

---

## Phase 4: Canvas Editor

### Core editing experience
- Large canvas preview area showing the post at the correct aspect ratio
- **Image placeholders**: Tap an empty slot → file picker → image fills that slot
- **Image editing**: Tap a filled slot to drag/reposition, pinch-to-zoom (scale), or replace/remove the image
- **Text editing**: Tap template text areas to edit content, change font size, color, and alignment; drag to reposition
- **Background**: Color picker or preset colors/gradients for the post background

### Top bar
- Back button (returns to Posts screen)
- Save/Export button

### Save & Export
- Renders the canvas as a downloadable image at the correct resolution (1080px wide)
- Option to export current post or batch-export all posts in the project
- Non-destructive: editable state always preserved

---

## Phase 5: Polish & Supporting Features

- **Thumbnail generation**: Posts screen shows live preview thumbnails reflecting latest edits
- **Re-entry**: Opening an existing post restores all previous edits
- **Responsive layout**: Mobile-first design that works well on tablet/desktop too
- **Soft, friendly UI**: Rounded corners, gentle shadows, warm neutral palette, smooth transitions between screens

---

## Design Direction
- Clean, minimal interface inspired by Unfold's aesthetic
- Soft whites and light grays with subtle shadows
- Rounded cards and buttons
- Smooth page transitions between the 3 levels
- Mobile-optimized touch targets with desktop compatibility
