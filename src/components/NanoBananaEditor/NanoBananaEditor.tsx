import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Brush,
  ChevronDown,
  Eraser,
  ImagePlus,
  Loader2,
  MessageSquare,
  MousePointer2,
  RotateCcw,
  Send,
  Sparkles,
  SquareDashedMousePointer,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { generateImage, GenerateApiError } from "./api";
import {
  APP_NAME,
  APP_TAGLINE,
  CREATOR_STUDIO_LABEL,
  GENERATING_MESSAGE,
  GIFT_MORE_IMAGES_MESSAGE,
  GIFT_OWNER_WHATSAPP,
  GIFT_OWNER_WHATSAPP_URL,
  GIFT_WORKSPACE_LABEL,
  PANEL_TITLE,
} from "../../config/branding";
import {
  deriveElementsFromPrompt,
  fileToDataUrl,
  QUICK_EDIT_SUGGESTIONS,
  RESOLUTIONS,
  type CanvasElement,
  type CanvasTool,
  type ChatMessage,
  type EditorMode,
  type GenerationRecord,
  type Resolution,
  type SafetyTolerance,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Shared UI primitives                                                       */
/* -------------------------------------------------------------------------- */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

function Panel({
  title,
  children,
  className,
  hideHeader = false,
}: PanelProps) {
  return (
    <aside
      className={cn(
        "grid h-full max-h-full min-h-0 overflow-hidden border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm",
        hideHeader ? "grid-rows-[minmax(0,1fr)]" : "grid-rows-[auto_minmax(0,1fr)]",
        className,
      )}
    >
      {!hideHeader && (
        <header className="border-b border-zinc-800/80 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            {title}
          </h2>
        </header>
      )}
      <div className="min-h-0 overflow-hidden">{children}</div>
    </aside>
  );
}

type MobileView = "controls" | "workspace" | "history";

interface MobileTabBarProps {
  active: MobileView;
  onChange: (view: MobileView) => void;
}

function MobileTabBar({ active, onChange }: MobileTabBarProps) {
  const tabs: Array<{ id: MobileView; label: string }> = [
    { id: "controls", label: "Create / Edit" },
    { id: "workspace", label: "Workspace" },
    { id: "history", label: "History" },
  ];

  return (
    <nav
      className="sticky top-0 z-30 shrink-0 border-b border-zinc-800/80 bg-zinc-950/95 px-2 py-2 backdrop-blur-md md:hidden"
      aria-label="Editor sections"
    >
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "min-h-11 rounded-lg px-2 py-2 text-[11px] font-semibold uppercase leading-tight tracking-wide transition-all sm:text-xs",
              active === id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mode toggle                                                                */
/* -------------------------------------------------------------------------- */

interface ModeToggleProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
      {(
        [
          { id: "create" as const, label: "Create New" },
          { id: "edit" as const, label: "Edit Image" },
        ] as const
      ).map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "min-h-11 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all sm:text-sm",
            mode === id
              ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
              : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Control panel (left sidebar)                                               */
/* -------------------------------------------------------------------------- */

interface ControlPanelProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  hideModeToggle?: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  baseImagePreview: string | null;
  onBaseImageChange: (file: File | null, previewUrl: string | null) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
  safetyTolerance: SafetyTolerance;
  onSafetyToleranceChange: (value: SafetyTolerance) => void;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}

function ControlPanel({
  mode,
  onModeChange,
  hideModeToggle = false,
  prompt,
  onPromptChange,
  baseImagePreview,
  onBaseImageChange,
  resolution,
  onResolutionChange,
  safetyTolerance,
  onSafetyToleranceChange,
  isGenerating,
  error,
  onGenerate,
}: ControlPanelProps) {
  const promptId = useId();
  const uploadId = useId();
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      const dataUrl = await fileToDataUrl(file);
      onBaseImageChange(file, dataUrl);
    },
    [onBaseImageChange],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void handleFile(event.dataTransfer.files[0] ?? null);
    },
    [handleFile],
  );

  const onFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleFile(event.target.files?.[0] ?? null);
      event.target.value = "";
    },
    [handleFile],
  );

  const requiresBaseImage = mode === "edit" && !baseImagePreview;
  const canSubmit =
    prompt.trim().length > 0 && !isGenerating && !requiresBaseImage;

  return (
    <Panel
      title={PANEL_TITLE}
      className="h-full w-full border-0 md:w-80 md:border-r xl:w-96"
    >
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-6">
        {!hideModeToggle && <ModeToggle mode={mode} onChange={onModeChange} />}

        <div className="space-y-2">
          <label
            htmlFor={promptId}
            className="block text-xs font-medium uppercase tracking-wide text-zinc-400"
          >
            Main Text Prompt
          </label>
          <textarea
            id={promptId}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            placeholder="A lush garden with neon flowers…"
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-3 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none ring-violet-500/0 transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 md:text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Base Image
            </span>
            {mode === "edit" ? (
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                Required
              </span>
            ) : (
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Optional Reference Style
              </span>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex min-h-[11rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all sm:min-h-[140px]",
              mode === "edit"
                ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-400/60"
                : "border-zinc-700/80 bg-zinc-900/30 opacity-90 hover:border-zinc-600 hover:opacity-100",
              isDragging && "border-violet-400 bg-violet-500/10 opacity-100",
              baseImagePreview && "min-h-[100px] border-solid border-zinc-700 opacity-100",
            )}
          >
            <input
              ref={fileInputRef}
              id={uploadId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFileInput}
            />

            {baseImagePreview ? (
              <div className="relative w-full">
                <img
                  src={baseImagePreview}
                  alt="Base upload preview"
                  className="mx-auto max-h-36 w-full rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBaseImageChange(null, null);
                  }}
                  className="absolute -right-1 -top-1 rounded-full border border-zinc-700 bg-zinc-900 p-1 text-zinc-400 hover:text-zinc-100"
                  aria-label="Remove base image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-full border border-zinc-700 bg-zinc-800/80 p-3 text-zinc-400 group-hover:text-violet-300">
                  <Upload className="h-5 w-5" strokeWidth={1.75} />
                </div>
              <p className="text-sm font-medium text-zinc-300">
                {mode === "create"
                  ? "Optional — drop a reference style image"
                  : "Drop image or click to upload"}
              </p>
              <p className="text-xs text-zinc-500">
                {mode === "create"
                  ? "Text-only generation works without an upload"
                  : "Required for image editing (PNG, JPG, WEBP)"}
              </p>
              </>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setAccordionOpen((open) => !open)}
            className="flex w-full min-h-11 items-center justify-between px-4 py-3.5 text-left text-base font-medium text-zinc-200 hover:bg-zinc-900/60 md:text-sm"
          >
            Advanced Options
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-500 transition-transform",
                accordionOpen && "rotate-180",
              )}
            />
          </button>

          {accordionOpen && (
            <div className="space-y-5 border-t border-zinc-800 px-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide text-zinc-400">
                    Resolution
                  </span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-violet-300">
                    {resolution}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={RESOLUTIONS.length - 1}
                  step={1}
                  value={RESOLUTIONS.indexOf(resolution)}
                  onChange={(e) =>
                    onResolutionChange(RESOLUTIONS[Number(e.target.value)]!)
                  }
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-violet-500 md:h-1.5"
                />
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  {RESOLUTIONS.map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide text-zinc-400">
                    Safety Tolerance
                  </span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-emerald-300">
                    {safetyTolerance}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={Number(safetyTolerance)}
                  onChange={(e) =>
                    onSafetyToleranceChange(String(e.target.value) as SafetyTolerance)
                  }
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500 md:h-1.5"
                />
                <div className="flex justify-between text-[10px] font-medium text-zinc-600">
                  <span>Strict</span>
                  <span>Permissive</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-300"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onGenerate}
          className={cn(
            "mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold transition-all md:text-sm",
            canSubmit
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/50 hover:from-violet-500 hover:to-fuchsia-500"
              : "cursor-not-allowed bg-zinc-800 text-zinc-500",
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {mode === "create" ? "Generate Image" : "Edit Image"}
            </>
          )}
        </button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Canvas workspace                                                           */
/* -------------------------------------------------------------------------- */

interface FloatingToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onUndo: () => void;
  onClear: () => void;
}

const TOOLBAR_ITEMS: Array<{
  id: CanvasTool;
  icon: typeof MousePointer2;
  label: string;
  action?: "undo" | "clear";
}> = [
  { id: "pointer", icon: MousePointer2, label: "Select" },
  { id: "brush", icon: Brush, label: "Brush" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "marquee", icon: SquareDashedMousePointer, label: "Marquee" },
  { id: "undo", icon: RotateCcw, label: "Undo", action: "undo" },
  { id: "clear", icon: Trash2, label: "Clear", action: "clear" },
];

function FloatingToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onClear,
}: FloatingToolbarProps) {
  return (
    <div className="absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-1 shadow-2xl shadow-black/50 backdrop-blur-md sm:top-4 sm:max-w-none sm:p-1.5">
      {TOOLBAR_ITEMS.map(({ id, icon: Icon, label, action }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => {
            if (action === "undo") onUndo();
            else if (action === "clear") onClear();
            else onToolChange(id);
          }}
          className={cn(
            "flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            !action && activeTool === id
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
          )}
        >
          <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

interface InteractionDialogueProps {
  elements: CanvasElement[];
  selectedElementId: string;
  onSelectElement: (id: string) => void;
  editPrompt: string;
  onEditPromptChange: (value: string) => void;
  onClose: () => void;
  onApplyEdit: () => void;
  isApplying: boolean;
}

function InteractionDialogue({
  elements,
  selectedElementId,
  onSelectElement,
  editPrompt,
  onEditPromptChange,
  onClose,
  onApplyEdit,
  isApplying,
}: InteractionDialogueProps) {
  const selected = elements.find((e) => e.id === selectedElementId);
  const editPromptId = useId();

  const dialogueBody = (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-4 w-4 shrink-0 text-violet-400" />
          <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
            Interaction: Select an element
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Close interaction panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto p-4 lg:max-h-none">
        <ul className="space-y-1.5" role="listbox" aria-label="Canvas elements">
          {elements.map((element) => {
            const isActive = element.id === selectedElementId;
            return (
              <li key={element.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelectElement(element.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-base transition-all md:text-sm",
                    isActive
                      ? "border-violet-500/60 bg-violet-500/15 text-violet-100"
                      : "border-transparent bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80",
                    element.highlighted &&
                      !isActive &&
                      "border-amber-500/20 text-amber-100/90",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      isActive ? "bg-violet-400" : "bg-zinc-600",
                      element.highlighted && !isActive && "bg-amber-400",
                    )}
                  />
                  {element.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2">
          <label
            htmlFor={editPromptId}
            className="block text-xs font-medium text-zinc-400"
          >
            What would you like to edit about{" "}
            <span className="text-zinc-200">{selected?.label ?? "this element"}</span>
            ?
          </label>
          <textarea
            id={editPromptId}
            value={editPrompt}
            onChange={(e) => onEditPromptChange(e.target.value)}
            rows={3}
            placeholder="Describe your edit…"
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 md:text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EDIT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onEditPromptChange(suggestion)}
                className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 md:min-h-0 md:px-2.5 md:py-1 md:text-[11px]"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!editPrompt.trim() || isApplying}
            onClick={onApplyEdit}
            className={cn(
              "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold uppercase tracking-wide",
              editPrompt.trim() && !isApplying
                ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500",
            )}
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brush className="h-3.5 w-3.5" />
            )}
            Apply Element Edit
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: bottom-sheet modal */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Element interaction"
      >
        <button
          type="button"
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]"
          onClick={onClose}
          aria-label="Dismiss interaction panel"
        />
        <div className="relative max-h-[88vh] overflow-hidden rounded-t-2xl border border-zinc-700/80 border-b-0 bg-zinc-950/98 shadow-2xl shadow-black/60">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-700" />
          {dialogueBody}
        </div>
      </div>

      {/* Desktop: floating panel */}
      <div className="absolute bottom-6 left-6 z-20 hidden w-[min(100%,22rem)] overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-md md:block">
        {dialogueBody}
      </div>
    </>
  );
}

interface CanvasWorkspaceProps {
  imageUrl: string | null;
  isGenerating: boolean;
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  elements: CanvasElement[];
  selectedElementId: string;
  onSelectElement: (id: string) => void;
  editPrompt: string;
  onEditPromptChange: (value: string) => void;
  showInteraction: boolean;
  onCloseInteraction: () => void;
  onApplyElementEdit: () => void;
  isApplyingEdit: boolean;
  mode: EditorMode;
}

function CanvasWorkspace({
  imageUrl,
  isGenerating,
  activeTool,
  onToolChange,
  elements,
  selectedElementId,
  onSelectElement,
  editPrompt,
  onEditPromptChange,
  showInteraction,
  onCloseInteraction,
  onApplyElementEdit,
  isApplyingEdit,
  mode,
}: CanvasWorkspaceProps) {
  const [, setToolHistory] = useState<CanvasTool[]>([]);

  const handleUndo = useCallback(() => {
    setToolHistory((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) onToolChange(last);
      return next;
    });
  }, [onToolChange]);

  const handleToolChange = useCallback(
    (tool: CanvasTool) => {
      setToolHistory((prev) => [...prev.slice(-4), activeTool]);
      onToolChange(tool);
    },
    [activeTool, onToolChange],
  );

  const handleClear = useCallback(() => {
    onToolChange("pointer");
    setToolHistory([]);
  }, [onToolChange]);

  return (
    <main className="relative flex min-h-[min(55vh,32rem)] min-w-0 flex-1 flex-col bg-zinc-900/30 md:min-h-0">
      <FloatingToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onClear={handleClear}
      />

      <div className="relative flex flex-1 items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="relative w-full max-w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 shadow-inner shadow-black/40 lg:aspect-square lg:max-w-3xl">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Canvas preview"
              className={cn(
                "mx-auto h-auto max-h-[min(70vh,36rem)] w-full max-w-full object-contain lg:max-h-none lg:h-full",
                isGenerating && "opacity-60 blur-[1px]",
              )}
            />
          ) : (
            <div className="flex min-h-[min(50vh,20rem)] flex-col items-center justify-center gap-3 px-6 py-12 text-center lg:min-h-0 lg:h-full">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-500">
                <ImagePlus className="mx-auto h-10 w-10 stroke-[1.25]" />
              </div>
              <p className="text-sm font-medium text-zinc-400">
                {mode === "create"
                  ? "Your generated image will appear here"
                  : "Upload a base image to begin editing"}
              </p>
              <p className="max-w-xs text-xs text-zinc-600">
                {mode === "create"
                  ? "Enter a prompt and hit Generate — no upload needed"
                  : "Use the control panel to upload and edit"}
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/70 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
              <p className="text-sm font-medium text-zinc-300">
                {GENERATING_MESSAGE}
              </p>
            </div>
          )}
        </div>
      </div>

      {showInteraction && imageUrl && (
        <InteractionDialogue
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={onSelectElement}
          editPrompt={editPrompt}
          onEditPromptChange={onEditPromptChange}
          onClose={onCloseInteraction}
          onApplyEdit={onApplyElementEdit}
          isApplying={isApplyingEdit}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chat refinement thread (right sidebar)                                     */
/* -------------------------------------------------------------------------- */

interface ChatRefinementPanelProps {
  messages: ChatMessage[];
  refinePrompt: string;
  onRefinePromptChange: (value: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  canRefine: boolean;
}

function ChatRefinementPanel({
  messages,
  refinePrompt,
  onRefinePromptChange,
  onRefine,
  isRefining,
  canRefine,
}: ChatRefinementPanelProps) {
  const refinePromptId = useId();
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRefining]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canRefine && refinePrompt.trim() && !isRefining) onRefine();
    }
  };

  return (
    <Panel title="Refinement Chat" className="h-full w-full border-0 md:w-72 md:border-l xl:w-80">
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
        <div className="min-h-0 space-y-3 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 text-center">
              <MessageSquare className="h-6 w-6 text-zinc-700" />
              <p className="text-xs leading-relaxed text-zinc-500">
                Generate an image, then refine it in a continuous dialogue. Each
                turn builds on the previous result.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1.5",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {message.role === "user" ? "You" : "Model"}
                </span>
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-br-md bg-violet-600/90 text-violet-50"
                      : "rounded-bl-md border border-zinc-800 bg-zinc-900/80 text-zinc-200",
                  )}
                >
                  {message.text}
                </div>
                {message.imageUrl && (
                  <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                    <img
                      src={message.imageUrl}
                      alt="Refinement result"
                      className="h-28 w-28 object-cover"
                    />
                    <p className="border-t border-zinc-800 px-2 py-1 text-[10px] text-zinc-500">
                      New thumbnail rendered
                    </p>
                  </div>
                )}
              </div>
            ))
          )}

          {isRefining && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              Refining your image…
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        <div className="border-t border-zinc-800 p-3">
          <label htmlFor={refinePromptId} className="sr-only">
            Refinement prompt
          </label>
          <textarea
            id={refinePromptId}
            value={refinePrompt}
            onChange={(e) => onRefinePromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isRefining}
            placeholder={
              canRefine
                ? "Describe your next refinement…"
                : "Generate an image first to start refining"
            }
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_EDIT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isRefining || !canRefine}
                onClick={() => onRefinePromptChange(suggestion)}
                className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:px-2.5 md:py-1 md:text-[11px]"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!canRefine || !refinePrompt.trim() || isRefining}
            onClick={onRefine}
            className={cn(
              "mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold uppercase tracking-wide transition md:text-xs",
              canRefine && refinePrompt.trim() && !isRefining
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500",
            )}
          >
            {isRefining ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refining…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send / Refine
              </>
            )}
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent gallery (right sidebar)                                             */
/* -------------------------------------------------------------------------- */

