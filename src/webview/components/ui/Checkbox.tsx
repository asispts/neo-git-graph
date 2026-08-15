import type { ComponentProps } from "preact";

import { Icon } from "./Icons";

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
        <Icon class="pointer-events-none absolute size-3.5 text-checkbox-check opacity-0 peer-checked:opacity-100">
          <path d="M14.431 3.323L5.961 11.793L1.568 7.400L2.280 6.688L5.961 10.369L13.719 2.611L14.431 3.323Z" />
        </Icon>
      </span>
      {label}
    </label>
  );
}
