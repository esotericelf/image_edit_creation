import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Copy, Link2, Loader2, LogOut, Palette, Shield, Sparkles } from "lucide-react";
import {
  GenerateApiError,
  adminLogin,
  generateGiftToken,
  listGiftTokens,
} from "../components/NanoBananaEditor/api";
import type { GiftTokenCreateResponse } from "../components/NanoBananaEditor/types";
import { useAdminAuth } from "../contexts/AdminAuthContext";

export function AdminDashboard() {
  const { isAdmin: authenticated, loading, refreshAdminSession, logoutAdmin } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capError, setCapError] = useState(false);
  const [tokens, setTokens] = useState<GiftTokenCreateResponse[]>([]);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  const refreshTokens = useCallback(async () => {
    const rows = await listGiftTokens();
    setTokens(rows);
  }, []);

  useEffect(() => {
    if (authenticated) {
      void refreshTokens();
    }
  }, [authenticated, refreshTokens]);

  const handleLogin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin(password);
      await refreshAdminSession();
      setPassword("");
      await refreshTokens();
    } catch (err) {
      setError(err instanceof GenerateApiError ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setTokens([]);
    setLastGeneratedLink(null);
  };
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setCapError(false);
    try {
      const created = await generateGiftToken();
      const fullUrl = `${window.location.origin}${created.invite_path}`;
      setLastGeneratedLink(fullUrl);
      await refreshTokens();
    } catch (err) {
      if (err instanceof GenerateApiError && err.status === 429) {
        setCapError(true);
        setError(err.message);
      } else {
        setError(err instanceof GenerateApiError ? err.message : "Could not generate link.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Admin Login</h1>
              <p className="text-sm text-zinc-500">Master account access</p>
            </div>
          </div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Master Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            className="mb-4 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-zinc-100 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            placeholder="Enter master password"
          />
          {error && (
            <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={!password.trim() || submitting}
            onClick={() => void handleLogin()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Gift Link Dashboard</h1>
              <p className="text-sm text-zinc-500">Generate single-use invite links (max 5 active)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>

        {capError && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Generation blocked</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/90">
                You already have 5 active, unexpired gift links outstanding.
                Wait for links to expire or be redeemed before creating more.
              </p>
            </div>
          </div>
        )}

        {error && !capError && (
          <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Link
          to="/editor"
          className="mb-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-400/60 hover:bg-violet-500/20 sm:w-auto"
        >
          <Palette className="h-4 w-4" />
          Enter Creator Studio (Unlimited Access)
        </Link>

        <button
          type="button"
          disabled={generating}
          onClick={() => void handleGenerate()}
          className="mb-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 sm:w-auto"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Generate new gift link
        </button>

        {lastGeneratedLink && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-200">Latest invite link</p>
            <p className="mt-2 break-all font-mono text-xs text-emerald-100/90">{lastGeneratedLink}</p>
            <button
              type="button"
              onClick={() => void copyLink(lastGeneratedLink)}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-emerald-500"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="border-b border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Recent gift links
          </h2>
          <ul className="divide-y divide-zinc-800">
            {tokens.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">No links generated yet.</li>
            ) : (
              tokens.map((row) => {
                const fullUrl = `${window.location.origin}${row.invite_path}`;
                const expired = new Date(row.expires_at).getTime() < Date.now();
                return (
                  <li key={row.token} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-zinc-300">{row.token}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Expires {new Date(row.expires_at).toLocaleString()}
                        {expired ? " · expired" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyLink(fullUrl)}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy invite URL
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
