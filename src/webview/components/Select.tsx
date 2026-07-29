import type { ComponentProps } from "preact";

import { ChevronDownIcon } from "@/webview/components/Icons";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = Omit<ComponentProps<"select">, "class" | "children"> & {
  label: string;
  options: SelectOption[];
};

export function Select({ label, options, ...props }: SelectProps) {
  return (
    <label class="flex items-center gap-2">
      {label}
      <span class="relative flex-1">
        <select
          class="w-full cursor-pointer appearance-none rounded-md bg-dropdown py-1 pl-3 pr-8 text-dropdown-fg outline-1 outline-dropdown-border"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} class="bg-dropdown text-dropdown-fg">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
      </span>
    </label>
  );
}
