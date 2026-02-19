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
            className="absolute overflow-hidden"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
          >
            {imgData ? (
              <img
                src={imgData.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                style={{
                  transform: `translate(${imgData.offsetX}px, ${imgData.offsetY}px) scale(${imgData.scale})`,
                }}
              />
            ) : (
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
