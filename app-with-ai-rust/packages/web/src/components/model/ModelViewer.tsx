/**
 * The model, as its YAML and as diagrams of that YAML, side by side.
 *
 * The YAML is the model; the diagrams are drawn from it and from nothing else.
 * They are joined by document paths: clicking a node or an edge selects the
 * lines that declared it, and moving the cursor in the YAML highlights the
 * element it is on, switching to the view that draws it.
 *
 * Validation is the generator's own reader — YAML, schema, checker — running
 * in the browser, so a diagnostic here is the one generation would report, at
 * the same line. While the text does not read, the diagram keeps showing the
 * last version that did, and says so.
 */

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ModelView, modelViews, pathWithin } from "@/lib/model-view/graph";
import { buildSourceMap, type SourceRange } from "@/lib/model-view/source-map";
import { cn } from "@/lib/utils";
import {
  type DocumentPath,
  type ModelDiagnostic,
  type ModelDocument,
  readModelYaml,
} from "@appwithai/generator/model-yaml";
import { ModelDiagram } from "./ModelDiagram";

const LINE_HEIGHT = 20;
const READ_DELAY_MS = 200;

const GROUPS: Array<{ kind: ModelView["kind"]; label: string }> = [
  { kind: "entities", label: "Entities" },
  { kind: "stateMachine", label: "State machines" },
  { kind: "saga", label: "Sagas" },
  { kind: "rule", label: "Rules" },
  { kind: "hookFlow", label: "Hook flows" },
];

export interface ModelReadState {
  document?: ModelDocument;
  diagnostics: ModelDiagnostic[];
  /** Whether the model may be generated from: it reads and has no errors. */
  ok: boolean;
}

export interface ModelViewerProps {
  value: string;
  /** Absent for a read-only viewer. */
  onChange?: (text: string) => void;
  /** Called with every read of the text, after the typing pause. */
  onRead?: (state: ModelReadState) => void;
  /** The view shown first, by key: `entities`, `stateMachine:<name>`, … */
  initialView?: string;
  className?: string;
}

export interface ModelViewerHandle {
  /** Select the lines a path was written on and show the element it draws. */
  reveal(path: DocumentPath): void;
}

