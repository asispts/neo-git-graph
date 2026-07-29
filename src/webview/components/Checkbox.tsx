import type { ComponentProps } from "preact";

import { CheckIcon } from "@/webview/components/Icons";

type CheckboxProps = Omit<ComponentProps<"input">, "class" | "type" | "children"> & {
  label: string;
};

export function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <label class="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <span class="relative flex size-4 items-center justify-center">
        <input
          type="checkbox"
          class="peer size-4 cursor-pointer appearance-none rounded-sm bg-checkbox outline-1 outline-checkbox-border checked:bg-checkbox-checked checked:outline-checkbox-checked focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:cursor-not-allowed"
          {...props}
        />
        <CheckIcon class="pointer-events-none absolute size-3.5 text-checkbox-check opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  );
}
