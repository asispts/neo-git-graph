import { l10n } from "./l10n";
import { messages, type MessageId } from "./messages";

export type LocalizedStrings = { readonly [K in MessageId]: string };

/**
 * Get all localized strings for the webview.
 * Since webview cannot access vscode.l10n directly, we need to pass the strings
 * from the extension context. Placeholders (e.g. {0}) are left intact; the
 * webview substitutes them itself.
 */
export function getWebviewLocalizedStrings(): LocalizedStrings {
  const ids = Object.keys(messages) as MessageId[];
  const entries = ids.map((id) => [id, l10n.t(id)]);
  return Object.fromEntries(entries) as LocalizedStrings;
}
