/**
 * The model library, across every project the caller can see.
 *
 * Each entry is a model document someone exported (`*.eml.yaml`), kept in its
 * project's local Git history under `model/library/`. Opening one draws it
 * with the same viewer the design step uses, read-only; loading it into a
 * project is done from that project's design step.
 */

import { readModelYaml } from "@appwithai/generator/model-yaml";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Download, Eye, FileCode2, Loader2, RefreshCw, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ModelViewer } from "@/components/model/ModelViewer";
import type { LibraryModel } from "@/types/project";

export const Route = createFileRoute("/admin/model-library/")({
  component: ModelLibraryPage,
});

/** One line about a model: its name and what it declares, or why it does not read. */
function describe(content: string): { title: string; detail: string; readable: boolean } {
  const read = readModelYaml(content, { check: false });
  const document = read.document;
  if (!document) {
    const first = read.diagnostics.find((d) => d.severity === "error");
    return {
      title: "Unreadable model",
      detail: first ? `line ${first.line}: ${first.message}` : "does not read as a model",
      readable: false,
    };
  }
  const count = (items: unknown[] | undefined, noun: string) =>
    items?.length ? `${items.length} ${noun}${items.length === 1 ? "" : "s"}` : null;
  return {
    title: document.name ?? "Untitled model",
    detail: [
      count(document.entities, "entity"),
      count(document.relationships, "relationship"),
      count(document.rules, "rule"),
      count(document.sagas, "saga"),
    ]
      .filter(Boolean)
      .join(" · ")
      .replace("entitys", "entities"),
    readable: true,
  };
}

function ModelLibraryPage() {
  const [files, setFiles] = useState<LibraryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canonicalOnly, setCanonicalOnly] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState<LibraryModel | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/model-library${canonicalOnly ? "?canonical=true" : ""}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `The library could not be loaded (${res.status})`);
      setFiles(data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [canonicalOnly]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const summaries = useMemo(
    () => new Map(files.map((file) => [`${file.projectId}/${file.filename}`, describe(file.content)])),
    [files]
  );

  const remove = async (file: LibraryModel) => {
    if (!confirm(`Remove "${file.filename}" from its project's library? Its Git history keeps it.`))
      return;
    setDeleting(file.filename);
    try {
      const res = await fetch(
        `/api/model-library/${encodeURIComponent(file.filename)}?projectId=${encodeURIComponent(file.projectId)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Removal failed (${res.status})`);
      if (open?.filename === file.filename && open.projectId === file.projectId) setOpen(null);
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <FileCode2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Model library</h1>
            <p className="text-sm text-muted-foreground">Model documents exported from your projects</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/projects" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              Projects
            </Link>
            <Link to="/admin/rules" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              Rules admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={canonicalOnly} onChange={(e) => setCanonicalOnly(e.target.checked)} />
            Canonical models only
          </label>
          <button type="button" onClick={() => void fetchFiles()} className="ml-auto flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the library…
          </p>
        ) : files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No models yet. Export one from a project&apos;s design step and it is kept here.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {files.map((file) => {
              const summary = summaries.get(`${file.projectId}/${file.filename}`);
              return (
                <li key={`${file.projectId}/${file.filename}`} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-mono text-sm">
                      {file.canonical && <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Canonical" />}
                      {file.filename}
                    </p>
                    <p className={`truncate text-xs ${summary?.readable ? "text-muted-foreground" : "text-destructive"}`}>
                      {summary?.title} — {summary?.detail}
                    </p>
                  </div>
                  <Link to="/projects/$id/design" params={{ id: file.projectId }} className="text-xs text-primary hover:underline">
                    Project
                  </Link>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                  <button type="button" onClick={() => setOpen(file)} aria-label={`View ${file.filename}`} className="rounded p-1.5 hover:bg-muted">
                    <Eye className="h-4 w-4" />
                  </button>
                  <a href={file.downloadUrl} download={file.filename} aria-label={`Download ${file.filename}`} className="rounded p-1.5 hover:bg-muted">
                    <Download className="h-4 w-4" />
                  </a>
                  <button type="button" onClick={() => void remove(file)} disabled={deleting === file.filename} aria-label={`Remove ${file.filename}`} className="rounded p-1.5 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
                    {deleting === file.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background p-4" role="dialog" aria-modal="true" aria-label={open.filename}>
          <div className="mb-3 flex items-center gap-3">
            <p className="font-mono text-sm">{open.filename}</p>
            <button type="button" onClick={() => setOpen(null)} className="ml-auto flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
              <X className="h-4 w-4" /> Close
            </button>
          </div>
          <ModelViewer value={open.content} className="flex-1" />
        </div>
      )}
    </div>
  );
}
