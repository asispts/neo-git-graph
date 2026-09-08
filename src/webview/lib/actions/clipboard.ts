import { openErrorDialog } from "@/webview/lib/actions";
import { rpcClient } from "@/webview/lib/rpc/rpc-client";

export async function copyToClipboard(type: string, data: string) {
  try {
    const success = await rpcClient.request("clipboard.copy", data);

    if (!success) {
      openErrorDialog(window.l10n.unableToCopyToClipboard.replace("{0}", type));
    }
  } catch {
    openErrorDialog(window.l10n.unableToCopyToClipboard.replace("{0}", type));
  }
}
