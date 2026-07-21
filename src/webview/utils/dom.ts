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
