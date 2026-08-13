import type { GitRef } from "@/backend/types";
import { Icon } from "@/webview/components/ui/Icons";
import { openContextMenu } from "@/webview/lib/actions";
import { checkoutBranchAction, refMenu, refMenuSource } from "@/webview/lib/menus";
import { activeSource } from "@/webview/lib/stores";

const ICON_CLASS = "mr-[5px] size-[18px] shrink-0 rounded-l-[4px] bg-graph fill-editor p-[2px]";

function RefIcon({ type }: { type: GitRef["type"] }) {
  if (type === "tag") {
    return (
      <Icon class={ICON_CLASS} viewBox="0 0 15 16">
        <path d="M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z" />
      </Icon>
    );
  }

  return (
    <Icon class={ICON_CLASS} viewBox="0 0 10 16">
      <path d="M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z" />
    </Icon>
  );
}

export function RefLabel({ gitRef, active }: { gitRef: GitRef; active: boolean }) {
  const source = refMenuSource(gitRef);
  const menuOpen = activeSource.value === source;

  return (
    <span
      class={`mt-[2px] mr-[5px] inline-flex h-[18px] max-w-full items-center overflow-hidden rounded-[5px] border pr-[5px] align-top text-xs box-content ${
        active ? "border-graph" : "border-line"
      } ${menuOpen ? "bg-btn-hover" : "bg-btn"}`}
      title={gitRef.name}
      onContextMenu={(event) => openContextMenu(event, source, refMenu(gitRef, active))}
      onClick={(event) => event.stopPropagation()}
      onDblClick={(event) => {
        event.stopPropagation();
        checkoutBranchAction(gitRef);
      }}
    >
      <RefIcon type={gitRef.type} />
      <span class="truncate">{gitRef.name}</span>
    </span>
  );
}
