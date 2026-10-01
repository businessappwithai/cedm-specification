/**
 * Checkbox — shadcn surface over Astryx `CheckboxInput`.
 *
 * Radix models the tri-state as `checked: boolean | "indeterminate"`; Astryx
 * spells the same thing `value: boolean | "indeterminate"`, so the tri-state
 * survives the swap intact.
 */
import type { ChangeEvent } from "react";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";

export interface CheckboxProps {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  checked,
  defaultChecked,
  disabled,
  required,
  className,
  id,
  name,
  "aria-label": ariaLabel,
  onCheckedChange,
}: CheckboxProps) {
  return (
    <CheckboxInput
      label={ariaLabel ?? name ?? id ?? "Select"}
      isLabelHidden
      value={checked ?? defaultChecked ?? false}
      isDisabled={disabled}
      isRequired={required}
      className={className}
      id={id}
      htmlName={name}
      onChange={(next: boolean, _event: ChangeEvent<HTMLInputElement>) => onCheckedChange?.(next)}
    />
  );
}

export default Checkbox;
