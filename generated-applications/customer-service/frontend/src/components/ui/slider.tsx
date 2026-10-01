/**
 * Slider — shadcn surface over Astryx `Slider`.
 *
 * shadcn's slider takes `value` as an array (Radix's shape, which supports any
 * number of thumbs) and reports changes through `onValueChange`. Astryx has two
 * typed modes: a single `number`, or a `[number, number]` range. The array
 * length picks the mode, which covers everything the shadcn surface can
 * actually express — three or more thumbs is a Radix capability the generated
 * app has no call site for.
 *
 * `label` is required by Astryx and has no shadcn equivalent, because Radix
 * expects an adjacent `<Label>` element. Call sites that supply one get it
 * visually hidden here rather than rendered twice; those that do not get a
 * generic accessible name, which is still better than the unlabelled range
 * input shadcn produced.
 */
import { Slider as AstryxSlider } from "@astryxdesign/core/Slider";

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  /**
   * Accessible name. Supply it when the call site has no visible `<Label>`;
   * when it does, pass the same text — the label is hidden here, not repeated.
   */
  label?: string;
}

export function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  label = "Value",
}: SliderProps) {
  const current = value ?? defaultValue ?? [min];

  if (current.length >= 2) {
    return (
      <AstryxSlider
        className={className}
        label={label}
        isLabelHidden
        min={min}
        max={max}
        step={step}
        isDisabled={disabled}
        value={[current[0] ?? min, current[1] ?? max]}
        onChange={(next: [number, number]) => onValueChange?.([next[0], next[1]])}
      />
    );
  }

  return (
    <AstryxSlider
      className={className}
      label={label}
      isLabelHidden
      min={min}
      max={max}
      step={step}
      isDisabled={disabled}
      value={current[0] ?? min}
      onChange={(next: number) => onValueChange?.([next])}
    />
  );
}

export default Slider;
