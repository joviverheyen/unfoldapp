import {
  CanvasData,
  TemplateDefinition,
  AspectRatio,
  ASPECT_RATIO_CONFIG,
} from "@/types/template";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function exportCanvasToImage(
  canvasData: CanvasData,
  template: TemplateDefinition,
  aspectRatio: AspectRatio,
  outputWidth?: number,
): Promise<Blob> {
  const config = ASPECT_RATIO_CONFIG[aspectRatio];
  const width = outputWidth ?? config.exportWidth;
  const height = Math.round(width / config.ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = canvasData.background || "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Draw image slots
  for (const slot of template.slots) {
    const imgData = canvasData.images.find((i) => i.slotId === slot.id);
    if (!imgData) continue;

    const sx = (slot.x / 100) * width;
    const sy = (slot.y / 100) * height;
    const sw = (slot.width / 100) * width;
    const sh = (slot.height / 100) * height;

    try {
      const img = await loadImage(imgData.imageUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();

      // object-contain logic (preserve full image by default)
      const imgRatio = img.width / img.height;
      const slotRatio = sw / sh;
      let dw: number, dh: number;
      if (imgRatio > slotRatio) {
        dw = sw * imgData.scale;
        dh = dw / imgRatio;
      } else {
        dh = sh * imgData.scale;
        dw = dh * imgRatio;
      }
      const dx = sx + (sw - dw) / 2 + imgData.offsetX * (width / 360);
      const dy = sy + (sh - dh) / 2 + imgData.offsetY * (height / (360 / config.ratio));

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } catch {
      // skip failed images
    }
  }

  // Draw text areas
  for (const ta of template.textAreas || []) {
    const textData = canvasData.texts.find((t) => t.textAreaId === ta.id);
    const content = textData?.content ?? ta.defaultText;
    if (!content) continue;

    const tx = (ta.x / 100) * width;
    const ty = (ta.y / 100) * height;
    const tw = (ta.width / 100) * width;

    const fontSize = ((textData?.fontSize ?? ta.fontSize) * width) / 360;
    const fontFamily = textData?.fontFamily ?? "'DM Sans', sans-serif";
    const bold = textData?.bold ? "bold " : "";
    const italic = textData?.italic ? "italic " : "";
    ctx.font = `${italic}${bold}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textData?.color ?? ta.color;
    ctx.textAlign = (textData?.align ?? ta.align) as CanvasTextAlign;
    ctx.textBaseline = "top";

    const alignX =
      ctx.textAlign === "center"
        ? tx + tw / 2
        : ctx.textAlign === "right"
          ? tx + tw
          : tx;

    const lines = content.split("\n");
    const isUnderline = textData?.underline ?? false;
    lines.forEach((line, i) => {
      const lineY = ty + i * fontSize * 1.3;
      ctx.fillText(line, alignX, lineY);
      if (isUnderline) {
        const metrics = ctx.measureText(line);
        let lineStartX = alignX;
        if (ctx.textAlign === "center") lineStartX = alignX - metrics.width / 2;
        else if (ctx.textAlign === "right") lineStartX = alignX - metrics.width;
        ctx.fillRect(lineStartX, lineY + fontSize * 1.05, metrics.width, Math.max(1, fontSize * 0.05));
      }
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export"))),
      "image/png",
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
