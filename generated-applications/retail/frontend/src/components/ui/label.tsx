/**
 * Label — plain `<label>`, deliberately not Astryx `Field`.
 *
 * Astryx's `Field` owns label, required marker, help text and error state
 * together, and the input adapters already pass their own (hidden) label to
 * the underlying Astryx control. Mapping this component onto `Field` as well
 * would nest two labelled wrappers around every input and announce the label
 * twice to screen readers.
 *
 * So this stays a bare `<label>` through Phase B. Phase C is where
 * `dynamic-form.tsx` moves to `Field` properly and both this component and the
 * hidden labels in the input adapters go away — that is the rebuild §7.5 calls
 * for, not a rename.
 */
import type { ReactNode } from "react";

export interface LabelProps {
  children?: ReactNode;
  /** Native tooltip text; several admin forms use it for field hints. */
  title?: string;
  htmlFor?: string;
  className?: string;
}

export function Label({ children, htmlFor, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}

export default Label;
