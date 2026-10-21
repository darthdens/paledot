/**
 * Shared fixed background layer that sits behind all content on every page.
 * Flat page colour + hairline grid + paper grain + vignette (see index.css).
 */
export const BackgroundLayer = () => (
  <div className="site-background" aria-hidden="true">
    <div className="site-background-vignette" />
  </div>
);
