const SHADOW_CLASS =
  "pointer-events-none fixed inset-x-0 top-0 z-1 h-0 shadow-scroll animate-scroll-shadow";

/**
 * A shade along the top edge of the window, shown while the page is scrolled.
 * It marks the rows that sit above the edge. A scroll timeline drives it, so
 * no scroll listener runs and no re-render happens.
 */
export function ScrollShadow() {
  return <div class={SHADOW_CLASS} aria-hidden="true" />;
}