interface RecentGalleryProps {
  records: GenerationRecord[];
  activeId: string | null;
  onSelect: (record: GenerationRecord) => void;
}

function RecentGallery({ records, activeId, onSelect }: RecentGalleryProps) {
  return (
    <Panel title="Recent Generations" className="h-full w-full border-0 md:w-56 md:border-l xl:w-64">
      <div className="h-full min-h-0 overflow-y-auto p-3">
        {records.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-2 text-center">
            <Sparkles className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-500">Generations will appear here</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {records.map((record) => {
              const isActive = record.id === activeId;
              return (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(record)}
                    className={cn(
                      "group min-h-11 w-full overflow-hidden rounded-xl border text-left transition-all",
                      isActive
                        ? "border-violet-500/70 ring-2 ring-violet-500/30"
                        : "border-zinc-800 hover:border-zinc-600",
                    )}
                  >
                    <div className="aspect-square overflow-hidden bg-zinc-900">
                      <img
                        src={record.url}
                        alt={record.prompt}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="border-t border-zinc-800 px-2 py-1.5">
                      <p className="truncate text-[10px] text-zinc-500">
                        {new Date(record.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Root editor shell                                                          */
/* -------------------------------------------------------------------------- */

export interface NanoBananaEditorProps {
  initialPrompt?: string;
  initialMode?: EditorMode;
  giftToken?: string;
  giftMode?: boolean;
  isAdmin?: boolean;
  isGiftLocked?: boolean;
  onGiftRedeemed?: (imageUrl: string) => void;
}

export function NanoBananaEditor({
  initialPrompt = "A lush garden with neon flowers",
  initialMode = "create",
  giftToken,
  giftMode = false,
  isAdmin = false,
  isGiftLocked = false,
  onGiftRedeemed,
}: NanoBananaEditorProps) {
  const [mode, setMode] = useState<EditorMode>(giftMode ? "create" : initialMode);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [canvasImageUrl, setCanvasImageUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [safetyTolerance, setSafetyTolerance] = useState<SafetyTolerance>("4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("pointer");
  const [selectedElementId, setSelectedElementId] = useState("base");
  const [editPrompt, setEditPrompt] = useState("");
  const [showInteraction, setShowInteraction] = useState(true);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [parentImageUrl, setParentImageUrl] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("workspace");

  const abortRef = useRef<AbortController | null>(null);

  const elements = useMemo(() => deriveElementsFromPrompt(prompt), [prompt]);

  useEffect(() => {
    if (!elements.some((e) => e.id === selectedElementId)) {
      setSelectedElementId(elements[0]?.id ?? "base");
    }
  }, [elements, selectedElementId]);

  const handleBaseImageChange = useCallback((file: File | null, preview: string | null) => {
    setBaseImageFile(file);
    setBaseImagePreview(preview);
    if (preview) setCanvasImageUrl(preview);
  }, []);

  const appendGeneration = useCallback(
    (url: string, generationPrompt: string, chatTurn?: { userText: string }) => {
      const record: GenerationRecord = {
        id: crypto.randomUUID(),
        url,
        prompt: generationPrompt,
        createdAt: Date.now(),
      };
      setGenerations((prev) => [record, ...prev].slice(0, 24));
      setActiveGenerationId(record.id);
      setCanvasImageUrl(url);
      setParentImageUrl(url);
      setShowInteraction(true);

      if (chatTurn) {
        const now = Date.now();
        setChatHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "user",
            text: chatTurn.userText,
            createdAt: now,
          },
          {
            id: crypto.randomUUID(),
            role: "model",
            text: "New thumbnail rendered",
            imageUrl: url,
            createdAt: now + 1,
          },
        ]);
      }
    },
    [],
  );

  const runGeneration = useCallback(
    async (
      generationPrompt: string,
      requestMode: EditorMode,
      options?: {
        imageUrls?: string[];
        parentImageUrl?: string;
        chatTurn?: { userText: string };
      },
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setIsGenerating(true);

      try {
        const payload = {
          prompt: generationPrompt,
          mode: requestMode,
          resolution,
          safety_tolerance: safetyTolerance,
          num_images: 1,
          output_format: "png" as const,
          ...(options?.parentImageUrl
            ? { parent_image_url: options.parentImageUrl }
            : {}),
          ...(options?.imageUrls?.length ? { image_urls: options.imageUrls } : {}),
        };

        const response = await generateImage(payload, {
          signal: controller.signal,
          giftToken: isAdmin ? undefined : giftToken,
          isAdmin,
        });

        const image = response?.images?.[0];
        if (!image?.url) {
          throw new Error("No image returned from the server.");
        }

        appendGeneration(image.url, generationPrompt, giftMode ? undefined : options?.chatTurn);
        setMobileView("workspace");
        if (giftMode && giftToken) {
          onGiftRedeemed?.(image.url);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof GenerateApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [appendGeneration, giftMode, giftToken, isAdmin, onGiftRedeemed, resolution, safetyTolerance],
  );

  const handleGenerate = useCallback(async () => {
    if (giftMode && isGiftLocked) return;
    let imageUrls: string[] | undefined;

    if (baseImagePreview) {
      imageUrls = [baseImagePreview];
    } else if (baseImageFile) {
      imageUrls = [await fileToDataUrl(baseImageFile)];
    }

    if (mode === "edit" && !imageUrls?.length) {
      setError("Edit mode requires a base image.");
      return;
    }

    const trimmedPrompt = prompt.trim();
    await runGeneration(trimmedPrompt, mode, {
      imageUrls: mode === "edit" ? imageUrls : undefined,
      chatTurn: { userText: trimmedPrompt },
    });
  }, [baseImageFile, baseImagePreview, giftMode, isGiftLocked, mode, prompt, runGeneration]);

  const handleChatRefine = useCallback(async () => {
    const trimmed = refinePrompt.trim();
    if (!trimmed) return;

    const activeParent = parentImageUrl ?? canvasImageUrl;
    if (!activeParent) {
      setError("Refinement requires a generated or uploaded image on the canvas.");
      return;
    }

    setIsRefining(true);
    setError(null);
    try {
      await runGeneration(trimmed, "edit", {
        parentImageUrl: activeParent,
        chatTurn: { userText: trimmed },
      });
      setRefinePrompt("");
    } finally {
      setIsRefining(false);
    }
  }, [canvasImageUrl, parentImageUrl, refinePrompt, runGeneration]);

  const handleApplyElementEdit = useCallback(async () => {
    const selected = elements.find((e) => e.id === selectedElementId);
    if (!selected || !editPrompt.trim()) return;

    const contextualPrompt = `Edit "${selected.label}": ${editPrompt.trim()}. Original scene: ${prompt}`;
    const sourceUrl = parentImageUrl ?? canvasImageUrl ?? baseImagePreview;

    if (!sourceUrl) {
      setError("Element edits require a generated or uploaded image.");
      return;
    }

    setIsApplyingEdit(true);
    try {
      await runGeneration(contextualPrompt, "edit", {
        parentImageUrl: sourceUrl,
        chatTurn: { userText: contextualPrompt },
      });
      setEditPrompt("");
    } finally {
      setIsApplyingEdit(false);
    }
  }, [
    baseImagePreview,
    canvasImageUrl,
    editPrompt,
    elements,
    parentImageUrl,
    prompt,
    runGeneration,
    selectedElementId,
  ]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div className="relative grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden bg-zinc-950 text-zinc-100 md:grid-rows-[auto_minmax(0,1fr)]">
      {isGiftLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 px-6 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 text-center shadow-2xl">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-violet-400" />
            <h2 className="text-xl font-semibold text-zinc-100">Thank you!</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Your gift link has been successfully used. We hope you enjoy your
              creation.
            </p>
            {canvasImageUrl && (
              <a
                href={canvasImageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Download your image
              </a>
            )}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-sm font-medium text-zinc-300">
                {GIFT_MORE_IMAGES_MESSAGE}
              </p>
              <a
                href={GIFT_OWNER_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                WhatsApp {GIFT_OWNER_WHATSAPP}
              </a>
            </div>
          </div>
        </div>
      )}

      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-950/40">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight sm:text-base">
              {APP_NAME}
            </h1>
            <p className="text-[11px] text-zinc-500">
              {giftMode
                ? GIFT_WORKSPACE_LABEL
                : isAdmin
                  ? `${CREATOR_STUDIO_LABEL} · Unlimited Access`
                  : APP_TAGLINE}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-zinc-500 sm:px-3">
          {mode === "create" ? "Create" : "Edit"}
        </span>
      </header>

      {!giftMode && <MobileTabBar active={mobileView} onChange={setMobileView} />}

      <div
        className={cn(
          "grid h-full min-h-0 grid-cols-1 overflow-hidden",
          "md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,36rem)]",
        )}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            mobileView === "controls" ? "flex" : "hidden",
            "md:flex",
          )}
        >
          <ControlPanel
            mode={mode}
            onModeChange={setMode}
            hideModeToggle={giftMode}
            prompt={prompt}
            onPromptChange={setPrompt}
            baseImagePreview={baseImagePreview}
            onBaseImageChange={handleBaseImageChange}
            resolution={resolution}
            onResolutionChange={setResolution}
            safetyTolerance={safetyTolerance}
            onSafetyToleranceChange={setSafetyTolerance}
            isGenerating={isGenerating || isGiftLocked}
            error={error}
            onGenerate={handleGenerate}
          />
        </div>

        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            mobileView === "workspace" ? "flex" : "hidden",
            "md:flex",
          )}
        >
          <CanvasWorkspace
            imageUrl={canvasImageUrl}
            isGenerating={isGenerating || isApplyingEdit || isRefining}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            editPrompt={editPrompt}
            onEditPromptChange={setEditPrompt}
            showInteraction={showInteraction && !giftMode}
            onCloseInteraction={() => setShowInteraction(false)}
            onApplyElementEdit={handleApplyElementEdit}
            isApplyingEdit={isApplyingEdit}
            mode={mode}
          />
        </div>

        {!giftMode && (
        <div
          className={cn(
            "grid h-full min-h-0 grid-cols-1 overflow-hidden",
            mobileView === "history" ? "grid" : "hidden",
            "md:grid md:grid-cols-[minmax(0,18rem)_minmax(0,16rem)]",
          )}
        >
          <ChatRefinementPanel
            messages={chatHistory}
            refinePrompt={refinePrompt}
            onRefinePromptChange={setRefinePrompt}
            onRefine={handleChatRefine}
            isRefining={isRefining}
            canRefine={Boolean(parentImageUrl ?? canvasImageUrl)}
          />

          <RecentGallery
            records={generations}
            activeId={activeGenerationId}
            onSelect={(record) => {
              setActiveGenerationId(record.id);
              setCanvasImageUrl(record.url);
              setParentImageUrl(record.url);
              setPrompt(record.prompt);
              setShowInteraction(true);
              setMobileView("workspace");
            }}
          />
        </div>
        )}
      </div>
    </div>
  );
}

export default NanoBananaEditor;
