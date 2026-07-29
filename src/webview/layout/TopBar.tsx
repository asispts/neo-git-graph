import { Button } from "@/webview/components/Button";
import { Checkbox } from "@/webview/components/Checkbox";
import { RefreshIcon } from "@/webview/components/Icons";
import { Select } from "@/webview/components/Select";
import {
  branchOptions,
  currentBranch,
  currentRepo,
  refresh,
  repoOptions,
  selectBranch,
  selectRepo,
  setShowRemoteBranches,
  showRemoteBranches
} from "@/webview/store/repo";

export function TopBar() {
  return (
    <header class="flex flex-wrap items-center justify-center border-b border-line py-4 gap-x-8">
      <Button onClick={refresh}>
        <RefreshIcon />
        Refresh
      </Button>
      <div class="flex gap-x-4">
        {repoOptions.value.length > 1 && (
          <Select
            label="Repo:"
            options={repoOptions.value}
            value={currentRepo.value ?? ""}
            onChange={(event) => selectRepo(event.currentTarget.value)}
          />
        )}
        <Select
          label="Branches:"
          options={branchOptions.value}
          value={currentBranch.value ?? ""}
          onChange={(event) => selectBranch(event.currentTarget.value)}
        />
        <Checkbox
          label="Show Remote Branches"
          checked={showRemoteBranches.value}
          onChange={(event) => setShowRemoteBranches(event.currentTarget.checked)}
        />
      </div>
    </header>
  );
}
