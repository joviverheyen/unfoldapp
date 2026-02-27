import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, Layers, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


interface ProjectPost {
  id: string;
  aspect_ratio: string;
  thumbnail_url: string | null;
}

interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectPosts, setProjectPosts] = useState<Record<string, ProjectPost[]>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const [projectsRes, postsRes] = await Promise.all([
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("posts").select("id, aspect_ratio, thumbnail_url, project_id").order("sort_order")]
      );

      if (projectsRes.error) {
        toast({ title: "Error", description: projectsRes.error.message, variant: "destructive" });
      } else {
        setProjects(projectsRes.data ?? []);
      }

      if (postsRes.data) {
        const grouped: Record<string, ProjectPost[]> = {};
        for (const post of postsRes.data as any[]) {
          const pid = post.project_id;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(post);
        }
        setProjectPosts(grouped);
      }

      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  const createProject = async () => {
    if (!user) return;
    const { data, error } = await supabase.
    from("projects").
    insert({ user_id: user.id, title: "Untitled Project" }).
    select().
    single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      navigate(`/project/${data.id}`);
    }
  };

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Delete posts first, then project
    await supabase.from("posts").delete().eq("project_id", projectId);
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
          <h1 className="text-2xl font-bold tracking-tight">Unfold</h1>
        </header>
        <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) =>
          <Skeleton key={i} className="h-20 rounded-2xl" />
          )}
        </main>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <h1 className="text-2xl font-bold tracking-tight">Unfold</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {projects.length === 0 ?
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-secondary p-5">
              <Layers className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-1">No projects yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Create your first project to start building beautiful stories.
            </p>
            <Button onClick={createProject} className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div> :

        projects.map((project) => {
          const previewPosts = projectPosts[project.id] || [];

          return (
            <Card
              key={project.id}
              className="cursor-pointer border-0 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4 group relative"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-base text-foreground truncate">{project.title}</h3>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {previewPosts.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 w-max pr-2">
                      {previewPosts.map((post) => (
                        <div
                          key={post.id}
                          className="w-14 h-20 rounded border border-[#f1edea] bg-[#f1edea] overflow-hidden shrink-0"
                        >
                          {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => deleteProject(project.id, e)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </Card>
          );
        })
        }
      </main>

      {projects.length > 0 &&
      <Button
        onClick={createProject}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl">

          <Plus className="h-6 w-6" />
        </Button>
      }
    </div>);

};

export default Projects;
