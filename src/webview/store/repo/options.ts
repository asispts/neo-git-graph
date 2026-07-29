import { computed } from "@preact/signals";

import { ALL_BRANCHES } from "./policy";
import { branches, repos } from "./state";

const REMOTE_PREFIX = "remotes/";

export const repoOptions = computed(() =>
  Object.keys(repos.value).map((path) => ({
    label: path.split("/").pop() ?? path,
    value: path
  }))
);

export const branchOptions = computed(() => [
  { label: "Show All", value: ALL_BRANCHES },
  ...branches.value.map((branch) => ({
    label: branch.startsWith(REMOTE_PREFIX) ? branch.substring(REMOTE_PREFIX.length) : branch,
    value: branch
  }))
]);
