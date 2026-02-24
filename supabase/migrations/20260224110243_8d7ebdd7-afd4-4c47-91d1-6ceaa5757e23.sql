CREATE INDEX IF NOT EXISTS idx_posts_project_sort ON public.posts(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);