import type { GitFileChange } from "@/backend/types";

export type FileTreeFile = {
  type: "file";
  name: string;
  file: GitFileChange;
};

export type FileTreeFolder = {
  type: "folder";
  name: string;
  /** Path from the root of the repo, used as the key of the open state. */
  path: string;
  children: Array<FileTreeNode>;
};

export type FileTreeNode = FileTreeFile | FileTreeFolder;

/** Folders come first, then both are sorted by name. */
function sortNodes(nodes: Array<FileTreeNode>): Array<FileTreeNode> {
  for (const node of nodes) {
    if (node.type === "folder") {
      node.children = sortNodes(node.children);
    }
  }

  return nodes.toSorted((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1
  );
}

/** Build the folder tree of the files a commit changed. */
export function buildFileTree(files: Array<GitFileChange>): Array<FileTreeNode> {
  const root: FileTreeFolder = { type: "folder", name: "", path: "", children: [] };
  const folders = new Map<string, FileTreeFolder>([["", root]]);

  for (const file of files) {
    const parts = file.newFilePath.split("/");
    const fileName = parts.pop();
    if (fileName === undefined) {
      continue;
    }
    let folder = root;

    for (const name of parts) {
      const path = folder.path === "" ? name : `${folder.path}/${name}`;
      let child = folders.get(path);

      if (child === undefined) {
        child = { type: "folder", name, path, children: [] };
        folders.set(path, child);
        folder.children.push(child);
      }

      folder = child;
    }

    folder.children.push({ type: "file", name: fileName, file });
  }

  return sortNodes(root.children);
}
