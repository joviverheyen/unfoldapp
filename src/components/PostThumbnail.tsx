import { useState, useRef } from "react";
import { CanvasData, TemplateDefinition, AspectRatio, ASPECT_RATIO_CONFIG } from "@/types/template";
import { ImageIcon } from "lucide-react";

interface PostThumbnailProps {
  canvasData: CanvasData;
  template: TemplateDefinition | null;
  aspectRatio: AspectRatio;
  className?: string;
}

const PostThumbnail = ({ canvasData, template, aspectRatio, className = "" }: PostThumbnailProps) => {
  const ratioValue = ASPECT_RATIO_CONFIG[aspectRatio]?.ratio ?? 1;
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio: ratioValue, backgroundColor: canvasData.background || "#FFFFFF" }}
    >
      {/* Image slots */}
      {template?.slots.map((slot) => {
        const imgData = canvasData.images.find((i) => i.slotId === slot.id);
        return (
          <div
            key={slot.id}
            ref={(el) => { slotRefs.current[slot.id] = el; }}
            className="absolute overflow-hidden"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
          >
            {imgData ? (() => {
              const d = dims[slot.id];
              const slotEl = slotRefs.current[slot.id];
              let imgStyle: React.CSSProperties;

              if (d && slotEl) {
                const slotW = slotEl.offsetWidth;
                const slotH = slotEl.offsetHeight;
                const imgRatio = d.w / d.h;
                const slotRatio = slotW / slotH;
                let coverW: number, coverH: number;
                if (imgRatio > slotRatio) {
                  coverH = slotH;
                  coverW = coverH * imgRatio;
                } else {
                  coverW = slotW;
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
                };
              } else {
                imgStyle = {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover' as const,
                };
              }

              return (
                <img
                  src={imgData.imageUrl}
                  alt=""
                  loading="lazy"
                  style={imgStyle}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setDims((prev) => ({
                      ...prev,
                      [slot.id]: { w: img.naturalWidth, h: img.naturalHeight },
                    }));
                  }}
                />
              );
            })() : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <ImageIcon className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
          </div>
        );
      })}

      {/* Text areas (truncated) */}
      {template?.textAreas?.map((ta) => {
        const textData = canvasData.texts.find((t) => t.textAreaId === ta.id);
        const content = textData?.content ?? ta.defaultText;
        return (
          <div
            key={ta.id}
            className="absolute overflow-hidden pointer-events-none"
            style={{
              left: `${ta.x}%`,
              top: `${ta.y}%`,
              width: `${ta.width}%`,
              height: `${ta.height}%`,
              fontSize: `${(textData?.fontSize ?? ta.fontSize) * 0.3}px`,
              color: textData?.color ?? ta.color,
              textAlign: (textData?.align ?? ta.align) as any,
              lineHeight: 1.2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default PostThumbnail;
