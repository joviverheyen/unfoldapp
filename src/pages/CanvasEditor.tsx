import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AspectRatio as AspectRatioType,
  ASPECT_RATIO_CONFIG,
  TemplateDefinition,
  CanvasData,
  CanvasImageData,
} from "@/types/template";
import { exportCanvasToImage, downloadBlob } from "@/lib/exportCanvas";
import { resizeImage } from "@/lib/resizeImage";
import EditorToolbar from "@/components/EditorToolbar";

type ActiveElement = { type: "text"; id: string } | { type: "image"; id: string } | null;

const CanvasEditor = () => {
  const { projectId, postId } = useParams<{ projectId: string; postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("9:16");
  const [canvasData, setCanvasData] = useState<CanvasData>({ images: [], texts: [], background: "#FFFFFF" });
  const [activeElement, setActiveElement] = useState<ActiveElement>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { w: number; h: number }>>({});
  const [slotSizes, setSlotSizes] = useState<Record<string, { w: number; h: number }>>({});
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Drag-to-pan refs
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragSlotId = useRef<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

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
            fontFamily: "'DM Sans', sans-serif",
            bold: false,
            italic: false,
            underline: false,
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
    if (!postId || !user) return;
    setSaving(true);
    await supabase.from("posts").update({ canvas_data: canvasData as any }).eq("id", postId);
    setSaving(false);

    // Generate and upload thumbnail in background (don't block UI)
    if (template) {
      (async () => {
        try {
          const blob = await exportCanvasToImage(canvasData, template, aspectRatio, 600);
          const thumbPath = `${user.id}/${postId}/thumbnail.png`;
          await supabase.storage.from("post-images").upload(thumbPath, blob, { upsert: true, contentType: "image/png" });
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(thumbPath);
          const thumbnailWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;
          await supabase.from("posts").update({ thumbnail_url: thumbnailWithCacheBust } as any).eq("id", postId);
        } catch {
          // thumbnail generation is best-effort
        }
      })();
    }
  }, [postId, canvasData, user, template, aspectRatio]);

  useEffect(() => {
    const timeout = setTimeout(() => { saveCanvas(); }, 1500);
    return () => clearTimeout(timeout);
  }, [canvasData, saveCanvas]);

  // ResizeObserver to track slot pixel dimensions accurately
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const updates: Record<string, { w: number; h: number }> = {};
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.slotId;
        if (id) {
          updates[id] = { w: entry.contentRect.width, h: entry.contentRect.height };
        }
      }
      if (Object.keys(updates).length > 0) {
        setSlotSizes((prev) => ({ ...prev, ...updates }));
      }
    });
    Object.values(slotRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [template]);

  const handleSlotClick = (slotId: string) => {
    const hasImage = canvasData.images.some((img) => img.slotId === slotId);
    if (hasImage) {
      setActiveElement({ type: "image", id: slotId });
    } else {
      setActiveElement(null);
      triggerFileInput(slotId);
    }
  };

  const pendingSlotRef = useRef<string | null>(null);

  const triggerFileInput = (slotId: string) => {
    pendingSlotRef.current = slotId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotId = pendingSlotRef.current;
    if (!file || !slotId || !user) return;

    const resizedBlob = await resizeImage(file, 2000);
    const path = `${user.id}/${postId}/${slotId}-${Date.now()}`;
    const { error } = await supabase.storage.from("post-images").upload(path, resizedBlob);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);

    setCanvasData((prev) => {
      const existing = prev.images.findIndex((img) => img.slotId === slotId);
      const newImg: CanvasImageData = {
        slotId,
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

    pendingSlotRef.current = null;
    setActiveElement(null);
    e.target.value = "";
  };

  const updateText = (textAreaId: string, content: string) => {
    setCanvasData((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.textAreaId === textAreaId ? { ...t, content } : t)),
    }));
  };

  const handleTextUpdate = (textAreaId: string, updates: Partial<{
    fontSize: number; color: string; align: "left" | "center" | "right";
    fontFamily: string; bold: boolean; italic: boolean; underline: boolean;
  }>) => {
    setCanvasData((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.textAreaId === textAreaId ? { ...t, ...updates } : t)),
    }));
  };

  const handleImageRemove = (slotId: string) => {
    setCanvasData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.slotId !== slotId),
    }));
    setActiveElement(null);
  };

  const handleImageReplace = (slotId: string) => {
    triggerFileInput(slotId);
  };

  const handleImageUpdate = (slotId: string, updates: Partial<CanvasImageData>) => {
    setCanvasData((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.slotId === slotId ? { ...img, ...updates } : img
      ),
    }));
  };

  const handlePointerDown = (e: React.PointerEvent, slotId: string) => {
    const imgData = canvasData.images.find((img) => img.slotId === slotId);
    if (!imgData) return;

    // Double-tap detection: reset zoom and pan
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      handleImageUpdate(slotId, { offsetX: 0, offsetY: 0, scale: 1 });
      lastTapTime.current = 0;
      e.preventDefault();
      return;
    }
    lastTapTime.current = now;

    isDragging.current = true;
    dragSlotId.current = slotId;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { x: imgData.offsetX, y: imgData.offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !dragSlotId.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    handleImageUpdate(dragSlotId.current, {
      offsetX: dragStartOffset.current.x + dx,
      offsetY: dragStartOffset.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragSlotId.current = null;
  };

  const handleBackgroundChange = (color: string) => {
    setCanvasData((prev) => ({ ...prev, background: color }));
  };

  const handleExport = async () => {
    if (!template) return;
    setExporting(true);
    try {
      const blob = await exportCanvasToImage(canvasData, template, aspectRatio);
      downloadBlob(blob, `post-${postId?.slice(0, 8)}.png`);
      toast({ title: "Exported!", description: "Image downloaded successfully." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
    setExporting(false);
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
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4" onClick={() => setActiveElement(null)}>
        <div
          className="relative bg-card shadow-xl rounded-xl overflow-hidden border border-border"
          style={{
            width: "100%",
            maxWidth: 360,
            aspectRatio: ratioConfig.ratio,
            backgroundColor: canvasData.background,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image slots */}
          {template?.slots.map((slot) => {
            const imgData = canvasData.images.find((img) => img.slotId === slot.id);
            const isActive = activeElement?.type === "image" && activeElement.id === slot.id;
            return (
              <div
                key={slot.id}
                ref={(el) => { slotRefs.current[slot.id] = el; }}
                data-slot-id={slot.id}
                className={`absolute cursor-pointer overflow-hidden transition-all ${isActive ? "ring-2 ring-primary" : ""}`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  touchAction: imgData && isActive ? "none" : undefined,
                }}
                onClick={(e) => { e.stopPropagation(); handleSlotClick(slot.id); }}
                onPointerDown={imgData && isActive ? (e) => { e.stopPropagation(); handlePointerDown(e, slot.id); } : undefined}
                onPointerMove={imgData && isActive ? handlePointerMove : undefined}
                onPointerUp={imgData && isActive ? handlePointerUp : undefined}
              >
                {imgData ? (() => {
                  const dims = imageDimensions[slot.id];
                  const slotSize = slotSizes[slot.id];
                  let imgStyle: React.CSSProperties;

                  if (dims && slotSize && slotSize.w > 0 && slotSize.h > 0) {
                    const imgRatio = dims.w / dims.h;
                    const slotRatio = slotSize.w / slotSize.h;
                    let coverW: number, coverH: number;
                    if (imgRatio > slotRatio) {
                      coverH = slotSize.h;
                      coverW = coverH * imgRatio;
                    } else {
                      coverW = slotSize.w;
                      coverH = coverW / imgRatio;
                    }
                    imgStyle = {
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: coverW,
                      height: coverH,
                      transform: `translate(-50%, -50%) translate(${imgData.offsetX}px, ${imgData.offsetY}px) scale(${imgData.scale})`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                    };
                  } else {
                    imgStyle = {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover' as const,
                      pointerEvents: 'none',
                    };
                  }

                  return (
                    <img
                      src={imgData.imageUrl}
                      alt=""
                      style={imgStyle}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setImageDimensions((prev) => ({
                          ...prev,
                          [slot.id]: { w: img.naturalWidth, h: img.naturalHeight },
                        }));
                      }}
                    />
                  );
                })() : (
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
            const isActive = activeElement?.type === "text" && activeElement.id === ta.id;
            return (
              <div
                key={ta.id}
                className={`absolute transition-all ${isActive ? "ring-2 ring-primary rounded" : ""}`}
                style={{
                  left: `${ta.x}%`,
                  top: `${ta.y}%`,
                  width: `${ta.width}%`,
                  height: `${ta.height}%`,
                }}
              >
                <textarea
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 rounded p-1"
                  style={{
                    fontSize: textData?.fontSize ?? ta.fontSize,
                    color: textData?.color ?? ta.color,
                    textAlign: (textData?.align ?? ta.align) as any,
                    fontFamily: textData?.fontFamily ?? "'DM Sans', sans-serif",
                    fontWeight: textData?.bold ? "bold" : "normal",
                    fontStyle: textData?.italic ? "italic" : "normal",
                    textDecoration: textData?.underline ? "underline" : "none",
                  }}
                  value={textData?.content ?? ta.defaultText}
                  onChange={(e) => updateText(ta.id, e.target.value)}
                  onFocus={() => setActiveElement({ type: "text", id: ta.id })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        canvasData={canvasData}
        activeElement={activeElement}
        onBackgroundChange={handleBackgroundChange}
        onTextUpdate={handleTextUpdate}
        onImageReplace={handleImageReplace}
        onImageRemove={handleImageRemove}
        onImageUpdate={handleImageUpdate}
      />

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
