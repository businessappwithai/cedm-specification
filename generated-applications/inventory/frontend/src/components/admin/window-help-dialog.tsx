import { HelpCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useEntityMetadata, useWindowHelp } from "@/hooks/use-entities";
import { Box, HStack, Heading, Text, VStack } from "@/components/ui/layout";

/**
 * The physical table an endpoint is served from, asked of the dictionary.
 *
 * The endpoint carries the *route* segment, which is not the table name: it
 * has no `bus_` prefix, and under the catch-all `$entity` route it is whatever
 * the URL said — `/api/bus/*` resolves plurals and aliases through the
 * dictionary, so `/bus/companies` is a working endpoint whose table is
 * `bus_company`.
 *
 * A screen that needs the table name for anything matched *literally* — a
 * `filter.table_name=` on `sys_report_designs`, say — therefore cannot derive
 * it from the endpoint, and gets an empty result rather than an error when it
 * tries. Asking `/bus/{route}/meta` is the dictionary's own answer, and it is
 * keyed like every other metadata read, so a screen already holding it pays
 * nothing.
 *
 * Anything not served from `/bus/` — the admin windows on `/sys/` — has no
 * business window to describe, so it resolves to an empty name and the dialog
 * hides itself.
 */
export function useBusTableName(endpoint: string): string {
  const route = /^\/bus\/([^/?]+)/.exec(endpoint)?.[1] ?? "";
  const { data } = useEntityMetadata(route, !!route);
  return data?.tableName ?? "";
}

/**
 * The Help button and screen for a window.
 *
 * Text comes from the Application Dictionary (sys_window.help, sys_tab.help and
 * sys_field.help), so administrators can rewrite any of it from Window, Tab and
 * Field without touching this component. The button hides itself when the
 * window has no help at all rather than opening an empty dialog.
 */
export function WindowHelpDialog({
  tableName,
  entityLabel,
}: {
  tableName: string;
  entityLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: helpData } = useWindowHelp(tableName);

  const windowHelp = helpData?.window;
  const tabs = (helpData?.tabs ?? []).filter((t) => t.help);
  const fields = (helpData?.fields ?? []).filter((f) => f.help);
  const hasHelp = !!windowHelp?.help || tabs.length > 0 || fields.length > 0;

  // Esc closes, matching every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!hasHelp) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Help for ${entityLabel}`}
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
        title={`Help for ${entityLabel}`}
      >
        <HelpCircle size={14} />
        Help
      </button>

      {open && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent max-w-none max-h-none w-full h-full"
          aria-modal="true"
          aria-label={`${entityLabel} help`}
        >
          <button
            type="button"
            aria-label="Close help"
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <VStack fullWidth className="relative z-10 max-w-2xl rounded-xl border border-border bg-background shadow-2xl max-h-[80vh]">
            <HStack align="center" justify="between" paddingInline={6} paddingBlock={4} className="border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
              <HStack align="center" gap={2}>
                <HelpCircle className="w-5 h-5 text-primary" />
                <Heading level={2} color="primary">{entityLabel} — Help</Heading>
              </HStack>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </HStack>

            <Box padding={6} scrollable className="space-y-6">
              {windowHelp?.help && (
                <section>
                  <Heading level={3} uppercase color="accent" className="mb-2">
                    Window Overview
                  </Heading>
                  <Text size="sm" color="primary" block className="leading-relaxed whitespace-pre-wrap">
                    {windowHelp.help}
                  </Text>
                </section>
              )}

              {tabs.length > 0 && (
                <section className="space-y-3">
                  <Heading level={3} uppercase color="accent">
                    Tabs
                  </Heading>
                  {tabs.map((tab) => (
                    <div
                      key={tab.sys_tab_id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-3"
                    >
                      <Text size="xs" weight="semibold" color="primary" block className="mb-1">{tab.name}</Text>
                      <Text size="xs" color="secondary" block className="leading-relaxed whitespace-pre-wrap">
                        {tab.help}
                      </Text>
                    </div>
                  ))}
                </section>
              )}

              {fields.length > 0 && (
                <section className="space-y-2">
                  <Heading level={3} uppercase color="accent">
                    Fields{" "}
                    <Text weight="normal" color="secondary" className="normal-case tracking-normal">
                      ({fields.length})
                    </Text>
                  </Heading>
                  <dl className="divide-y divide-border/60 rounded-lg border border-border/60 overflow-hidden">
                    {fields.map((field) => (
                      <div
                        key={field.sys_field_id}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 p-3 odd:bg-muted/20"
                      >
                        <dt className="text-xs font-semibold text-foreground flex items-start gap-1">
                          <span>{field.name}</span>
                          {field.is_mandatory && (
                            <Text color="danger" title="Required">
                              *
                            </Text>
                          )}
                        </dt>
                        <dd className="sm:col-span-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {field.help}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </Box>
          </VStack>
        </dialog>
      )}
    </>
  );
}
