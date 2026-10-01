"use client";

/**
 * Help, and the only shape it takes.
 *
 * Every piece of help in this platform — the article library, a field's
 * syntax reference — arrives as one toaster pinned to the top right, opened by
 * a `?` button and closed by its own close button. Nothing else shows help: no
 * centred modal over the query you were reading, no tooltip that needs a
 * pointer and a hover.
 *
 * **This is deliberately the same contract the generated application uses**
 * (`components/help/help-toaster.tsx` in `app-with-ai-tanstack`'s templates).
 * A reader who meets both — and the two are composed side by side on `/app` and
 * `/report`, and the generated application's dashboard links straight into this
 * one — should not have to learn two ways to ask for help. Change one and
 * change the other.
 *
 * Three properties are the whole contract, and each replaced something that
 * used to be true here:
 *
 * 1. **It does not dismiss itself.** No timeout, no click-outside, no Escape.
 *    The help was a Radix `Dialog`, so all three closed it — including the
 *    click into the SQL editor whose syntax you had just looked up.
 * 2. **It never covers the page.** No backdrop and no focus trap, so the query,
 *    the report or the chart stays visible and editable with the help open
 *    beside it. The dialog was `max-w-5xl h-[85vh]`: it covered essentially
 *    everything.
 * 3. **There is one of it.** Opening a second topic replaces the first rather
 *    than stacking, because a tower of panels down the right edge of the screen
 *    is the thing a toaster is supposed to avoid.
 */

import { HelpCircle, X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface HelpTopic {
  /**
   * Identifies the topic so pressing the same `?` twice is a no-op rather than
   * a flicker. Two buttons describing the same thing share a key.
   */
  key: string;
  title: string;
  /** Rendered inside the scrolling body. */
  body: ReactNode;
}

interface HelpContextValue {
  topic: HelpTopic | null;
  showHelp: (topic: HelpTopic) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

/**
 * Outside a `HelpProvider` the hook returns a working no-op rather than
 * throwing. A `?` button is not worth crashing a screen over, and the
 * unauthenticated screens render outside the provider on purpose.
 */
const NO_HELP: HelpContextValue = {
  topic: null,
  showHelp: () => {},
  closeHelp: () => {},
};

export function useHelp(): HelpContextValue {
  return useContext(HelpContext) ?? NO_HELP;
}

export function HelpProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<HelpTopic | null>(null);

  const showHelp = useCallback((next: HelpTopic) => setTopic(next), []);
  const closeHelp = useCallback(() => setTopic(null), []);

  const value = useMemo(() => ({ topic, showHelp, closeHelp }), [topic, showHelp, closeHelp]);

  return (
    <HelpContext.Provider value={value}>
      {children}
      <HelpToaster />
    </HelpContext.Provider>
  );
}

/**
 * The toaster itself. Rendered once, by the provider — a screen never places
 * it, so no screen can put help anywhere else.
 */
function HelpToaster() {
  const { topic, closeHelp } = useHelp();
  if (!topic) return null;

  return (
    <div
      // `aria-live` rather than `role="dialog"`: this is not modal, the page
      // behind it stays usable, and announcing it without stealing focus is
      // the behaviour that matches what it looks like.
      aria-live="polite"
      // `top-20` rather than `top-4`, and the number is the header's height.
      // The header's right-hand end holds the theme selector, this `?`, the
      // notification bell and the account menu — at `top-4` the panel would sit
      // over them, so the one surface whose point is that the application stays
      // usable behind it would be the thing making four of its controls
      // unclickable.
      className="fixed right-4 top-20 z-[70] flex max-h-[calc(100vh-6rem)] w-[min(26rem,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <HelpCircle className="h-4 w-4 flex-shrink-0 text-primary" />
          <h2 className="truncate text-sm font-semibold">{topic.title}</h2>
        </div>
        <button
          type="button"
          onClick={closeHelp}
          aria-label="Close help"
          title="Close help"
          className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        {topic.body}
      </div>
    </div>
  );
}

/**
 * The `?` button. The only thing in the platform that opens help.
 *
 * It is deliberately the same control everywhere — in the header, beside a
 * field — so that "press the question mark" is true of every screen.
 */
export function HelpTopicButton({
  topic,
  label,
  className,
  size = "sm",
}: {
  topic: HelpTopic;
  /** For the accessible name: "Help for Cron expression". */
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { showHelp } = useHelp();
  return (
    <button
      type="button"
      onClick={() => showHelp(topic)}
      aria-label={`Help for ${label}`}
      title={`Help for ${label}`}
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        size === "sm" ? "h-4 w-4" : "h-7 w-7",
        className
      )}
    >
      <HelpCircle className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

/** Plain help text, kept readable when an author wrote paragraphs. */
export function HelpText({ children }: { children: ReactNode }) {
  return <p className="whitespace-pre-wrap leading-relaxed">{children}</p>;
}

/** A labelled block inside the body. */
export function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary">{title}</h3>
      {children}
    </section>
  );
}