export const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(function ModelViewer(
  { value, onChange, onRead, initialView, className },
  ref
) {
  const [read, setRead] = useState<ModelReadState>(() => readText(value));
  const [lastDocument, setLastDocument] = useState<ModelDocument | undefined>(read.document);
  const [viewKey, setViewKey] = useState(initialView ?? "entities");
  const [selection, setSelection] = useState<{
    path: DocumentPath;
    from: "text" | "diagram";
  }>();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = readText(value);
      setRead(next);
      if (next.document) setLastDocument(next.document);
      onReadRef.current?.(next);
    }, READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const sourceMap = useMemo(() => buildSourceMap(value), [value]);
  const views = useMemo(() => (lastDocument ? modelViews(lastDocument) : []), [lastDocument]);
  const view = views.find((candidate) => candidate.key === viewKey) ?? views[0];
  const stale = !read.document && lastDocument !== undefined;

  const selectedRange = selection ? sourceMap.rangeOf(selection.path) : undefined;

  const showRange = useCallback((range: SourceRange, focus: boolean) => {
    const area = textarea.current;
    if (!area) return;
    if (focus) area.focus({ preventScroll: true });
    area.setSelectionRange(range.start, range.end);
    const top = (range.startLine - 1) * LINE_HEIGHT;
    if (top < area.scrollTop || top > area.scrollTop + area.clientHeight - 3 * LINE_HEIGHT) {
      area.scrollTop = Math.max(0, top - 2 * LINE_HEIGHT);
    }
  }, []);

  /** The view that draws a path — the current one if it can. */
  const viewFor = useCallback(
    (path: DocumentPath) => {
      if (view && drawsPath(view, path)) return view;
      return views.find((candidate) => drawsPath(candidate, path));
    },
    [view, views]
  );

  const reveal = useCallback(
    (path: DocumentPath) => {
      const target = viewFor(path);
      if (target) setViewKey(target.key);
      setSelection({ path, from: "text" });
      const range = sourceMap.rangeOf(path);
      if (range) showRange(range, true);
    },
    [sourceMap, showRange, viewFor]
  );
  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  const onDiagramSelect = useCallback(
    (path: DocumentPath) => {
      setSelection({ path, from: "diagram" });
      const range = sourceMap.rangeOf(path);
      if (range) showRange(range, false);
    },
    [sourceMap, showRange]
  );

  const onCursor = useCallback(() => {
    const area = textarea.current;
    if (!area) return;
    const before = area.value.slice(0, area.selectionStart);
    const line = before.split("\n").length;
    const column = area.selectionStart - before.lastIndexOf("\n");
    const path = sourceMap.pathAt(line, column);
    if (!path.length) return;
    const target = viewFor(path);
    if (target && target.key !== view?.key) setViewKey(target.key);
    setSelection({ path, from: "text" });
  }, [sourceMap, view, viewFor]);

  const syncScroll = () => {
    const area = textarea.current;
    if (!area) return;
    if (gutter.current) gutter.current.scrollTop = area.scrollTop;
    if (band.current) band.current.style.transform = `translateY(${-area.scrollTop}px)`;
  };
  // Keep the band and gutter aligned when the text scrolls programmatically.
  useEffect(syncScroll);

  const lineCount = value.split("\n").length;
  const markers = useMemo(() => {
    const byLine = new Map<number, ModelDiagnostic["severity"]>();
    for (const diagnostic of read.diagnostics) {
      const existing = byLine.get(diagnostic.line);
      if (existing !== "error") byLine.set(diagnostic.line, diagnostic.severity);
    }
    return byLine;
  }, [read.diagnostics]);

  const errors = read.diagnostics.filter((d) => d.severity === "error").length;
  const warnings = read.diagnostics.filter((d) => d.severity === "warning").length;

  return (
    <div className={cn("grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]", className)}>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
          <span className="font-medium">model.eml.yaml</span>
          <span className="flex items-center gap-3 text-muted-foreground">
            <span>{lineCount} lines</span>
            {errors === 0 && warnings === 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> valid
              </span>
            ) : (
              <>
                {errors > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors}
                  </span>
                )}
                {warnings > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> {warnings}
                  </span>
                )}
              </>
            )}
          </span>
        </header>
        <div className="relative flex min-h-0 flex-1 font-mono text-xs">
          <div
            ref={gutter}
            className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/40 py-2 text-right text-muted-foreground"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, index) => {
              const line = index + 1;
              const severity = markers.get(line);
              const inSelection =
                selectedRange && line >= selectedRange.startLine && line <= selectedRange.endLine;
              return (
                <div
                  key={line}
                  className={cn(
                    "pr-2",
                    severity === "error" && "bg-destructive/15 text-destructive",
                    severity === "warning" && "bg-amber-500/15 text-amber-600",
                    inSelection && !severity && "text-primary"
                  )}
                  style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
                >
                  {line}
                </div>
              );
            })}
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {selectedRange && (
              <div ref={band} className="pointer-events-none absolute inset-x-0 top-2" aria-hidden="true">
                <div
                  className="absolute inset-x-0 bg-primary/10"
                  style={{
                    top: (selectedRange.startLine - 1) * LINE_HEIGHT,
                    height: (selectedRange.endLine - selectedRange.startLine + 1) * LINE_HEIGHT,
                  }}
                />
              </div>
            )}
            <textarea
              ref={textarea}
              value={value}
              readOnly={!onChange}
              onChange={(event) => onChange?.(event.target.value)}
              onScroll={syncScroll}
              onClick={onCursor}
              onKeyUp={onCursor}
              spellCheck={false}
              wrap="off"
              aria-label="Model YAML"
              className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-3 py-2 outline-none"
              style={{ lineHeight: `${LINE_HEIGHT}px`, tabSize: 2 }}
            />
          </div>
        </div>
        {read.diagnostics.length > 0 && (
          <ul className="max-h-40 overflow-auto border-t border-border text-xs">
            {read.diagnostics.map((diagnostic, index) => (
              <li key={`${diagnostic.line}:${diagnostic.column}:${diagnostic.code}:${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    const lines = value.split("\n").slice(0, diagnostic.line - 1);
                    const start = lines.reduce((sum, line) => sum + line.length + 1, 0);
                    const end = start + (value.split("\n")[diagnostic.line - 1]?.length ?? 0);
                    showRange(
                      { startLine: diagnostic.line, endLine: diagnostic.line, start, end },
                      true
                    );
                  }}
                  className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-muted"
                >
                  {diagnostic.severity === "error" ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {diagnostic.line}:{diagnostic.column}
                  </span>
                  <span className="shrink-0 font-mono">{diagnostic.code}</span>
                  <span>{diagnostic.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-border px-3 py-2 text-xs">
          <label className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">View</span>
            <select
              value={view?.key ?? ""}
              onChange={(event) => {
                setViewKey(event.target.value);
                setSelection(undefined);
              }}
              disabled={!views.length}
              className="min-w-0 rounded-md border border-border bg-background px-2 py-1"
            >
              {GROUPS.map((group) => {
                const members = views.filter((candidate) => candidate.kind === group.kind);
                if (!members.length) return null;
                return (
                  <optgroup key={group.kind} label={`${group.label} (${members.length})`}>
                    {members.map((member) => (
                      <option key={member.key} value={member.key}>
                        {member.entity && member.kind !== "entities"
                          ? `${member.title} — ${member.entity}`
                          : member.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
          {view && (
            <button
              type="button"
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => reveal(view.path)}
            >
              Show in YAML
            </button>
          )}
        </header>
        {stale && (
          <p className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300">
            The YAML does not read at the moment; the diagram shows the last version that did.
          </p>
        )}
        <div className="min-h-0 flex-1">
          {view ? (
            <ModelDiagram
              view={view}
              selectedPath={selection?.path}
              revealSelection={selection?.from === "text"}
              onSelectPath={onDiagramSelect}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
              Nothing to draw until the YAML reads as a model.
            </div>
          )}
        </div>
      </section>
    </div>
  );
});

function readText(text: string): ModelReadState {
  const result = readModelYaml(text);
  return { document: result.document, diagnostics: result.diagnostics, ok: result.ok };
}

/** Whether a view draws the element a path belongs to. */
function drawsPath(view: ModelView, path: DocumentPath): boolean {
  if (view.kind === "entities") {
    return path[0] === "entities" || path[0] === "relationships";
  }
  return pathWithin(path, view.path);
}
