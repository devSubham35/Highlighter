export type AnnotationTool = "rectangle" | "arrow" | "highlight";

type Annotation = {
  tool: AnnotationTool;
  x: number;
  y: number;
  width: number;
  height: number;
  endX: number;
  endY: number;
  color: string;
};

export class AnnotationCanvas {
  private ctx: CanvasRenderingContext2D;
  private annotations: Annotation[] = [];
  private currentTool: AnnotationTool = "rectangle";
  private color = "#dc2626";
  private image: HTMLImageElement | null = null;
  private drawing = false;
  private startX = 0;
  private startY = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.ctx = ctx;
    this.bind();
  }

  setImage(image: HTMLImageElement) {
    this.image = image;
    this.redraw();
  }

  setTool(tool: AnnotationTool) {
    this.currentTool = tool;
  }

  undo() {
    this.annotations.pop();
    this.redraw();
  }

  toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/png");
    });
  }

  private bind() {
    this.canvas.addEventListener("mousedown", (event) => {
      const point = this.point(event);
      this.startX = point.x;
      this.startY = point.y;
      this.drawing = true;
    });
    this.canvas.addEventListener("mousemove", (event) => {
      if (!this.drawing) return;
      const point = this.point(event);
      this.redraw();
      this.draw(this.makeAnnotation(point.x, point.y));
    });
    this.canvas.addEventListener("mouseup", (event) => {
      if (!this.drawing) return;
      this.drawing = false;
      const point = this.point(event);
      const annotation = this.makeAnnotation(point.x, point.y);
      if (Math.abs(annotation.width) > 4 || Math.abs(annotation.height) > 4) {
        this.annotations.push(annotation);
      }
      this.redraw();
    });
  }

  private point(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  private makeAnnotation(x: number, y: number): Annotation {
    return {
      tool: this.currentTool,
      x: this.startX,
      y: this.startY,
      width: x - this.startX,
      height: y - this.startY,
      endX: x,
      endY: y,
      color: this.color,
    };
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.image) this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.annotations.forEach((annotation) => this.draw(annotation));
  }

  private draw(annotation: Annotation) {
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = annotation.color;
    if (annotation.tool === "highlight") {
      this.ctx.fillStyle = "rgba(250, 204, 21, .35)";
      this.ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
      return;
    }
    if (annotation.tool === "rectangle") {
      this.ctx.fillStyle = "rgba(220, 38, 38, .12)";
      this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      return;
    }
    const angle = Math.atan2(annotation.endY - annotation.y, annotation.endX - annotation.x);
    this.ctx.beginPath();
    this.ctx.moveTo(annotation.x, annotation.y);
    this.ctx.lineTo(annotation.endX, annotation.endY);
    this.ctx.lineTo(annotation.endX - 14 * Math.cos(angle - Math.PI / 6), annotation.endY - 14 * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(annotation.endX, annotation.endY);
    this.ctx.lineTo(annotation.endX - 14 * Math.cos(angle + Math.PI / 6), annotation.endY - 14 * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }
}
