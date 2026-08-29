import type { ComponentChildren } from "preact";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "preact/hooks";

import { Button } from "@/webview/components/ui/Button";
import { Checkbox } from "@/webview/components/ui/Checkbox";
import { Icon } from "@/webview/components/ui/Icons";
import { Select } from "@/webview/components/ui/Select";
import { closeDialog } from "@/webview/lib/actions";
import { dialog } from "@/webview/lib/stores";
import type { DialogInput, DialogState } from "@/webview/types";
import { hasInvalidRefChars } from "@/webview/utils/ref";

const FOCUSABLE = "input:not([disabled]), select, button:not([disabled])";

const PANEL_CLASS = [
  "fixed left-1/2 top-1/2 z-40 max-h-4/5 w-dialog",
  "-translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-line",
  "bg-menu p-2.5 text-center text-menu-fg outline-none shadow-dialog"
].join(" ");

const INPUT_CLASS =
  "w-full rounded-sm bg-input px-2 py-1 text-input-fg outline-1 outline-line focus:outline-focus";

/** Why the form cannot be submitted. Only a `ref` input can block it. */
type RefProblem = "empty" | "invalid" | null;

function refProblem(inputs: Array<DialogInput>, values: Array<string | boolean>): RefProblem {
  for (const [index, input] of inputs.entries()) {
    if (input.kind !== "ref") {
      continue;
    }

    const value = String(values[index]);
    if (value === "") {
      return "empty";
    }
    if (hasInvalidRefChars(value)) {
      return "invalid";
    }
  }

  return null;
}

/** Keep Tab inside the dialog, so the page behind it stays unreachable. */
function trapTab(panel: HTMLElement, event: KeyboardEvent) {
  const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) {
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];
  if (first === undefined || last === undefined) {
    return;
  }

  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function Panel({ labelledBy, children }: { labelledBy: string; children: ComponentChildren }) {
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = panel.current;
    if (element === null) {
      return;
    }

    (element.querySelector<HTMLElement>('input[type="text"], button') ?? element).focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div class="fixed inset-0 z-30" onClick={closeDialog} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        class={PANEL_CLASS}
        onKeyDown={(event) => {
          if (event.key === "Tab" && panel.current !== null) {
            trapTab(panel.current, event);
          }
        }}
      >
        {children}
      </div>
    </>
  );
}

function Field({
  input,
  value,
  onChange,
  labelled,
  labelledBy
}: {
  input: DialogInput;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  /** The form shows a label column, because at least one field carries a label. */
  labelled: boolean;
  /** Id of the dialog message, which names a field that carries no label. */
  labelledBy: string;
}) {
  const id = useId();

  if (input.kind === "checkbox") {
    return (
      <div class={labelled ? "col-span-2" : "text-center"}>
        <Checkbox
          label={input.label}
          checked={value === true}
          onInput={(event) => onChange(event.currentTarget.checked)}
        />
      </div>
    );
  }

  const named = input.label === undefined ? labelledBy : undefined;

  const control =
    input.kind === "select" ? (
      <Select
        id={id}
        options={input.options}
        value={String(value)}
        onChange={onChange}
        aria-labelledby={named}
      />
    ) : (
      <input
        id={id}
        type="text"
        class={INPUT_CLASS}
        value={String(value)}
        placeholder={input.kind === "text" ? input.placeholder : undefined}
        aria-labelledby={named}
        onInput={(event) => onChange(event.currentTarget.value)}
      />
    );

  if (!labelled) {
    return control;
  }

  return (
    <>
      <label for={id} class="whitespace-nowrap">
        {input.label}
      </label>
      {control}
    </>
  );
}

function invalidHint(action: string) {
  return window.l10n.invalidCharacters.replace("{0}", action);
}

function FormBody({
  state,
  labelledBy
}: {
  state: Extract<DialogState, { kind: "form" }>;
  labelledBy: string;
}) {
  const [values, setValues] = useState<Array<string | boolean>>(() =>
    state.inputs.map((input) => input.value)
  );

  const labelled = state.inputs.some(
    (input) => input.kind !== "checkbox" && input.label !== undefined
  );
  const problem = refProblem(state.inputs, values);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (problem !== null) {
          return;
        }

        closeDialog();
        state.onSubmit(values);
      }}
    >
      <p id={labelledBy}>{state.message}</p>
      {state.inputs.length > 0 && (
        <div
          class={`mt-2.5 grid gap-2.5 text-left ${
            labelled ? "grid-cols-labelled items-center" : ""
          }`}
        >
          {state.inputs.map((input, index) => (
            <Field
              key={`${input.kind}-${index}`}
              input={input}
              value={values[index] ?? input.value}
              labelled={labelled}
              labelledBy={labelledBy}
              onChange={(value) =>
                setValues((current) => current.map((old, i) => (i === index ? value : old)))
              }
            />
          ))}
        </div>
      )}
      <div class="mt-2.5 flex justify-center gap-3">
        <span title={problem === "invalid" ? invalidHint(state.action) : undefined}>
          <Button type="submit" disabled={problem !== null}>
            {state.action}
          </Button>
        </span>
        <Button onClick={closeDialog}>{window.l10n.dialogCancel}</Button>
      </div>
    </form>
  );
}

function MessageBody({
  state,
  labelledBy
}: {
  state: Extract<DialogState, { kind: "error" | "running" }>;
  labelledBy: string;
}) {
  return (
    <>
      <p id={labelledBy} class="flex items-center justify-center gap-1.5">
        {state.kind === "running" ? (
          <Icon class="size-5 shrink-0 animate-spin text-muted" viewBox="0 0 12 16">
            <path d="M10.24 7.4a4.15 4.15 0 0 1-1.2 3.6 4.346 4.346 0 0 1-5.41.54L4.8 10.4.5 9.8l.6 4.2 1.31-1.26c2.36 1.74 5.7 1.57 7.84-.54a5.876 5.876 0 0 0 1.74-4.46l-1.75-.34zM2.96 5a4.346 4.346 0 0 1 5.41-.54L7.2 5.6l4.3.6-.6-4.2-1.31 1.26c-2.36-1.74-5.7-1.57-7.85.54C.5 5.03-.06 6.65.01 8.26l1.75.35A4.17 4.17 0 0 1 2.96 5z" />
          </Icon>
        ) : (
          <Icon class="shrink-0 text-muted">
            <path d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z" />
          </Icon>
        )}
        {state.kind === "running" ? `${state.message} ...` : state.message}
      </p>
      {state.kind === "error" && state.reason !== null && (
        <p class="mt-2.5 text-left italic whitespace-pre-wrap select-text">{state.reason}</p>
      )}
      <div class="mt-2.5 flex justify-center">
        <Button onClick={closeDialog}>{window.l10n.dialogDismiss}</Button>
      </div>
    </>
  );
}

export function Dialog() {
  const state = dialog.value;
  const labelledBy = useId();

  if (state === null) {
    return null;
  }

  return (
    <Panel key={state.token} labelledBy={labelledBy}>
      {state.kind === "form" ? (
        <FormBody state={state} labelledBy={labelledBy} />
      ) : (
        <MessageBody state={state} labelledBy={labelledBy} />
      )}
    </Panel>
  );
}
