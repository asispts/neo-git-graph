import type { ComponentProps } from "preact";

import { Icon } from "./Icons";

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
        <Icon class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <path d="M7.976 10.072L12.333 5.715L12.953 6.333L8.284 11H7.666L3 6.333L3.619 5.715L7.976 10.072Z" />
        </Icon>
      </span>
    </label>
  );
}
