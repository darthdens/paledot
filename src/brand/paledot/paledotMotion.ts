/**
 * Pale Dot motion: the reveal (the zoom in reverse) and the end-of-journey sequence.
 * Framework-free: animates SVG attributes with requestAnimationFrame. Attach to a container
 * that holds a PaleDotWordmark (lit) plus optional .pd-desc, .pd-actions and .pd-readout elements.
 *
 * Timeline (ms): dot fades in at 11% size at the centre of the stage (0–300) → grows and travels into
 * the o (300–1500, ease-out expo) → letters emerge outward from the dot, nearest first, 420ms each,
 * 55ms stagger (from 1250) → descriptor (1950) → actions (2150). Total 2.6s. Any click skips.
 * prefers-reduced-motion: no movement, a 400ms crossfade of the finished state.
 */
export const PALEDOT_MOTION_SPEC = {
  dotIn: { t0: 0, d: 300 },
  dotGrow: { t0: 300, d: 1200 },
  letters: { t0: 1250, d: 420, stagger: 55 },
  descriptor: { t0: 1950, d: 400 },
  actions: { t0: 2150, d: 400 },
  total: 2600,
  holdBeforeReveal: 1200, // end of journey: how long the lone dot holds on black
  fadeToBlack: 1600, // end of journey: the scene's own fade, owned by the explorer
} as const;

export type PaleDotMotion = {
  reveal: () => void;
  endOfJourney: () => void;
  finish: () => void;
  destroy: () => void;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function setupPaleDotMotion(stage: HTMLElement): PaleDotMotion {
  const S = PALEDOT_MOTION_SPEC;
  const svg = stage.querySelector<SVGSVGElement>("svg.pd-stage-svg, .pd-stage-svg");
  if (!svg) throw new Error("setupPaleDotMotion: no .pd-stage-svg inside the stage");
  const dot = svg.querySelector<SVGCircleElement>(".pd-dot")!;
  const halo = svg.querySelector<SVGCircleElement>(".pd-halo")!;
  const letters = Array.from(svg.querySelectorAll<SVGPathElement>(".pd-letter"));
  const desc = stage.querySelector<HTMLElement>(".pd-desc");
  const actions = stage.querySelector<HTMLElement>(".pd-actions");
  const readout = stage.querySelector<HTMLElement>(".pd-readout");
  const vb = svg.viewBox.baseVal;
  // Remember the finished geometry once, so a remount (dev double-mount, re-render) never reads mid-animation values.
  if (!dot.dataset["fin"]) dot.dataset["fin"] = [dot.getAttribute("cx"), dot.getAttribute("cy"), dot.getAttribute("r"), halo.getAttribute("r")].join(",");
  const [fcx, fcy, fr, frh] = dot.dataset["fin"].split(",").map(Number) as [number, number, number, number];
  const fin = { cx: fcx, cy: fcy, r: fr, rh: frh };
  const order = letters
    .map((el) => { const b = el.getBBox(); return { el, x: b.x + b.width / 2 }; })
    .sort((a, b) => Math.abs(a.x - fin.cx) - Math.abs(b.x - fin.cx));
  const start = { cx: vb.width / 2, cy: vb.height / 2, r: fin.r * 0.11 };
  let raf = 0, t0 = 0, mode: "reveal" | "end" = "reveal";

  function syncStart() {
    // the dot begins where the Earth marker was: the true centre of the stage
    const sr = stage.getBoundingClientRect(), vr = svg.getBoundingClientRect();
    if (!vr.width || !vr.height) return;
    start.cx = (sr.left + sr.width / 2 - vr.left) * (vb.width / vr.width);
    start.cy = (sr.top + sr.height / 2 - vr.top) * (vb.height / vr.height);
  }
  function apply(t: number) {
    const a = clamp01((t - S.dotIn.t0) / S.dotIn.d);
    const g = easeOutExpo(clamp01((t - S.dotGrow.t0) / S.dotGrow.d));
    const cx = start.cx + (fin.cx - start.cx) * g, cy = start.cy + (fin.cy - start.cy) * g;
    dot.setAttribute("opacity", String(a));
    dot.setAttribute("cx", String(cx)); dot.setAttribute("cy", String(cy));
    dot.setAttribute("r", String(start.r + (fin.r - start.r) * g));
    halo.setAttribute("cx", String(cx)); halo.setAttribute("cy", String(cy));
    halo.setAttribute("r", String(Math.max(1, fin.rh * (0.25 + 0.75 * g))));
    halo.setAttribute("opacity", String(a * (0.3 + 0.7 * g)));
    order.forEach((o, i) => {
      const p = easeOutCubic(clamp01((t - S.letters.t0 - i * S.letters.stagger) / S.letters.d));
      const dir = o.x < fin.cx ? 1 : -1;
      o.el.setAttribute("opacity", String(p));
      o.el.setAttribute("transform", `translate(${dir * (1 - p) * 10} 0)`);
    });
    const dd = easeOutCubic(clamp01((t - S.descriptor.t0) / S.descriptor.d));
    if (desc) { desc.style.opacity = String(dd); desc.style.transform = `translateY(${(1 - dd) * 6}px)`; }
    const aa = easeOutCubic(clamp01((t - S.actions.t0) / S.actions.d));
    if (actions) { actions.style.opacity = String(aa); actions.style.transform = `translateY(${(1 - aa) * 6}px)`; }
    if (readout) readout.style.opacity = mode === "end" ? "1" : String(aa);
  }
  function finish() { cancelAnimationFrame(raf); apply(S.total + 1); }
  function frame(now: number) { const t = now - t0; apply(t); if (t < S.total) raf = requestAnimationFrame(frame); }
  function reveal() {
    cancelAnimationFrame(raf); mode = "reveal";
    if (readout) readout.style.opacity = "0";
    if (reduced()) { finish(); stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 }); return; }
    syncStart(); t0 = performance.now(); apply(0); raf = requestAnimationFrame(frame);
  }
  let holdTimer = 0;
  function endOfJourney() {
    cancelAnimationFrame(raf); clearTimeout(holdTimer); mode = "end"; syncStart();
    if (readout) readout.style.opacity = "1";
    apply(0);
    dot.setAttribute("opacity", "1"); dot.setAttribute("r", String(start.r));
    halo.setAttribute("opacity", "0.4"); halo.setAttribute("r", String(fin.rh * 0.25));
    const hold = reduced() ? 400 : S.holdBeforeReveal;
    holdTimer = window.setTimeout(() => { t0 = performance.now() - S.dotIn.d; raf = requestAnimationFrame(frame); }, hold);
  }
  const onClick = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("[data-action], a, button")) return; finish(); };
  stage.addEventListener("click", onClick);
  syncStart(); apply(0);
  return { reveal, endOfJourney, finish, destroy() { cancelAnimationFrame(raf); clearTimeout(holdTimer); stage.removeEventListener("click", onClick); } };
}
