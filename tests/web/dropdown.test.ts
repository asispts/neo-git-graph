// @vitest-environment happy-dom

/**
 * Integration tests for the Dropdown branch-selection feature.
 *
 * These tests drive the component through real DOM events (click, keyup) and
 * assert the observable outcomes a user would see: current-value label,
 * change callback, option filtering, and "no results" feedback.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { Dropdown } from "../../web/dropdown";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BRANCHES = [
  { name: "Show All", value: "" },
  { name: "main", value: "main" },
  { name: "feature/login", value: "feature/login" },
  { name: "feature/signup", value: "feature/signup" },
  { name: "bugfix/crash", value: "bugfix/crash" }
];

let idSeq = 0;

/**
 * Mount a Dropdown into a fresh container and return it together with the
 * container id so tests can query child elements.
 *
 * The container gets the `dropdown` class that the component uses internally
 * via `closest(".dropdown")` to distinguish inside-vs-outside clicks.
 */
function mount(onChange: (value: string) => void = () => {}): {
  dropdown: Dropdown;
  id: string;
} {
  const id = `dd-${++idSeq}`;
  const container = document.createElement("div");
  container.id = id;
  container.className = "dropdown";
  document.body.appendChild(container);
  const dropdown = new Dropdown(id, false, "Branches", onChange);
  return { dropdown, id };
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Dropdown — branch selection feature", () => {
  it("shows the initially selected branch as the current value", () => {
    const { dropdown, id } = mount();
    dropdown.setOptions(BRANCHES, "main");

    const label = document.querySelector<HTMLElement>(`#${id} .dropdownCurrentValue`)!;
    expect(label.textContent).toBe("main");
  });

  it("fires the change callback with the value of the clicked option", () => {
    const onChange = vi.fn();
    const { dropdown, id } = mount(onChange);
    dropdown.setOptions(BRANCHES, ""); // start on "Show All"

    // Open the dropdown by clicking the current-value label
    const label = document.querySelector<HTMLElement>(`#${id} .dropdownCurrentValue`)!;
    click(label);

    // Click the "main" option (index 1 in the rendered list)
    const options = document.querySelectorAll<HTMLElement>(`#${id} .dropdownOption`);
    click(options[1]);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("main");
  });

  it("hides non-matching options when a filter string is typed", () => {
    const { dropdown, id } = mount();
    dropdown.setOptions(BRANCHES, "");

    // Open, then type "feature" into the filter input
    const label = document.querySelector<HTMLElement>(`#${id} .dropdownCurrentValue`)!;
    click(label);

    const filterInput = document.querySelector<HTMLInputElement>(`#${id} .dropdownFilterInput`)!;
    filterInput.value = "feature";
    filterInput.dispatchEvent(new KeyboardEvent("keyup"));

    const options = document.querySelectorAll<HTMLElement>(`#${id} .dropdownOption`);
    const visible = Array.from(options).filter((o) => o.style.display !== "none");
    expect(visible).toHaveLength(2);
    expect(visible[0].textContent).toContain("feature/login");
    expect(visible[1].textContent).toContain("feature/signup");
  });

  it("shows the 'no results' message when the filter matches nothing", () => {
    const { dropdown, id } = mount();
    dropdown.setOptions(BRANCHES, "");

    const label = document.querySelector<HTMLElement>(`#${id} .dropdownCurrentValue`)!;
    click(label);

    const filterInput = document.querySelector<HTMLInputElement>(`#${id} .dropdownFilterInput`)!;
    filterInput.value = "zzz-no-match";
    filterInput.dispatchEvent(new KeyboardEvent("keyup"));

    const noResults = document.querySelector<HTMLElement>(`#${id} .dropdownNoResults`)!;
    expect(noResults.style.display).toBe("block");
  });
});
