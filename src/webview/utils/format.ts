import type { ComponentChildren } from "preact";

/**
 * Fill the `{0}`, `{1}` ... placeholders of a localized template with nodes.
 * Every part is rendered as a child, so no markup is parsed.
 */
export function format(
  template: string,
  ...parts: Array<ComponentChildren>
): Array<ComponentChildren> {
  return template
    .split(/(\{\d+\})/)
    .filter((piece) => piece !== "")
    .map((piece) => {
      const placeholder = /^\{(\d+)\}$/.exec(piece);
      return placeholder === null ? piece : parts[Number(placeholder[1])];
    });
}
