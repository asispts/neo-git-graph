import type { SimpleGit } from "simple-git";

import type { ActionResult } from "@/backend/types";

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

export async function addTag(git: SimpleGit, input: AddTagInput): Promise<ActionResult> {
  try {
    const args: string[] = [];
    if (input.lightweight) {
      args.push(input.tagName);
    } else {
      args.push("-a", input.tagName, "-m", input.message);
    }
    args.push(input.commitHash);
    await git.tag(args);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function deleteTag(git: SimpleGit, input: DeleteTagInput): Promise<ActionResult> {
  try {
    await git.tag(["-d", input.tagName]);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}

export async function pushTag(git: SimpleGit, input: PushTagInput): Promise<ActionResult> {
  try {
    await git.push("origin", input.tagName);
    return { error: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: true, message };
  }
}
