/**
 * Textarea — shadcn surface over Astryx `TextArea`.
 *
 * Same controlled/uncontrolled and `onChange` bridging as `Input`; see that
 * file for why the label fallback exists.
 */
import type { ChangeEvent } from "react";
import { TextArea } from "@astryxdesign/core/TextArea";

export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
}

export function Textarea({
  value,
  defaultValue,
  placeholder,
  disabled,
  readOnly,
  rows,
  className,
  id,
  name,
  "aria-label": ariaLabel,
  onChange,
  onBlur,
}: TextareaProps) {
  return (
    <TextArea
      label={ariaLabel ?? placeholder ?? name ?? id ?? "Value"}
      value={value ?? defaultValue ?? ""}
      placeholder={placeholder}
      isLabelHidden
      isDisabled={disabled || readOnly}
      rows={rows}
      className={className}
      id={id}
      htmlName={name}
      onChange={(_next: string, event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event)}
      onBlur={onBlur}
    />
  );
}

export default Textarea;
