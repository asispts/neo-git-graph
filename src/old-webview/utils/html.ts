const htmlEscapes: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;"
};
const htmlUnescapes: { [key: string]: string } = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#x2F;": "/"
};
const htmlEscaper = /[&<>"'/]/g;
const htmlUnescaper = /&lt;|&gt;|&amp;|&quot;|&#x27;|&#x2F;/g;

export function escapeHtml(str: string) {
  return str.replace(htmlEscaper, (match) => htmlEscapes[match]);
}
export function unescapeHtml(str: string) {
  return str.replace(htmlUnescaper, (match) => htmlUnescapes[match]);
}
