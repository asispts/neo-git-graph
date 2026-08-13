import type { ResponseCopyToClipboard } from "@/types";
import { openErrorDialog } from "@/webview/lib/actions";

export function handleCopyToClipboard(msg: ResponseCopyToClipboard) {
  if (msg.success) {
    return;
  }

  openErrorDialog(window.l10n.unableToCopyToClipboard.replace("{0}", msg.type));
}
