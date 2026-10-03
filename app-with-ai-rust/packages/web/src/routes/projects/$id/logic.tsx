/**
 * Step 3 — the business rules.
 *
 * A rule is part of the model: it lives in the document's `rules` section, and
 * this page edits exactly that section. Each rule opens as the decision table
 * it is (or compiles to); a rule that decides with a graph is drawn from the
 * document by the model viewer and edited in the YAML on the design step.
 *
 * Saving replaces the `rules` section and nothing else — every other byte of
 * the author's document is kept — and commits it as a draft. The assistant
 * writes rules into the current model the same way: it is asked for the
 * section, and only the section it returns is taken.
 */

import { CopilotSidebar } from "@copilotkit/react-ui";
import { readModelYaml } from "@appwithai/generator/model-yaml";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopilotProvider } from "@/components/CopilotProvider";
import { ModelViewer } from "@/components/model/ModelViewer";
import { RuleEditor } from "@/components/model/RuleEditor";
import { ProgressStepper } from "@/components/ProgressStepper";
import { WizardStepHeader } from "@/components/WizardStepHeader";
import { useModelAssistant } from "@/hooks/useModelAssistant";
import { type EditableRule, readRules, slugifyRuleName, writeRules } from "@/lib/model/rules";
import { emptyDecisionTable } from "@/lib/workflow/bpmn-model";
import { useProjectStore } from "@/store/projectStore";

export const Route = createFileRoute("/projects/$id/logic")({
  component: LogicRoute,
});

function LogicRoute() {
  return (
    <CopilotProvider>
      <LogicPage />
    </CopilotProvider>
  );
}

interface Finding {
  severity: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

/** The rules a model text declares, as the editor edits them. */
function rulesOf(model: string): { rules: EditableRule[]; error?: string } {
  const read = readModelYaml(model, { check: false });
  if (!read.document) {
    const first = read.diagnostics.find((d) => d.severity === "error");
    return {
      rules: [],
      error: `The saved model does not read${first ? ` (line ${first.line}: ${first.message})` : ""}. Fix it on the design step.`,
    };
  }
  return { rules: readRules(read.document.rules, emptyDecisionTable) };
}

/** The same rules, compared as the model would store them. */
function sameRules(a: EditableRule[], b: EditableRule[]): boolean {
  return JSON.stringify(writeRules(a)) === JSON.stringify(writeRules(b));
}

/** A name no other rule has, from a stem. */
function freshName(stem: string, taken: Set<string>): string {
  if (!taken.has(stem)) return stem;
  let index = 2;
  while (taken.has(`${stem}${index}`)) index += 1;
  return `${stem}${index}`;
}

async function readEvents(response: Response, onEvent: (data: Record<string, unknown>) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The response has no body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)));
    }
  }
}

