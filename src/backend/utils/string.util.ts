export function abbrevCommit(commitHash: string) {
  return commitHash.substring(0, 8);
}

export function escapeRefName(str: string) {
  return str.replace(/'/g, "'");
}
