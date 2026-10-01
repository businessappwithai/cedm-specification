/**
 * Toast — shadcn surface over Astryx `ToastViewport` / `useToast`.
 *
 * The shapes disagree in one structural way. shadcn exposes a module-level
 * `toast(...)` callable from anywhere — a mutation's `onError`, a route loader,
 * a plain async helper — while Astryx exposes `useToast()`, a hook, which only
 * a component can call. Bridging that needs a queue: `toast(...)` pushes onto
 * it, and a component mounted inside `<Toaster>` drains it through the hook.
 *
 * The shadcn implementation this replaces did the same thing with a `Map` and
 * `window` CustomEvents. This uses a subscriber list instead, which works
 * under SSR and in tests where `window` may not exist, and drops the globals.
 *
 * Toasts fired before `<Toaster>` mounts are buffered and flushed on
 * subscribe — the case that matters is an error thrown during initial data
 * loading, which is exactly when a dropped toast is least acceptable.
 *
 * **One deliberate loss.** Astryx has two toast types, `info` and `error`.
 * shadcn had five variants. `destructive` maps to `error` and the rest to
 * `info`, so success and warning would become indistinguishable — a "saved"
 * and a "check this before continuing" rendering identically is worse than
 * ugly. The variant's icon is therefore prepended to the body, which keeps
 * them apart without inventing a toast type Astryx does not have.
 */
import { useEffect, type ReactNode } from "react";
import { ToastViewport, useToast, type ToastOptions } from "@astryxdesign/core/Toast";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface ToastProps {
  title?: string;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Correlation id surfaced with server errors so a user can quote it. */
  referenceId?: string;
  duration?: number;
}

/** Astryx's semantic icon names, per shadcn variant. */
const VARIANT_ICON = {
  default: null,
  destructive: "error",
  success: "success",
  warning: "warning",
  info: "info",
} as const;

/** Astryx's `error` is its only non-neutral type. */
function astryxType(variant: ToastVariant): "info" | "error" {
  return variant === "destructive" ? "error" : "info";
}

function ToastBody({ title, description, variant = "default", referenceId }: ToastProps) {
  const icon = VARIANT_ICON[variant];
  // Astryx's gap is a numeric step, not a t-shirt size; 2 is 0.5rem.
  return (
    <HStack gap={2} vAlign="start">
      {icon ? <Icon icon={icon} size="sm" /> : null}
      <div>
        {title ? (
          <Text weight="medium" display="block">
            {title}
          </Text>
        ) : null}
        {description ? <Text size="sm">{description}</Text> : null}
        {referenceId ? (
          <Text size="xsm" color="secondary" display="block">
            Reference: {referenceId}
          </Text>
        ) : null}
      </div>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// The queue that lets `toast()` be called outside React
// ---------------------------------------------------------------------------

type Subscriber = (options: ToastOptions) => void;

let subscriber: Subscriber | null = null;
/** Toasts fired before `<Toaster>` mounted. Flushed on subscribe. */
const buffered: ToastOptions[] = [];

function emit(options: ToastOptions) {
  if (subscriber) {
    subscriber(options);
  } else {
    buffered.push(options);
  }
}

export interface ToastFunction {
  (props: ToastProps): void;
  success: (description: ReactNode, options?: Omit<ToastProps, "description" | "variant">) => void;
  error: (description: ReactNode, options?: Omit<ToastProps, "description" | "variant">) => void;
  warning: (description: ReactNode, options?: Omit<ToastProps, "description" | "variant">) => void;
  info: (description: ReactNode, options?: Omit<ToastProps, "description" | "variant">) => void;
}

function show(props: ToastProps) {
  emit({
    body: <ToastBody {...props} />,
    type: astryxType(props.variant ?? "default"),
    isAutoHide: true,
    autoHideDuration: props.duration ?? 5000,
  });
}

export const toast = show as ToastFunction;

toast.success = (description, options) => show({ title: "Success", ...options, description, variant: "success" });
toast.error = (description, options) => show({ title: "Error", ...options, description, variant: "destructive" });
toast.warning = (description, options) => show({ title: "Warning", ...options, description, variant: "warning" });
toast.info = (description, options) => show({ title: "Info", ...options, description, variant: "info" });

/** Drains the queue through the hook. Rendered inside `ToastViewport`. */
function ToastBridge() {
  const showToast = useToast();

  useEffect(() => {
    subscriber = (options) => {
      showToast(options);
    };
    // Anything fired before mount lands now, in the order it was raised.
    while (buffered.length > 0) {
      const next = buffered.shift();
      if (next) showToast(next);
    }
    return () => {
      subscriber = null;
    };
  }, [showToast]);

  return null;
}

/**
 * Mount once, near the root. Astryx's viewport owns positioning, stacking,
 * the exit animation and focus handling, so there is nothing to configure
 * beyond where it sits.
 */
export function Toaster() {
  return (
    <ToastViewport position="bottomEnd">
      <ToastBridge />
    </ToastViewport>
  );
}

/**
 * A single toast, for the rare call site that renders one itself rather than
 * going through `toast()`. Astryx's `Toast` requires viewport-managed
 * lifecycle props, so this renders the body only — the same content, without
 * claiming to manage a dismissal it is not wired to.
 */
export function Toast(props: ToastProps) {
  return <ToastBody {...props} />;
}

export default toast;
