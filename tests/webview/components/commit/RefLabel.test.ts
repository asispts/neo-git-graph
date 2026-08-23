// @vitest-environment jsdom

import { h, render } from "preact";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import type { GitRef } from "@/backend/types";
import type { GitGraphViewState } from "@/types";

let RefLabel: typeof import("@/webview/components/commit/RefLabel").RefLabel;
let container: HTMLDivElement;

beforeAll(async () => {
  const state: GitGraphViewState = {
    autoCenterCommitDetailsView: true,
    dateFormat: "Date & Time",
    fetchAvatars: false,
    graphColours: [],
    graphStyle: "rounded",
    initialLoadCommits: 300,
    lastActiveRepo: null,
    loadMoreCommits: 100,
    locale: "en",
    repos: {},
    showCurrentBranchByDefault: false
  };
  Object.defineProperty(globalThis, "viewState", { value: state, configurable: true });
  ({ RefLabel } = await import("@/webview/components/commit/RefLabel"));
});

afterEach(() => {
  render(null, container);
});

describe("RefLabel", () => {
  it.each([
    ["checked-out", true, true],
    ["other", false, false]
  ])("renders a %s branch with the expected weight", (_state, active, bold) => {
    const gitRef: GitRef = { hash: "abc123", name: "main", type: "head" };
    container = document.createElement("div");

    render(h(RefLabel, { gitRef, active }), container);

    expect(container.querySelector("span > span")?.classList.contains("font-bold")).toBe(bold);
  });
});
