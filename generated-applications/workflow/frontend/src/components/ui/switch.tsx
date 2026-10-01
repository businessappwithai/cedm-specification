/**
 * Switch — shadcn surface over Astryx `Switch`.
 *
 * shadcn (Radix) uses `checked` / `onCheckedChange`; Astryx uses `value` and
 * `onChange(checked, event)`. Both spellings are accepted.
 */
import type { ChangeEvent } from "react";
import { Switch as AstryxSwitch } from "@astryxdesign/core/Switch";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked,
  defaultChecked,
  disabled,
  className,
  id,
  name,
  "aria-label": ariaLabel,
  onCheckedChange,
}: SwitchProps) {
  return (
    <AstryxSwitch
      label={ariaLabel ?? name ?? id ?? "Toggle"}
      value={checked ?? defaultChecked ?? false}
      isDisabled={disabled}
      isLabelHidden
      className={className}
      id={id}
      htmlName={name}
      onChange={(next: boolean, _event: ChangeEvent<HTMLInputElement>) => onCheckedChange?.(next)}
    />
  );
}

export default Switch;
