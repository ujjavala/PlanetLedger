"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

type UploadPanelProps = Readonly<{
  onUploaded: () => Promise<void>;
}>;

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Require login before uploading — otherwise data is stored under anonymous user
    if (!user) {
      window.location.href = "/auth/login?returnTo=/dashboard";
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Upload failed");
      }
      setSuccess(true);
      setFileName(null);
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected upload error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-7 shadow-card">
      <div className="flex items-center gap-4 mb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-md">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upload Transaction Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">CSV or PDF · AU format · AI-powered extraction</p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Hidden native input — label acts as the styled trigger */}
        <input
          id="file-upload"
          name="file"
          type="file"
          accept=".csv,application/pdf"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <label
          htmlFor="file-upload"
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-white px-5 py-4 transition hover:border-brand-500 hover:bg-emerald-50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Upload className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="truncate text-sm font-medium text-slate-600">
              {fileName ?? "Choose a CSV or PDF file…"}
            </span>
          </div>
          <span className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Browse
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !fileName}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? "Uploading & Analyzing…" : user ? "Upload & Analyze" : "Sign in to Upload"}
        </button>
      </form>

      {success && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-100 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-800">✓ Transactions imported successfully!</span>
          <a
            href="/dashboard"
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            View stats →
          </a>
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        🔒 Files are never stored — only extracted transactions are saved.
      </p>
    </section>
  );
}
