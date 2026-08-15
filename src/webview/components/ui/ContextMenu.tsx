import { useEffect, useId, useLayoutEffect, useRef, useState } from "preact/hooks";

import { closeContextMenu } from "@/webview/lib/actions";
import { contextMenu } from "@/webview/lib/stores";
import type { ContextMenuEntry, ContextMenuState } from "@/webview/types";

/** Pull the menu under the pointer, so the first item is already hovered. */
const POINTER_OVERLAP = 2;

function run(entry: NonNullable<ContextMenuEntry>) {
  closeContextMenu();
  entry.onClick();
}

/** Pairs each entry with its position among the clickable items. Dividers get -1. */
function numberItems(entries: ContextMenuState["entries"]) {
  let item = -1;
  const rows = entries.map((entry) => {
    if (entry === null) {
      return { entry, item: -1 };
    }
    item += 1;
    return { entry, item };
  });

  return { rows, count: item + 1 };
}

function Menu({ state }: { state: ContextMenuState }) {
  const ref = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [active, setActive] = useState(-1);

  const id = useId();
  const { rows, count } = numberItems(state.entries);

  useLayoutEffect(() => {
    const menu = ref.current;
    if (menu === null) {
      return;
    }

    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(
        0,
        state.x + width < window.innerWidth
          ? state.x - POINTER_OVERLAP
          : state.x - width + POINTER_OVERLAP
      ),
      top: Math.max(
        0,
        state.y + height < window.innerHeight
          ? state.y - POINTER_OVERLAP
          : state.y - height + POINTER_OVERLAP
      )
    });
    menu.focus();
  }, [state]);

  useEffect(() => {
    const dismissOutside = (event: Event) => {
      if (!ref.current?.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    const dismiss = () => closeContextMenu();

    document.addEventListener("pointerdown", dismissOutside, true);
    document.addEventListener("contextmenu", dismissOutside, true);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);

    return () => {
      document.removeEventListener("pointerdown", dismissOutside, true);
      document.removeEventListener("contextmenu", dismissOutside, true);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, []);

  function move(step: number) {
    setActive((current) => (current + step + count) % count);
  }

  function onKeyDown(event: KeyboardEvent) {
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
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(count - 1);
        break;
      case "Enter":
      case " ": {
        const entry = rows.find((row) => row.item === active)?.entry;
        if (entry !== undefined && entry !== null) {
          event.preventDefault();
          run(entry);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        closeContextMenu();
        break;
    }
  }

  return (
    <ul
      ref={ref}
      role="menu"
      tabIndex={-1}
      aria-activedescendant={active === -1 ? undefined : `${id}-item-${active}`}
      class="fixed z-20 w-max rounded-md border border-line bg-menu py-1 text-menu-fg shadow-md outline-none"
      style={
        position === null
          ? "opacity: 0; left: 0; top: 0"
          : `left: ${position.left}px; top: ${position.top}px`
      }
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {rows.map(({ entry, item }, index) =>
        entry === null ? (
          <li key={`divider-${index}`} role="separator" class="mx-2.5 my-1 border-t border-line" />
        ) : (
          <li
            key={entry.title}
            id={`${id}-item-${item}`}
            role="menuitem"
            class={`cursor-pointer whitespace-nowrap px-5 py-1.5 ${
              item === active ? "bg-menu-active text-menu-active-fg" : ""
            }`}
            onPointerMove={() => setActive(item)}
            onClick={() => run(entry)}
          >
            {entry.title}
          </li>
        )
      )}
    </ul>
  );
}

export function ContextMenu() {
  const state = contextMenu.value;
  if (state === null) {
    return null;
  }

  return <Menu key={`${state.source}-${state.x}-${state.y}`} state={state} />;
}
