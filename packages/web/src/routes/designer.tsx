/**
 * A model editor outside any project.
 *
 * The same editor as a project's design step — YAML on one side, diagrams drawn
 * from it on the other, every finding of the generator's own reader at its
 * line — for reading a model, trying one out, or checking a file before it is
 * imported. Nothing here is saved on the server: a model becomes part of a
 * project by starting a project with it (Projects → Import).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileCode2, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type ModelReadState, ModelViewer } from "@/components/model/ModelViewer";

export const Route = createFileRoute("/designer")({
  component: DesignerPage,
});

interface ExampleModel {
  id: string;
  name: string;
  label: string;
  entities: number;
}

const DRAFT_KEY = "appwithai:designer-draft";

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

function DesignerPage() {
  const [model, setModel] = useState("");
  const [read, setRead] = useState<ModelReadState>({ diagnostics: [], ok: false });
  const [examples, setExamples] = useState<ExampleModel[]>([]);
  const [loadingExample, setLoadingExample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // The unsaved text survives a reload in this browser, and nowhere else.
  useEffect(() => setModel(readDraft()), []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, model);
    } catch {
      // Storage refused (private window, quota): the editor still works.
    }
  }, [model]);

  useEffect(() => {
    fetch("/api/models/examples")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `The bundled models could not be listed (${res.status})`);
        setExamples(data.models ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const openExample = async (id: string) => {
    if (model.trim() && !confirm("Replace the model in the editor?")) return;
    setLoadingExample(id);
    setError(null);
    try {
      const res = await fetch(`/api/models/examples?id=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `The model could not be read (${res.status})`);
      setModel(data.model);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingExample(null);
    }
  };

  const download = () => {
    const name = (read.document?.name ?? "model").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
    const url = URL.createObjectURL(new Blob([model], { type: "application/yaml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.eml.yaml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const errors = read.diagnostics.filter((d) => d.severity === "error").length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <Link to="/dashboard" className="rounded-md p-1.5 hover:bg-muted" aria-label="Back to the dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <FileCode2 className="h-5 w-5 text-primary" />
        <h1 className="font-semibold">Model editor</h1>
        {model.trim() && (
          <span className={`flex items-center gap-1.5 text-xs ${errors ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {errors ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {errors ? `${errors} error${errors === 1 ? "" : "s"}` : "Ready to generate"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select
            value=""
            onChange={(e) => e.target.value && void openExample(e.target.value)}
            disabled={!examples.length || loadingExample !== null}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            aria-label="Open a bundled model"
          >
            <option value="">{loadingExample ? "Opening…" : "Open a bundled model…"}</option>
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.label} ({example.entities} entities)
              </option>
            ))}
          </select>
          <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
            <Upload className="h-4 w-4" /> Open file
          </button>
          <button type="button" onClick={download} disabled={!model.trim()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50">
            <Download className="h-4 w-4" /> Download
          </button>
          <Link to="/projects" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
            Start a project
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-5 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {loadingExample && (
        <p className="flex items-center gap-2 px-5 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening the model…
        </p>
      )}

      <ModelViewer value={model} onChange={setModel} onRead={setRead} className="m-4 flex-1" />

      <input
        ref={fileInput}
        type="file"
        accept=".yaml,.yml,application/yaml,text/yaml"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && (!model.trim() || confirm("Replace the model in the editor?"))) setModel(await file.text());
        }}
      />
    </div>
  );
}
