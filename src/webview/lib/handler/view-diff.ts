import type { ResponseViewDiff } from "@/types";
import { openErrorDialog } from "@/webview/lib/actions";

export function handleViewDiff(msg: ResponseViewDiff) {
  if (msg.success) {
    return;
  }

  openErrorDialog(window.l10n.unableToViewDiff);
}
