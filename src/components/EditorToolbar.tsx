import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlignLeft, AlignCenter, AlignRight, Replace, Trash2, Palette, Bold, Italic, Underline, ZoomIn } from "lucide-react";
import { CanvasData, CanvasImageData } from "@/types/template";

const PRESET_COLORS = [
"#FFFFFF", "#F5F0EB", "#FFF8E7", "#E8D5C4",
"#2C2C2C", "#1A1A2E", "#4A3728", "#6B4F3A",
"#D4A373", "#E76F51", "#264653", "#2A9D8F"];


const TEXT_COLORS = ["#000000", "#FFFFFF", "#4A3728", "#E76F51", "#264653", "#2A9D8F"];

const FONTS = [
{ name: "Montserrat", family: "'Montserrat', sans-serif" },
{ name: "Amiri", family: "'Amiri', serif" },
{ name: "Playfair", family: "'Playfair Display', serif" },
{ name: "Northwell", family: "'Dancing Script', cursive" },
{ name: "Bebas", family: "'Bebas Neue', sans-serif" },
{ name: "Rustico", family: "'Permanent Marker', cursive" },
{ name: "Canela", family: "'Cormorant Garamond', serif" },
{ name: "Cinzel", family: "'Cinzel', serif" },
{ name: "Forum", family: "'Forum', serif" }];


interface EditorToolbarProps {
  canvasData: CanvasData;
  activeElement: {type: "text";id: string;} | {type: "image";id: string;} | null;
  onBackgroundChange: (color: string) => void;
  onTextUpdate: (textAreaId: string, updates: Partial<{
    fontSize: number;
    color: string;
    align: "left" | "center" | "right";
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  }>) => void;
  onImageReplace: (slotId: string) => void;
  onImageRemove: (slotId: string) => void;
  onImageUpdate: (slotId: string, updates: Partial<CanvasImageData>) => void;
}

const EditorToolbar = ({
  canvasData,
  activeElement,
  onBackgroundChange,
  onTextUpdate,
  onImageReplace,
  onImageRemove,
  onImageUpdate
}: EditorToolbarProps) => {
  const activeText = activeElement?.type === "text" ?
  canvasData.texts.find((t) => t.textAreaId === activeElement.id) :
  null;

  const activeImage = activeElement?.type === "image" ?
  canvasData.images.find((i) => i.slotId === activeElement.id) :
  null;

  return (
    <div className="border-t border-border bg-card px-4 py-3 space-y-3">
      {/* Text controls */}
      {activeText &&
      <div className="space-y-3">
          {/* Font size slider */}
          <div className="flex items-center gap-2">
            <Slider
            value={[activeText.fontSize]}
            min={8}
            max={64}
            step={1}
            onValueChange={([v]) => onTextUpdate(activeText.textAreaId, { fontSize: v })}
            className="flex-1" />

            <span className="text-xs text-muted-foreground w-6 text-right">{activeText.fontSize}</span>
          </div>

          {/* Color + Align + B/I/U row */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-1 flex-wrap">
              {TEXT_COLORS.map((c) =>
            <button
              key={c}
              className={`h-7 w-7 rounded-full border-2 transition-all ${activeText.color === c ? "border-primary scale-110" : "border-border"}`}
              style={{ backgroundColor: c }}
              onClick={() => onTextUpdate(activeText.textAreaId, { color: c })} />

            )}
              <label className="h-7 w-7 rounded-full border-2 border-border overflow-hidden cursor-pointer relative">
                <Palette className="h-3 w-3 absolute inset-0 m-auto text-muted-foreground" />
                <input
                type="color"
                value={activeText.color}
                onChange={(e) => onTextUpdate(activeText.textAreaId, { color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer" />

              </label>
            </div>

            <div className="flex gap-1">
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(
              ([align, Icon]) =>
              <Button
                key={align}
                variant={activeText.align === align ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onTextUpdate(activeText.textAreaId, { align })}>

                    <Icon className="h-4 w-4" />
                  </Button>

            )}
            </div>

            <div className="flex gap-1">
              <Button
              variant={activeText.bold ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 font-bold"
              onClick={() => onTextUpdate(activeText.textAreaId, { bold: !activeText.bold })}>

                <Bold className="h-4 w-4" />
              </Button>
              <Button
              variant={activeText.italic ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onTextUpdate(activeText.textAreaId, { italic: !activeText.italic })}>

                <Italic className="h-4 w-4" />
              </Button>
              <Button
              variant={activeText.underline ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onTextUpdate(activeText.textAreaId, { underline: !activeText.underline })}>

                <Underline className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Font picker grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {FONTS.map((font) => {
            const isSelected = activeText.fontFamily === font.family;
            return (
              <button
                key={font.name}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                isSelected ?
                "bg-foreground text-background" :
                "bg-secondary text-foreground hover:bg-accent"}`
                }
                style={{ fontFamily: font.family }}
                onClick={() => onTextUpdate(activeText.textAreaId, { fontFamily: font.family })}>

                  {font.name}
                </button>);

          })}
          </div>
        </div>
      }

      {/* Image slot controls */}
      {activeImage && activeElement?.type === "image" &&
      <div className="space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[activeImage.scale]}
              min={0.5}
              max={3}
              step={0.05}
              onValueChange={([v]) => onImageUpdate(activeElement.id, { scale: v })}
              className="flex-1" />
            <span className="text-xs text-muted-foreground w-8 text-right">{activeImage.scale.toFixed(1)}x</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onImageReplace(activeElement.id)}>
              <Replace className="h-4 w-4" /> Replace
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive" onClick={() => onImageRemove(activeElement.id)}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      }

      {/* Background color — only when nothing selected */}
      {!activeElement &&
      <div className="space-y-1.5">
          <div className="gap-1.5 flex-wrap flex items-start justify-center">
            {PRESET_COLORS.map((c) =>
          <button
            key={c}
            className={`h-7 w-7 rounded-full border-2 transition-all ${canvasData.background === c ? "border-primary scale-110" : "border-border"}`}
            style={{ backgroundColor: c }}
            onClick={() => onBackgroundChange(c)} />

          )}
            <label className="h-7 w-7 rounded-full border-2 border-border overflow-hidden cursor-pointer relative">
              <Palette className="h-3 w-3 absolute inset-0 m-auto text-muted-foreground" />
              <input
              type="color"
              value={canvasData.background}
              onChange={(e) => onBackgroundChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer" />

            </label>
          </div>
        </div>
      }
    </div>);

};

export default EditorToolbar;