import {
  ActionRequest,
  ActionResponse,
  GitFileChangeType,
  QueryRequest,
  QueryResponse
} from "@/backend/types";

export type GitRepoSet = { [repo: string]: GitRepoState };
export type GitRepoState = {
  /**
   * Width of the graph, date, author and commit column of the commit table, in
   * pixels, padding included. `null` while the browser sizes the table itself.
   * The description column takes the width the others leave.
   */
  columnWidths: number[] | null;
};

export type Avatar = {
  image: string;
  timestamp: number;
  identicon: boolean;
};
export type AvatarCache = { [email: string]: Avatar };

/* Infrastructure Request / Response Messages */

export type RequestFetchAvatar = {
  command: "fetchAvatar";
  repo: string;
  email: string;
  commits: string[];
};
export type ResponseFetchAvatar = {
  command: "fetchAvatar";
  email: string;
  image: string;
};

export type RequestSelectRepo = {
  command: "selectRepo";
  repo: string;
};

export type RequestSaveRepoState = {
  command: "saveRepoState";
  repo: string;
  state: GitRepoState;
};

export type RequestViewDiff = {
  command: "viewDiff";
  repo: string;
  commitHash: string;
  oldFilePath: string;
  newFilePath: string;
  type: GitFileChangeType;
};
export type ResponseViewDiff = {
  command: "viewDiff";
  success: boolean;
};

export type ResponseRefresh = {
  command: "refresh";
};

export type RequestMessage =
  | ActionRequest
  | QueryRequest
  | RequestFetchAvatar
  | RequestSelectRepo
  | RequestSaveRepoState
  | RequestViewDiff;

export type ResponseMessage =
  | ActionResponse
  | QueryResponse
  | ResponseFetchAvatar
  | ResponseViewDiff
  | ResponseRefresh;
