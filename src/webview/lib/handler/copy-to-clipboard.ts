import type { ResponseCopyToClipboard } from "@/types";

export function handleCopyToClipboard(msg: ResponseCopyToClipboard) {
  if (msg.success) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(window.l10n.unableToCopyToClipboard.replace("{0}", msg.type));
}
