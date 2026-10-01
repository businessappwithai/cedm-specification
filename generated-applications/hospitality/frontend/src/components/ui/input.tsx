/**
 * Input — shadcn surface over Astryx `TextInput` / `NumberInput`.
 *
 * The gap here is the widest of any primitive. shadcn's `Input` is a thin
 * wrapper over `<input>`: uncontrolled by default, `onChange(event)`, no label.
 * Astryx's `TextInput` is a controlled field: `value` and `label` are required
 * and `onChange` receives `(value, event)`.
 *
 * This adapter bridges both directions so `dynamic-form.tsx` and the admin
 * editors keep working unchanged:
 *
 *  * `value ?? defaultValue ?? ""` — an uncontrolled call site still renders.
 *  * `onChange` is re-wrapped so callers reading `e.target.value` still work.
 *  * `label` falls back to `aria-label` or `placeholder`, because Astryx
 *    requires a non-empty label for accessibility and silently rendering an
 *    empty one would defeat that.
 */
import type { ChangeEvent } from "react";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { TextInput } from "@astryxdesign/core/TextInput";

export interface InputProps {
  type?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  /**
   * Native attributes the login and admin forms set. `NumberInput` declares
   * `autoComplete` and `step` explicitly; `TextInput` spreads its rest props
   * onto the `<input>`, so the rest arrive the same way they did under shadcn.
   * Autofocus is Astryx's `hasAutoFocus`, translated below.
   */
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  step?: number;
}

/**
 * `autoComplete` and `maxLength` for the text input.
 *
 * `TextInputProps` does not declare them — Astryx types its own props and
 * leaves the native surface to the rest spread, which does reach the `<input>`.
 * Bridging it here keeps a browser-filled password field and a length-capped
 * code field working, which is what those two attributes are actually for.
 * `NumberInput` declares `autoComplete` itself, so this is the text path only.
 */
function nativeAttrs(autoComplete?: string, maxLength?: number): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  if (autoComplete !== undefined) attrs.autoComplete = autoComplete;
  if (maxLength !== undefined) attrs.maxLength = maxLength;
  return attrs;
}

/** A controlled number field's value: a number, or `null` for empty. */
export function toNumberOrNull(current: string | number | null | undefined): number | null {
  if (typeof current === "number") return Number.isNaN(current) ? null : current;
  if (current === null || current === undefined || current.trim() === "") return null;
  const parsed = Number(current);
  return Number.isNaN(parsed) ? null : parsed;
}

export function Input({
  type = "text",
  value,
  defaultValue,
  placeholder,
  disabled,
  readOnly,
  required,
  className,
  id,
  name,
  "aria-label": ariaLabel,
  onChange,
  onBlur,
  autoComplete,
  autoFocus,
  maxLength,
  step,
}: InputProps) {
  const label = ariaLabel ?? placeholder ?? name ?? id ?? "Value";
  const current = value ?? defaultValue ?? "";

  if (type === "number") {
    return (
      <NumberInput
        label={label}
        isLabelHidden
        // Empty is `null`, which Astryx renders as an empty field. It used to
        // be coerced to 0, so an unset field displayed a 0 the form did not
        // hold, and a keystroke that the form rejected snapped back to it.
        value={toNumberOrNull(current)}
        placeholder={placeholder}
        isDisabled={disabled || readOnly}
        isRequired={required}
        className={className}
        id={id}
        htmlName={name}
        autoComplete={autoComplete}
        hasAutoFocus={autoFocus}
        step={step}
        // Astryx's NumberInput reports only the parsed value, with no DOM
        // event. Call sites read `e.target.value`, so a minimal event-shaped
        // object carrying the same string is synthesised rather than dropping
        // the callback. Anything reading further into the event (currentTarget,
        // key modifiers) would need the real thing — no generated call site
        // does, and Phase C removes this shim entirely.
        //
        // `valueAsNumber` is part of that shape, not an extra: `dynamic-form`
        // reads it for every integer and amount field. Without it the read was
        // `undefined`, which is not NaN, so the form stored `undefined` and
        // JSON.stringify dropped the field — every number typed into a create
        // or edit form was silently discarded.
        onChange={(next: number | null) =>
          onChange?.({
            target: {
              value: next === null ? "" : String(next),
              valueAsNumber: next === null ? Number.NaN : next,
              name: name ?? "",
            },
          } as ChangeEvent<HTMLInputElement>)
        }
        onBlur={onBlur}
      />
    );
  }

  return (
    <TextInput
      label={label}
      // Call sites render their own <Label>; keeping Astryx's label in the
      // accessibility tree but out of the layout avoids showing it twice.
      isLabelHidden
      type={type as never}
      value={String(current)}
      placeholder={placeholder}
      isDisabled={disabled || readOnly}
      isRequired={required}
      className={className}
      id={id}
      htmlName={name}
      hasAutoFocus={autoFocus}
      {...nativeAttrs(autoComplete, maxLength)}
      onChange={(_next: string, event: ChangeEvent<HTMLInputElement>) => onChange?.(event)}
      onBlur={onBlur}
    />
  );
}

export default Input;
