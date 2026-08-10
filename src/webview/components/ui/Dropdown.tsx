import { useEffect, useId, useRef, useState } from "preact/hooks";

import { Icon } from "./Icons";

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  label: string;
  options: Array<DropdownOption>;
  value: string | undefined;
  onChange: (value: string) => void;
  class?: string;
};

export function Dropdown({ label, options, value, onChange, class: className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const listId = `${id}-list`;

  const selected = options.find((option) => option.value === value);
  const matches = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );
  const active = Math.min(activeIndex, matches.length - 1);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setActiveIndex(
      Math.max(
        options.findIndex((option) => option.value === value),
        0
      )
    );
    setOpen(true);
  }

  function select(option: DropdownOption | undefined) {
    if (option === undefined) {
      return;
    }

    close();
    if (option.value !== value) {
      onChange(option.value);
    }
  }

  function move(step: number) {
    if (matches.length === 0) {
      return;
    }
    setActiveIndex((active + step + matches.length) % matches.length);
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      toggle();
    }
  }

  function onFilterKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(matches.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        select(matches[active]);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} class="flex min-w-0 items-center gap-2">
      <span id={labelId}>{label}:</span>
      <div class="relative min-w-0">
        <button
          ref={triggerRef}
          type="button"
          class={`flex w-full cursor-pointer items-center gap-1 rounded-md bg-dropdown py-1 pl-3 pr-2 text-dropdown-fg outline-1 outline-dropdown-border focus-visible:outline-2 focus-visible:outline-focus ${className ?? ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${labelId} ${valueId}`}
          title={selected?.value}
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
        >
          <span id={valueId} class="min-w-0 flex-1 truncate text-left">
            {selected?.label}
          </span>
          <Icon class="shrink-0">
            <path d="M7.976 10.072L12.333 5.715L12.953 6.333L8.284 11H7.666L3 6.333L3.619 5.715L7.976 10.072Z" />
          </Icon>
        </button>
        {open && (
          <div class="absolute right-0 top-full z-10 mt-1 flex max-h-72 w-max min-w-full max-w-96 flex-col rounded-md border border-line bg-menu text-menu-fg shadow-md">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              class="m-1 rounded-sm bg-input px-2 py-1 text-input-fg outline-1 outline-line focus:outline-focus"
              placeholder={window.l10n.filterPlaceholder.replace("{0}", label)}
              value={query}
              aria-expanded={true}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={matches.length > 0 ? `${id}-option-${active}` : undefined}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setActiveIndex(0);
              }}
              onKeyDown={onFilterKeyDown}
            />
            {matches.length === 0 ? (
              <div class="px-3 py-1 italic">{window.l10n.noResultsFound}</div>
            ) : (
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={labelId}
                class="min-h-0 overflow-y-auto py-1"
              >
                {matches.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    data-active={index === active}
                    title={option.value === option.label ? undefined : option.value}
                    class={`cursor-pointer truncate px-3 py-1 ${
                      index === active
                        ? "bg-menu-active text-menu-active-fg"
                        : option.value === value
                          ? "bg-btn-hover"
                          : ""
                    }`}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => select(option)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
