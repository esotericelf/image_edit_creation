import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { NanoBananaEditor } from "../components/NanoBananaEditor";
import { useAdminAuth } from "../contexts/AdminAuthContext";

export function CreatorStudioPage() {
  const { isAdmin, loading, refreshAdminSession } = useAdminAuth();

  useEffect(() => {
    void refreshAdminSession();
  }, [refreshAdminSession]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950">
      <div className="flex items-center justify-end border-b border-zinc-800/80 px-4 py-2 sm:px-6">
        <Link
          to="/admin"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 hover:bg-zinc-900"
        >
          Back to Gift Dashboard
        </Link>
      </div>
      <NanoBananaEditor isAdmin />
    </div>
  );
}
