/**
 * Characters and sequences that git refuses in a ref name.
 * The pattern carries no `g` flag on purpose: a global regex keeps `lastIndex`
 * between calls, so `test` would return alternating results.
 */
const REF_INVALID = /^[-/].*|[\\" ><~^:?*[]|\.\.|\/\/|\/\.|@{|[./]$|\.lock$|^@$/;

export function hasInvalidRefChars(name: string) {
  return REF_INVALID.test(name);
}
