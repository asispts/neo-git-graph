export function addListenerToClass(className: string, event: string, eventListener: EventListener) {
  let elems = document.getElementsByClassName(className),
    i;
  for (i = 0; i < elems.length; i++) {
    elems[i].addEventListener(event, eventListener);
  }
}
export function insertAfter(newNode: HTMLElement, referenceNode: HTMLElement) {
  referenceNode.parentNode!.insertBefore(newNode, referenceNode.nextSibling);
}
export function blinkHeadRow(headHash: string | null) {
  if (!headHash) return;
  const row = document.querySelector(`tr.commit[data-hash="${headHash}"]`) as HTMLElement | null;
  if (!row) return;
  row.classList.add("blinking");
  // Matches CSS animation: 320ms * 2 iterations = 640ms, add small buffer
  window.setTimeout(() => row.classList.remove("blinking"), 700);
}