function LogicPage() {
  const navigate = useNavigate();
  const { id: projectId } = Route.useParams();
  const { getProject, loadProject, setCurrentStep, currentProject, isLoading } = useProjectStore();
  const project = getProject(projectId) || currentProject;
  useModelAssistant({ projectId, surface: "logic" });

  useEffect(() => {
    if (!getProject(projectId) && !currentProject) void loadProject(projectId);
  }, [projectId, getProject, currentProject, loadProject]);

  const savedModel = project?.modelYaml ?? "";
  const saved = useMemo(() => rulesOf(savedModel), [savedModel]);
  const document = useMemo(
    () => (savedModel.trim() ? readModelYaml(savedModel, { check: false }).document : undefined),
    [savedModel]
  );
  const entities = useMemo(
    () =>
      (document?.entities ?? []).map((entity) => ({
        name: entity.name,
        attributes: entity.attributes.map((attribute) => attribute.name),
      })),
    [document]
  );

  const [rules, setRules] = useState<EditableRule[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [graphFor, setGraphFor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [prompt, setPrompt] = useState("");
  const [assistant, setAssistant] = useState<{ running: boolean; message?: string; error?: boolean }>({
    running: false,
  });
  const nextKey = useRef(0);

  // Take the saved rules whenever the saved model changes (first load, a save,
  // a restore elsewhere); the editor owns them in between.
  useEffect(() => {
    if (!project) return;
    setCurrentStep("logic");
    setRules(saved.rules);
    setSelected((current) =>
      current && saved.rules.some((rule) => rule.key === current) ? current : (saved.rules[0]?.key ?? null)
    );
  }, [project, saved, setCurrentStep]);

  const dirty = !sameRules(rules, saved.rules);
  const current = rules.find((rule) => rule.key === selected);
  const duplicates = useMemo(() => {
    const seen = new Map<string, number>();
    for (const rule of rules) seen.set(rule.name, (seen.get(rule.name) ?? 0) + 1);
    return [...seen].filter(([, count]) => count > 1).map(([name]) => name);
  }, [rules]);

  const update = (key: string, patch: Partial<EditableRule>) =>
    setRules((list) => list.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)));

  const addRule = () => {
    const entity = entities[0]?.name ?? "";
    const name = freshName(slugifyRuleName(`${entity || "new"} rule`), new Set(rules.map((r) => r.name)));
    nextKey.current += 1;
    const rule: EditableRule = {
      key: `new:${nextKey.current}`,
      name,
      entity,
      event: "beforeCreate",
      table: emptyDecisionTable(),
      kind: "table",
    };
    setRules((list) => [...list, rule]);
    setSelected(rule.key);
  };

  const removeRule = (key: string) => {
    setRules((list) => list.filter((rule) => rule.key !== key));
    if (selected === key) setSelected(rules.find((rule) => rule.key !== key)?.key ?? null);
  };

  const save = useCallback(async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/model`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: { rules: writeRules(rules) },
          description: "Update business rules",
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? `Save failed (${response.status})`);
      setFindings((body.diagnostics ?? []) as Finding[]);
      await loadProject(projectId);
      setNotice({
        tone: body.ok ? "info" : "error",
        text: body.ok
          ? "Rules saved as a draft."
          : "Rules saved as a draft. The model has findings to resolve before it can be generated — they are listed below.",
      });
      return true;
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Save failed" });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId, rules, loadProject]);

  const runAssistant = async () => {
    if (!prompt.trim() || assistant.running || !savedModel.trim()) return;
    setAssistant({ running: true, message: "Sending the request…" });
    try {
      const response = await fetch("/api/ai/convert-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt, currentModel: savedModel, section: "rules" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `The assistant could not be reached (${response.status})`);
      }
      let result: { model: string; ok: boolean; diagnostics: Finding[]; attempts: number } | undefined;
      await readEvents(response, (data) => {
        if (data.step === "error") throw new Error(String(data.message));
        if (data.step === "complete") result = data as unknown as typeof result;
        else setAssistant({ running: true, message: String(data.message) });
      });
      if (!result) throw new Error("The assistant finished without rules");
      const next = rulesOf(result.model);
      if (next.error) throw new Error(next.error);
      setRules(next.rules);
      setSelected(next.rules[0]?.key ?? null);
      setFindings(result.diagnostics);
      setPrompt("");
      setAssistant({
        running: false,
        message: result.ok
          ? "The assistant revised the rules. Review them, then save."
          : `The assistant's rules still have findings after ${result.attempts} attempt(s); they are listed below. Review them before saving.`,
        error: !result.ok,
      });
    } catch (error) {
      setAssistant({ running: false, message: error instanceof Error ? error.message : String(error), error: true });
    }
  };

  const continueToGenerate = async () => {
    if (dirty && !(await save())) return;
    navigate({ to: "/projects/$id/generate", params: { id: projectId } });
  };

  if (isLoading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading project…
      </div>
    );
  }

  const errors = findings.filter((f) => f.severity === "error");

  return (
    <CopilotSidebar
      instructions="You help write the business rules of an application's model. Rules live in the model's `rules` section; each names an entity, an event and a decision table or actions."
      defaultOpen={false}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-6 py-3">
            <button type="button" onClick={() => void save()} disabled={!dirty || isSaving || duplicates.length > 0} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save rules" : "Saved"}
            </button>
            <button type="button" onClick={() => void continueToGenerate()} disabled={isSaving || duplicates.length > 0} className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              <Zap className="h-4 w-4" /> Continue to Generate
            </button>
          </div>
          <div className="mx-auto max-w-[1600px] px-6 pb-3">
            <ProgressStepper currentStep="logic" projectId={projectId} completedSteps={["init", "design"]} />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] px-6 pt-4">
          <WizardStepHeader
            stepNumber={3}
            title="Define business rules"
            description="Each rule runs on an event on one entity and decides with a table: conditions on the left, the outcome on the right, first matching row wins. Rules are saved into the model's rules section."
            estimatedTime="2-5 min"
          />
        </div>

        {(saved.error || notice || duplicates.length > 0) && (
          <div className="mx-auto w-full max-w-[1600px] space-y-1 px-6 pt-3 text-sm">
            {saved.error && (
              <p className="flex items-start gap-2 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {saved.error}
              </p>
            )}
            {duplicates.length > 0 && (
              <p className="flex items-start gap-2 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Rule names must be unique; used more than once: {duplicates.join(", ")}
              </p>
            )}
            {notice && (
              <p className={`flex items-start gap-2 ${notice.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {notice.tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {notice.text}
              </p>
            )}
          </div>
        )}

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 gap-4 px-6 py-4">
          <nav aria-label="Rules" className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rules ({rules.length})
              </span>
              <button type="button" onClick={addRule} disabled={!document} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {rules.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                The model declares no rules. Add one, or describe one to the assistant below.
              </p>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {rules.map((rule) => (
                  <li key={rule.key} className={`group flex items-center border-b border-border ${rule.key === selected ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                    <button type="button" onClick={() => setSelected(rule.key)} className="min-w-0 flex-1 px-3 py-2 text-left">
                      <p className="truncate text-sm font-medium">{rule.title ?? rule.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {rule.entity || "no entity"} · {rule.event} · {rule.kind}
                      </p>
                    </button>
                    <button type="button" onClick={() => removeRule(rule.key)} aria-label={`Remove ${rule.name}`} className="mr-2 rounded p-1 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          <section className="min-w-0 flex-1 rounded-lg border border-border bg-card p-4">
            {current ? (
              <>
                <RuleEditor
                  rule={current}
                  entities={entities}
                  onChange={(patch) => update(current.key, patch)}
                  onShowGraph={(rule) => setGraphFor(rule.source?.name ?? rule.name)}
                />
                {current.kind === "graph" && graphFor === (current.source?.name ?? current.name) && (
                  <ModelViewer
                    key={graphFor}
                    value={savedModel}
                    initialView={`rule:${graphFor}`}
                    className="mt-4 h-[520px]"
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a rule, or add one.</p>
            )}

            {findings.length > 0 && (
              <div className="mt-4 rounded-lg border border-border">
                <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model findings ({errors.length} error{errors.length === 1 ? "" : "s"}, {findings.length - errors.length} other)
                </p>
                <ul className="max-h-48 overflow-y-auto text-xs">
                  {findings.map((f) => (
                    <li key={`${f.line}:${f.column}:${f.code}`} className={`px-3 py-1.5 ${f.severity === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                      <span className="font-mono">
                        {f.line}:{f.column} {f.code}
                      </span>{" "}
                      {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </main>

        <footer className="border-t border-border bg-background">
          <div className="mx-auto max-w-[1600px] px-6 py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void runAssistant();
                }}
                disabled={assistant.running || !savedModel.trim()}
                placeholder={
                  savedModel.trim()
                    ? "Describe a rule — e.g. refuse a sample whose expiry date has passed… (Ctrl+Enter)"
                    : "Save a model on the design step first"
                }
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm"
              />
              <button type="button" onClick={() => void runAssistant()} disabled={assistant.running || !prompt.trim() || !savedModel.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {assistant.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {assistant.running ? "Working…" : "Write rules"}
              </button>
            </div>
            {dirty && !assistant.running && (
              <p className="mt-2 text-xs text-muted-foreground">
                The assistant works from the saved model; unsaved edits here are replaced by its answer.
              </p>
            )}
            {assistant.message && (
              <p className={`mt-2 text-sm ${assistant.error ? "text-destructive" : "text-muted-foreground"}`}>{assistant.message}</p>
            )}
          </div>
        </footer>
      </div>
    </CopilotSidebar>
  );
}
