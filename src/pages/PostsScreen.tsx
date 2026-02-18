import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio, ASPECT_RATIO_CONFIG, TemplateDefinition } from "@/types/template";

interface Post {
  id: string;
  aspect_ratio: string;
  template_id: string | null;
  canvas_data: any;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  aspect_ratios: string[];
  definition: TemplateDefinition;
}

const PostsScreen = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("9:16");
  const [step, setStep] = useState<"ratio" | "template">("ratio");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchData = async () => {
      const [projectRes, postsRes, templatesRes] = await Promise.all([
        supabase.from("projects").select("title").eq("id", projectId).single(),
        supabase.from("posts").select("*").eq("project_id", projectId).order("sort_order"),
        supabase.from("templates").select("*"),
      ]);

      if (projectRes.data) setProjectTitle(projectRes.data.title);
      if (postsRes.data) setPosts(postsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data as unknown as Template[]);
    };
    fetchData();
  }, [user, projectId]);

  const updateTitle = async () => {
    setEditingTitle(false);
    if (!projectId) return;
    await supabase.from("projects").update({ title: projectTitle }).eq("id", projectId);
  };

  const createPost = async (templateId: string) => {
    if (!user || !projectId) return;
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const canvasData = {
      images: [],
      texts: (template.definition.textAreas || []).map((ta) => ({
        textAreaId: ta.id,
        content: ta.defaultText,
        fontSize: ta.fontSize,
        color: ta.color,
        align: ta.align,
        x: ta.x,
        y: ta.y,
      })),
      background: template.definition.background || "#FFFFFF",
    };

    const { data, error } = await supabase
      .from("posts")
      .insert({
        project_id: projectId,
        user_id: user.id,
        template_id: templateId,
        aspect_ratio: selectedRatio,
        canvas_data: canvasData,
        sort_order: posts.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setShowNewPost(false);
      setStep("ratio");
      navigate(`/project/${projectId}/post/${data.id}`);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.aspect_ratios?.includes(selectedRatio)
  );

  const renderTemplateMini = (def: TemplateDefinition) => (
    <div className="relative w-full h-full bg-secondary rounded-lg overflow-hidden">
      {def.slots.map((slot) => (
        <div
          key={slot.id}
          className="absolute bg-muted flex items-center justify-center"
          style={{
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            width: `${slot.width}%`,
            height: `${slot.height}%`,
          }}
        >
          <ImageIcon className="h-3 w-3 text-muted-foreground" />
        </div>
      ))}
      {def.textAreas?.map((ta) => (
        <div
          key={ta.id}
          className="absolute flex items-center justify-center"
          style={{
            left: `${ta.x}%`,
            top: `${ta.y}%`,
            width: `${ta.width}%`,
            height: `${ta.height}%`,
          }}
        >
          <div className="h-1 w-6 rounded bg-muted-foreground/30" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {editingTitle ? (
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            onBlur={updateTitle}
            onKeyDown={(e) => e.key === "Enter" && updateTitle()}
            autoFocus
            className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
          />
        ) : (
          <h1
            className="text-lg font-semibold font-sans cursor-pointer"
            onClick={() => setEditingTitle(true)}
          >
            {projectTitle}
          </h1>
        )}
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-secondary p-5">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-1">No posts yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Add your first post to this project.</p>
            <Button onClick={() => setShowNewPost(true)} className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Add Post
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {posts.map((post) => {
              const ratioValue = ASPECT_RATIO_CONFIG[post.aspect_ratio as AspectRatio]?.ratio ?? 1;
              return (
                <div
                  key={post.id}
                  className="cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card border border-border"
                  onClick={() => navigate(`/project/${projectId}/post/${post.id}`)}
                  style={{ aspectRatio: ratioValue }}
                >
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {posts.length > 0 && (
        <Button
          onClick={() => setShowNewPost(true)}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={(open) => { setShowNewPost(open); setStep("ratio"); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-sans">
              {step === "ratio" ? "Choose format" : "Pick a template"}
            </DialogTitle>
          </DialogHeader>

          {step === "ratio" ? (
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(ASPECT_RATIO_CONFIG) as [AspectRatio, typeof ASPECT_RATIO_CONFIG["9:16"]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedRatio(key); setStep("template"); }}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-3 hover:border-primary transition-colors"
                  >
                    <div
                      className="rounded-lg bg-secondary"
                      style={{ width: 48, height: 48 / config.ratio }}
                    />
                    <span className="text-xs font-medium">{config.label}</span>
                    <span className="text-[10px] text-muted-foreground">{key}</span>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredTemplates.map((template) => {
                const ratioValue = ASPECT_RATIO_CONFIG[selectedRatio]?.ratio ?? 1;
                return (
                  <button
                    key={template.id}
                    onClick={() => createPost(template.id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-xl border-2 border-border hover:border-primary transition-colors overflow-hidden"
                      style={{ aspectRatio: ratioValue }}
                    >
                      {renderTemplateMini(template.definition)}
                    </div>
                    <span className="text-xs text-muted-foreground">{template.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostsScreen;
