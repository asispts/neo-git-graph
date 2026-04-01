import type { SimpleGit } from "simple-git";

type AddTagInput = {
  tagName: string;
  commitHash: string;
  lightweight: boolean;
  message: string;
};
type PushTagInput = {
  tagName: string;
};
type DeleteTagInput = {
  tagName: string;
};

export async function addTag(git: SimpleGit, input: AddTagInput): Promise<void> {
  const args: string[] = [];
  if (input.lightweight) {
    args.push(input.tagName);
  } else {
    args.push("-a", input.tagName, "-m", input.message);
  }
  args.push(input.commitHash);
  await git.tag(args);
}

export async function deleteTag(git: SimpleGit, input: DeleteTagInput): Promise<void> {
  await git.tag(["-d", input.tagName]);
}

export async function pushTag(git: SimpleGit, input: PushTagInput): Promise<void> {
  await git.push("origin", input.tagName);
}
