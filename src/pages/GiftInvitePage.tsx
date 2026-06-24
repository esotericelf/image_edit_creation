import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { APP_NAME } from "../config/branding";
import { NanoBananaEditor } from "../components/NanoBananaEditor";
import { GenerateApiError, fetchGiftTokenStatus } from "../components/NanoBananaEditor/api";
import type { GiftTokenStatusResponse } from "../components/NanoBananaEditor/types";

export function GiftInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<GiftTokenStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [giftLocked, setGiftLocked] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided.");
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const result = await fetchGiftTokenStatus(token);
        setStatus(result);
        if (!result.valid) {
          setGiftLocked(result.is_used);
        }
      } catch (err) {
        setError(
          err instanceof GenerateApiError ? err.message : "Could not verify invite link.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-zinc-500">Verifying your invite…</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-80">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{APP_NAME}</p>
          <AlertTriangle className="mx-auto mb-4 mt-4 h-10 w-10 text-red-400" />
          <h1 className="text-lg font-semibold text-zinc-100">Invite unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">{error ?? "Invalid invite link."}</p>
        </div>
      </div>
    );
  }

  if (status && !status.valid) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-950/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{APP_NAME}</p>
          <h1 className="mt-4 text-lg font-semibold text-zinc-100">
            {status.is_used
              ? "This gift link has already been used"
              : "This gift link is no longer valid"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{status.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden">
      <NanoBananaEditor
        giftToken={token}
        giftMode
        isGiftLocked={giftLocked}
        initialPrompt="Describe the image you'd like to create…"
        onGiftRedeemed={() => setGiftLocked(true)}
      />
    </div>
  );
}
