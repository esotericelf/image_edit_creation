export type EditorMode = "create" | "edit";

export type Resolution = "0.5K" | "1K" | "2K" | "4K";

export type SafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export type CanvasTool =
  | "pointer"
  | "brush"
  | "eraser"
  | "marquee"
  | "undo"
  | "clear";

export interface CanvasElement {
  id: string;
  label: string;
  highlighted?: boolean;
}

export interface GenerationRecord {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
}

export type ChatRole = "user" | "model";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

export interface GenerateRequestPayload {
  prompt: string;
  mode: EditorMode;
  resolution: Resolution;
  safety_tolerance: SafetyTolerance;
  image_urls?: string[];
  parent_image_url?: string;
  gift_token?: string;
  is_admin?: boolean;
  num_images?: number;
  output_format?: "png" | "jpeg" | "webp";
  aspect_ratio?: string;
}

export interface ImageOutput {
  content_type: string;
  url: string;
  file_name: string;
}

export interface GenerateResponse {
  images: ImageOutput[];
  description: string;
}

export interface ApiErrorDetail {
  error?: string;
  message?: string;
  field?: string;
}

export interface GiftTokenCreateResponse {
  token: string;
  invite_path: string;
  expires_at: string;
  created_at: string;
}

export interface GiftTokenStatusResponse {
  token: string;
  valid: boolean;
  is_used: boolean;
  expires_at: string;
  message: string;
}

export const RESOLUTIONS: Resolution[] = ["0.5K", "1K", "2K", "4K"];

export const SAFETY_LEVELS: SafetyTolerance[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
];

export const QUICK_EDIT_SUGGESTIONS = [
  "Make it a deep blue",
  "Add more vines",
  "Increase contrast",
  "Soften the lighting",
  "Remove background clutter",
] as const;

export function deriveElementsFromPrompt(prompt: string): CanvasElement[] {
  const trimmed = prompt.trim();
  const baseLabel = trimmed
    ? trimmed.length > 28
      ? `${trimmed.slice(0, 28)}…`
      : trimmed
    : "Untitled Scene";

  return [
    { id: "base", label: `${baseLabel} (Base)` },
    { id: "elem-1", label: "Neon Flower 1 (Highlighted)", highlighted: true },
    { id: "elem-2", label: "Neon Flower 2" },
  ];
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
