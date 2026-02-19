import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlignLeft, AlignCenter, AlignRight, Replace, Trash2, Palette } from "lucide-react";
import { CanvasData } from "@/types/template";

const PRESET_COLORS = [
  "#FFFFFF", "#F5F0EB", "#FFF8E7", "#E8D5C4",
  "#2C2C2C", "#1A1A2E", "#4A3728", "#6B4F3A",
  "#D4A373", "#E76F51", "#264653", "#2A9D8F",
];

interface EditorToolbarProps {
  canvasData: CanvasData;
  activeElement: { type: "text"; id: string } | { type: "image"; id: string } | null;
  onBackgroundChange: (color: string) => void;
  onTextUpdate: (textAreaId: string, updates: Partial<{ fontSize: number; color: string; align: "left" | "center" | "right" }>) => void;
  onImageReplace: (slotId: string) => void;
  onImageRemove: (slotId: string) => void;
}

const EditorToolbar = ({
  canvasData,
  activeElement,
  onBackgroundChange,
  onTextUpdate,
  onImageReplace,
  onImageRemove,
}: EditorToolbarProps) => {
  const activeText = activeElement?.type === "text"
    ? canvasData.texts.find((t) => t.textAreaId === activeElement.id)
    : null;

  const activeImage = activeElement?.type === "image"
    ? canvasData.images.find((i) => i.slotId === activeElement.id)
    : null;

  return (
    <div className="border-t border-border bg-card px-4 py-3 space-y-3">
      {/* Text controls */}
      {activeText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">Size</span>
            <Slider
              value={[activeText.fontSize]}
              min={8}
              max={64}
              step={1}
              onValueChange={([v]) => onTextUpdate(activeText.textAreaId, { fontSize: v })}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">{activeText.fontSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">Color</span>
            <div className="flex gap-1.5 flex-wrap flex-1">
              {["#000000", "#FFFFFF", "#4A3728", "#E76F51", "#264653", "#2A9D8F"].map((c) => (
                <button
                  key={c}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${activeText.color === c ? "border-primary scale-110" : "border-border"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onTextUpdate(activeText.textAreaId, { color: c })}
                />
              ))}
              <label className="h-7 w-7 rounded-full border-2 border-border overflow-hidden cursor-pointer relative">
                <Palette className="h-3 w-3 absolute inset-0 m-auto text-muted-foreground" />
                <input
                  type="color"
                  value={activeText.color}
                  onChange={(e) => onTextUpdate(activeText.textAreaId, { color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">Align</span>
            <div className="flex gap-1">
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(
                ([align, Icon]) => (
                  <Button
                    key={align}
                    variant={activeText.align === align ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onTextUpdate(activeText.textAreaId, { align })}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image slot controls */}
      {activeImage && activeElement?.type === "image" && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onImageReplace(activeElement.id)}>
            <Replace className="h-4 w-4" /> Replace
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive" onClick={() => onImageRemove(activeElement.id)}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        </div>
      )}

      {/* Background color (always shown) */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Background</span>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`h-7 w-7 rounded-full border-2 transition-all ${canvasData.background === c ? "border-primary scale-110" : "border-border"}`}
              style={{ backgroundColor: c }}
              onClick={() => onBackgroundChange(c)}
            />
          ))}
          <label className="h-7 w-7 rounded-full border-2 border-border overflow-hidden cursor-pointer relative">
            <Palette className="h-3 w-3 absolute inset-0 m-auto text-muted-foreground" />
            <input
              type="color"
              value={canvasData.background}
              onChange={(e) => onBackgroundChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
