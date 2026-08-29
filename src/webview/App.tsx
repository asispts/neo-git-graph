import type { GitRepo } from "@/types";

import { ContextMenu } from "./components/ui/ContextMenu";
import { Dialog } from "./components/ui/Dialog";
import { ScrollShadow } from "./components/ui/ScrollShadow";
import { GraphView } from "./layout/GraphView";
import { MainHeader } from "./layout/MainHeader";

export function App({ repos }: { repos: Array<GitRepo> }) {
  return (
    <div class="flex min-h-screen flex-col">
      <MainHeader repos={repos} />
      <GraphView />
      <ScrollShadow />
      <ContextMenu />
      <Dialog />
    </div>
  );
}
