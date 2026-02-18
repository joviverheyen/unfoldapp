import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  const createProject = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, title: "Untitled Project" })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      navigate(`/project/${data.id}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <h1 className="text-2xl font-bold tracking-tight">Unfold</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {projects.length === 0 ? (
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
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer border-0 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-4"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-sans text-base">{project.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {/* Thumbnail placeholders */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-7 rounded-md bg-secondary"
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </main>

      {/* FAB */}
      {projects.length > 0 && (
        <Button
          onClick={createProject}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Projects;
