

# Add Post Reorder (Drag-and-Drop)

## Overview
Add the ability to reorder posts in the project view by long-pressing and dragging them to a new position. The new order will be saved to the database.

## Approach
Use native HTML drag-and-drop (no new dependencies needed) on the post grid items. When a post is dropped in a new position, update the local state and persist the new `sort_order` values to the database.

## Changes

### PostsScreen.tsx

1. **Add drag state**: Track which post is being dragged and which position it's hovering over using `useState` (`dragIndex` and `dragOverIndex`).

2. **Make post items draggable**: Add `draggable` attribute and handlers to each post card:
   - `onDragStart` -- set the dragged post index, add a visual style (e.g., reduced opacity)
   - `onDragOver` -- prevent default, set the drag-over index to show a visual drop indicator
   - `onDragEnd` -- clear drag state
   - `onDrop` -- reorder the posts array, update state, persist to database

3. **Visual feedback**: 
   - The dragged item gets reduced opacity
   - The drop target gets a highlighted border or subtle indicator showing where the post will land

4. **Persist reorder**: After dropping, compute new `sort_order` values (simply use array index) and batch-update all affected posts in the database:
   ```typescript
   const reorderPosts = async (fromIndex: number, toIndex: number) => {
     const reordered = [...posts];
     const [moved] = reordered.splice(fromIndex, 1);
     reordered.splice(toIndex, 0, moved);
     setPosts(reordered);
     
     // Update sort_order for all posts
     await Promise.all(
       reordered.map((post, i) =>
         supabase.from("posts").update({ sort_order: i }).eq("id", post.id)
       )
     );
   };
   ```

5. **Touch support**: Add `onTouchStart`, `onTouchMove`, and `onTouchEnd` handlers as a fallback for mobile devices where native drag-and-drop is less reliable. Alternatively, use a simpler approach with up/down arrow buttons visible on each card for mobile reordering.

## Technical details

### Files to modify
- **`src/pages/PostsScreen.tsx`** -- add drag state, drag event handlers on post cards, reorder function with database persistence, and visual drag feedback styling

### No database changes needed
The `sort_order` column already exists on the `posts` table and is used for ordering.

