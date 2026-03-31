import type * as GG from "@/types";

export function createVscodeMock() {
  const sent: GG.RequestMessage[] = [];
  let state: WebViewState | null = null;

  const mock = {
    postMessage: (msg: GG.RequestMessage) => sent.push(msg),
    getState: () => state,
    setState: (s: WebViewState) => {
      state = s;
    }
  };

  global.acquireVsCodeApi = () => mock;

  return {
    sentMessages: sent,
    clearMessages: () => sent.splice(0),
    getState: () => state
  };
}

export function setupHtml(viewState: GG.GitGraphViewState) {
  document.body.innerHTML = `
    <div id="controls">
      <span id="repoControl"><div id="repoSelect" class="dropdown"></div></span>
      <span id="branchControl"><div id="branchSelect" class="dropdown"></div></span>
      <label id="showRemoteBranchesControl">
        <input type="checkbox" id="showRemoteBranchesCheckbox" checked>
        Show Remote Branches
      </label>
      <div id="refreshBtn" class="roundedBtn">Refresh</div>
      <div id="blinkHeadBtn" class="roundedBtn">Locate HEAD</div>
    </div>
    <div id="content">
      <div id="commitGraph"></div>
      <div id="commitTable"></div>
    </div>
    <div id="footer"></div>
    <ul id="contextMenu"></ul>
    <div id="dialogBacking"></div>
    <div id="dialog"></div>
    <div id="scrollShadow"></div>
  `;

  (global as unknown as { viewState: GG.GitGraphViewState }).viewState = viewState;
}

export function receive(msg: GG.ResponseMessage) {
  window.dispatchEvent(new MessageEvent("message", { data: msg }));
}
