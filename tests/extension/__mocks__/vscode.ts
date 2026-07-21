export const workspace = {
  getConfiguration: () => ({ get: (_key: string, def: unknown) => def }),
  workspaceFolders: undefined,
  createFileSystemWatcher: () => ({
    onDidCreate: () => ({ dispose: () => {} }),
    dispose: () => {}
  }),
  onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
  onDidChangeConfiguration: () => ({ dispose: () => {} })
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} })
};

export const window = {
  showErrorMessage: () => Promise.resolve(undefined)
};
