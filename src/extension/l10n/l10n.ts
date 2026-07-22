import { l10n as vscodeL10n } from "vscode";

import { messages, type MessageId } from "./messages";

export const l10n = {
  t: (id: MessageId, ...args: Array<string | number | boolean>): string => {
    const translated = vscodeL10n.t(id, ...args);
    // vscode-l10n returns the key verbatim when untranslated; fall back to the
    // English text (reusing vscode-l10n's own placeholder formatting).
    return translated === id ? vscodeL10n.t(messages[id], ...args) : translated;
  }
};
