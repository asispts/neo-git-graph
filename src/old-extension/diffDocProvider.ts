import * as vscode from "vscode";

import type { GitInstance } from "@/backend/gitClient";
import { getPathFromStr } from "@/backend/utils/path";

export class DiffDocProvider implements vscode.TextDocumentContentProvider {
  public static scheme = "neo-git-graph";
  private gitClient: GitInstance;
  private onDidChangeEventEmitter = new vscode.EventEmitter<vscode.Uri>();
  private docs = new Map<string, DiffDocument>();
  private subscriptions: vscode.Disposable;

  constructor(gitClient: GitInstance) {
    this.gitClient = gitClient;
    this.subscriptions = vscode.workspace.onDidCloseTextDocument((doc) =>
      this.docs.delete(doc.uri.toString())
    );
  }

  public dispose() {
    this.subscriptions.dispose();
    this.docs.clear();
    this.onDidChangeEventEmitter.dispose();
  }

  get onDidChange() {
    return this.onDidChangeEventEmitter.event;
  }

  public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
    let document = this.docs.get(uri.toString());
    if (document) {
      return document.value;
    }

    let request = decodeDiffDocUri(uri);
    if (request.repo === undefined || request.commit === undefined) {
      return "";
    }
    return this.gitClient()
      .cwd(request.repo)
      .show([`${request.commit}:${request.filePath}`])
      .catch(() => "")
      .then((data) => {
        let doc = new DiffDocument(data);
        this.docs.set(uri.toString(), doc);
        return doc.value;
      });
  }
}

class DiffDocument {
  private body: string;

  constructor(body: string) {
    this.body = body;
  }

  get value() {
    return this.body;
  }
}

export function encodeDiffDocUri(repo: string, path: string, commit: string): vscode.Uri {
  return vscode.Uri.parse(
    DiffDocProvider.scheme +
      ":" +
      getPathFromStr(path) +
      "?commit=" +
      encodeURIComponent(commit) +
      "&repo=" +
      encodeURIComponent(repo)
  );
}

export function decodeDiffDocUri(uri: vscode.Uri) {
  let queryArgs = decodeUriQueryArgs(uri.query);
  return { filePath: uri.path, commit: queryArgs.commit, repo: queryArgs.repo };
}

function decodeUriQueryArgs(query: string) {
  let queryComps = query.split("&"),
    queryArgs: { [key: string]: string } = {};
  for (const queryComp of queryComps) {
    const separatorIndex = queryComp.indexOf("=");
    if (separatorIndex !== -1) {
      const key = queryComp.slice(0, separatorIndex);
      const value = queryComp.slice(separatorIndex + 1);
      queryArgs[key] = decodeURIComponent(value);
    }
  }
  return queryArgs;
}
