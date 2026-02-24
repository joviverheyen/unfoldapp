

# Performance Optimization for Unfold

## Phase 1: React Component Memoization (Immediate)

### PostThumbnail -- wrap with React.memo
Add `React.memo` with a custom comparator that checks `canvasData`, `template`, and `aspectRatio` by shallow reference. This prevents re-renders when the parent re-renders but the thumbnail data hasn't changed (e.g., during drag reorder on PostsScreen).

### CanvasEditor -- memoize handlers with useCallback
Several inline handlers (e.g., `handleSlotClick`, pointer handlers) are already using `useCallback` for `saveCanvas`, but image `onLoad` and other handlers can be stabilized to reduce unnecessary child re-renders.

## Phase 2: Code Splitting (High Impact on Load Time)

### Lazy-load route components
The app currently imports all page components eagerly in `App.tsx`. Wrap each route component with `React.lazy` + `Suspense` so the canvas editor bundle (the heaviest page) is only loaded when needed.

**Changes to `src/App.tsx`:**
- Replace static imports with `const Projects = lazy(() => import('./pages/Projects'))` etc.
- Wrap `<Routes>` in `<Suspense fallback={...}>`

## Phase 3: Projects Page -- Parallel Fetch Fix

The Projects page currently fetches projects first, then fetches posts sequentially. It should use `Promise.all` to fetch both in parallel (the posts query uses `.in()` on project IDs, so this needs a slight restructure -- fetch all user posts and group client-side, or keep the sequential approach but at least make the two queries independent).

**Note:** PostsScreen already uses `Promise.all` for its three queries -- no change needed there.

**Changes to `src/pages/Projects.tsx`:**
- Restructure the fetch to use `Promise.all` where possible, or at minimum move the posts fetch to not block project display.

## Phase 4: Database Indexes

Add indexes to speed up the most common queries:

```sql
CREATE INDEX IF NOT EXISTS idx_posts_project_sort ON posts(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);
```

## Summary of Files to Modify

| File | Change |
|------|--------|
| `src/components/PostThumbnail.tsx` | Wrap export with `React.memo` + custom comparator |
| `src/App.tsx` | Add `React.lazy` + `Suspense` for route components |
| `src/pages/Projects.tsx` | Restructure fetch for parallelism |
| Database migration | Add two indexes |

## What's NOT included (and why)

- **Image optimization / WebP / thumbnails**: Would require a storage transformation pipeline (edge function or Supabase image transforms). This is a separate, larger effort.
- **React Query migration**: The existing `useEffect`-based fetching works fine for this app's scale. Migrating to React Query would be beneficial but is a larger refactor better done as its own task.
- **Web Vitals monitoring**: Nice-to-have but doesn't improve performance itself -- can be added separately.

