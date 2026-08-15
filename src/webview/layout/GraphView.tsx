import { CommitTable } from "@/webview/components/commit/CommitTable";
import { Button } from "@/webview/components/ui/Button";
import { Loading } from "@/webview/components/ui/Loading";
import { loadMoreCommits } from "@/webview/lib/actions";
import {
  commitHead,
  commitList,
  headBranch,
  maxCommits,
  moreCommitsAvailable
} from "@/webview/lib/stores";

export function GraphView() {
  const commits = commitList.value;

  if (commits === undefined) {
    return <Loading />;
  }

  const loadingMore = commits.length < maxCommits.value;

  return (
    <main class="relative">
      <CommitTable commits={commits} head={commitHead.value} headBranch={headBranch.value} />
      {moreCommitsAvailable.value &&
        (loadingMore ? (
          <Loading />
        ) : (
          <div class="flex justify-center py-4">
            <Button onClick={loadMoreCommits}>{window.l10n.loadMore}</Button>
          </div>
        ))}
    </main>
  );
}
