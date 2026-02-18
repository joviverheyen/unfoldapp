import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ImageIcon, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AspectRatio as AspectRatioType,
  ASPECT_RATIO_CONFIG,
  TemplateDefinition,
  CanvasData,
  CanvasImageData,
} from "@/types/template";

const CanvasEditor = () => {
  const { projectId, postId } = useParams<{ projectId: string; postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("9:16");
  const [canvasData, setCanvasData] = useState<CanvasData>({ images: [], texts: [], background: "#FFFFFF" });
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !postId) return;
    const fetchPost = async () => {
      const { data: post } = await supabase
        .from("posts")
        .select("*, templates(*)")
        .eq("id", postId)
        .single();
      if (!post) return;

      setAspectRatio(post.aspect_ratio as AspectRatioType);
      const tmpl = (post as any).templates;
      if (tmpl) setTemplate(tmpl.definition as TemplateDefinition);

      const cd = post.canvas_data as any;
      if (cd && cd.images) {
        setCanvasData(cd as CanvasData);
      } else {
        const def = tmpl?.definition as TemplateDefinition | undefined;
        setCanvasData({
          images: [],
          texts: (def?.textAreas || []).map((ta) => ({
            textAreaId: ta.id,
            content: ta.defaultText,
            fontSize: ta.fontSize,
            color: ta.color,
            align: ta.align as "left" | "center" | "right",
            x: ta.x,
            y: ta.y,
          })),
          background: def?.background || "#FFFFFF",
        });
      }
    };
    fetchPost();
  }, [user, postId]);

  const saveCanvas = useCallback(async () => {
    if (!postId) return;
    setSaving(true);
    await supabase.from("posts").update({ canvas_data: canvasData as any }).eq("id", postId);
    setSaving(false);
  }, [postId, canvasData]);

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(() => { saveCanvas(); }, 1500);
    return () => clearTimeout(timeout);
  }, [canvasData, saveCanvas]);

  const handleSlotClick = (slotId: string) => {
    setActiveSlotId(slotId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlotId || !user) return;

    const path = `${user.id}/${postId}/${activeSlotId}-${Date.now()}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);

    setCanvasData((prev) => {
      const existing = prev.images.findIndex((img) => img.slotId === activeSlotId);
      const newImg: CanvasImageData = {
        slotId: activeSlotId,
        imageUrl: urlData.publicUrl,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
      };
      const images = [...prev.images];
      if (existing >= 0) images[existing] = newImg;
      else images.push(newImg);
      return { ...prev, images };
    });

    setActiveSlotId(null);
    e.target.value = "";
  };

  const updateText = (textAreaId: string, content: string) => {
    setCanvasData((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.textAreaId === textAreaId ? { ...t, content } : t)),
    }));
  };

  const ratioConfig = ASPECT_RATIO_CONFIG[aspectRatio];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${projectId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <span className="text-xs text-muted-foreground self-center">
            {saving ? "Saving..." : "Saved"}
          </span>
          <Button variant="outline" size="sm" className="rounded-xl gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={canvasContainerRef}
          className="relative bg-card shadow-xl rounded-xl overflow-hidden border border-border"
          style={{
            width: "100%",
            maxWidth: 360,
            aspectRatio: ratioConfig.ratio,
            backgroundColor: canvasData.background,
          }}
        >
          {/* Image slots */}
          {template?.slots.map((slot) => {
            const imgData = canvasData.images.find((img) => img.slotId === slot.id);
            return (
              <div
                key={slot.id}
                className="absolute cursor-pointer overflow-hidden"
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                }}
                onClick={() => handleSlotClick(slot.id)}
              >
                {imgData ? (
                  <img
                    src={imgData.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${imgData.offsetX}px, ${imgData.offsetY}px) scale(${imgData.scale})`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Text areas */}
          {template?.textAreas?.map((ta) => {
            const textData = canvasData.texts.find((t) => t.textAreaId === ta.id);
            return (
              <div
                key={ta.id}
                className="absolute"
                style={{
                  left: `${ta.x}%`,
                  top: `${ta.y}%`,
                  width: `${ta.width}%`,
                  height: `${ta.height}%`,
                }}
              >
                <textarea
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 rounded p-1"
                  style={{
                    fontSize: textData?.fontSize ?? ta.fontSize,
                    color: textData?.color ?? ta.color,
                    textAlign: (textData?.align ?? ta.align) as any,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  value={textData?.content ?? ta.defaultText}
                  onChange={(e) => updateText(ta.id, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default CanvasEditor;
