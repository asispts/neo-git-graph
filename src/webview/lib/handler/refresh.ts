import { refreshToken } from "@/webview/lib/stores";

export function handleRefresh() {
  refreshToken.value++;
}
