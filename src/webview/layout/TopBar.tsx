import { Button } from "@/webview/components/Button";
import { Checkbox } from "@/webview/components/Checkbox";
import { RefreshIcon } from "@/webview/components/Icons";
import { Select } from "@/webview/components/Select";

const PLACEHOLDER_REPOS = [{ label: "neo-git-graph", value: "neo-git-graph" }];
const PLACEHOLDER_BRANCHES = [
  { label: "Show All", value: "" },
  { label: "main", value: "main" }
];

export function TopBar() {
  return (
    <header class="flex flex-wrap items-center justify-center border-b border-line py-4 gap-x-8">
      <Button>
        <RefreshIcon />
        Refresh
      </Button>
      <div class="flex gap-x-4">
        <Select label="Repo:" options={PLACEHOLDER_REPOS} />
        <Select label="Branches:" options={PLACEHOLDER_BRANCHES} />
        <Checkbox label="Show Remote Branches" />
      </div>
    </header>
  );
}
