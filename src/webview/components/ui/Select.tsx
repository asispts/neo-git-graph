type SelectProps = {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
};

/**
 * A short list of options, for a dialog form. `Dropdown` carries a filter,
 * keyboard search and scroll logic that two or three options do not want.
 */
export function Select({ options, value, onChange, id, "aria-label": label }: SelectProps) {
  return (
    <select
      id={id}
      aria-label={label}
      class="w-full cursor-pointer rounded-sm bg-dropdown px-2 py-1 text-dropdown-fg outline-1 outline-dropdown-border focus:outline-focus"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option.value} class="bg-dropdown text-dropdown-fg" value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
