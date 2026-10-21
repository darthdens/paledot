import type { CSSProperties } from "react";

/**
 * The Pale Dot wordmark as inline SVG (DM Sans 600 outlined; the o of "dot" is the dot).
 * - variant "dark": letters in --foreground, the dot at 90% of the o (use on the app's dark ground).
 * - variant "light": the o becomes a disc of --space with the dot at 62% inside (documents, light grounds).
 * - lit: adds the halo (title screen, end frame). Letters carry class "pd-letter" and the dot "pd-dot",
 *   which paledotMotion.ts animates. Never set the wordmark as live text.
 */
export const PALEDOT_WORDMARK = {
  viewBox: "0 0 362.58 100.00",
  dot: { cx: 296.55, cy: 50.22, R: 28.89, rDark: 26.00, rLight: 17.91 },
  letters: [
  { letter: "p", d: "M0 100V22.67H11.18L12.02 32.62H12.47Q14.68 28.99 17.76 26.5Q20.84 24 24.74 22.67Q28.63 21.33 33.17 21.33Q41.03 21.33 46.84 25.1Q52.65 28.86 55.84 35.39Q59.03 41.93 59.03 50.22Q59.03 58.52 55.84 65.05Q52.65 71.58 46.71 75.35Q40.77 79.11 32.45 79.11Q25.66 79.11 20.85 76.42Q16.05 73.72 13.33 70.05V100ZM29.43 68.1Q34.33 68.1 37.96 65.84Q41.58 63.57 43.56 59.57Q45.54 55.57 45.54 50.27Q45.54 44.97 43.56 40.97Q41.58 36.97 37.96 34.7Q34.33 32.43 29.43 32.43Q24.57 32.43 20.89 34.7Q17.21 36.97 15.2 40.97Q13.19 44.97 13.19 50.27Q13.19 55.57 15.2 59.57Q17.21 63.57 20.89 65.84Q24.57 68.1 29.43 68.1Z" },
  { letter: "a", d: "M83.27 79.11Q76.72 79.11 72.41 76.85Q68.1 74.58 66.05 70.76Q64 66.94 64 62.39Q64 57.13 66.71 53.27Q69.43 49.4 74.77 47.25Q80.11 45.11 88 45.11H102.15Q102.15 40.58 100.85 37.65Q99.56 34.71 96.95 33.29Q94.34 31.87 90.47 31.87Q85.85 31.87 82.5 34.05Q79.14 36.23 78.39 40.81H65.3Q65.92 34.76 69.26 30.42Q72.61 26.08 78.1 23.71Q83.59 21.33 90.52 21.33Q98.45 21.33 104.06 24.03Q109.66 26.72 112.57 31.76Q115.49 36.79 115.49 43.89V77.78H104.44L103.05 68.93H102.61Q100.96 71.51 98.88 73.41Q96.8 75.32 94.38 76.56Q91.96 77.8 89.15 78.46Q86.34 79.11 83.27 79.11ZM87.28 68.6Q90.68 68.6 93.26 67.4Q95.84 66.21 97.64 64.12Q99.45 62.03 100.48 59.34Q101.51 56.64 101.74 53.71H89.42Q85.4 53.71 82.87 54.69Q80.35 55.67 79.2 57.38Q78.05 59.1 78.05 61.34Q78.05 63.64 79.19 65.27Q80.33 66.91 82.41 67.76Q84.49 68.6 87.28 68.6Z" },
  { letter: "l", d: "M123.22 77.78V0H136.56V77.78Z" },
  { letter: "e", d: "M171.53 79.11Q163.23 79.11 156.84 75.52Q150.45 71.93 146.84 65.5Q143.22 59.07 143.22 50.59Q143.22 41.9 146.78 35.34Q150.34 28.79 156.74 25.06Q163.13 21.33 171.61 21.33Q179.82 21.33 185.94 24.92Q192.06 28.51 195.47 34.55Q198.88 40.59 198.88 48.12Q198.88 49.23 198.86 50.58Q198.84 51.93 198.68 53.44H152.84V44.84H185.43Q185.1 38.79 181.22 35.3Q177.35 31.82 171.57 31.82Q167.44 31.82 163.95 33.66Q160.46 35.49 158.4 39.21Q156.33 42.92 156.33 48.63V51.84Q156.33 57.02 158.34 60.68Q160.34 64.34 163.82 66.27Q167.3 68.21 171.44 68.21Q176.02 68.21 179.13 66.14Q182.23 64.07 183.78 60.6H197.28Q195.74 65.85 192.16 70.03Q188.57 74.21 183.35 76.66Q178.13 79.11 171.53 79.11Z" },
  { letter: "d", d: "M228.63 79.11Q220.79 79.11 214.97 75.35Q209.16 71.58 205.97 65.05Q202.78 58.52 202.78 50.22Q202.78 41.95 205.97 35.41Q209.16 28.86 215.14 25.1Q221.12 21.33 229.36 21.33Q236.15 21.33 240.96 24.03Q245.76 26.72 248.47 30.4V0H261.81V77.78H250.63L249.79 67.82H249.34Q247.19 71.45 244.08 73.95Q240.97 76.44 237.13 77.78Q233.29 79.11 228.63 79.11ZM232.38 68.01Q237.3 68.01 240.95 65.75Q244.6 63.48 246.61 59.49Q248.62 55.49 248.62 50.16Q248.62 44.87 246.61 40.87Q244.6 36.87 240.94 34.61Q237.28 32.34 232.36 32.34Q227.52 32.34 223.87 34.61Q220.22 36.89 218.24 40.89Q216.27 44.89 216.27 50.16Q216.27 55.48 218.24 59.48Q220.22 63.47 223.87 65.74Q227.51 68.01 232.38 68.01Z" },
  { letter: "t", d: "M352.7 77.78Q347.1 77.78 342.9 76.02Q338.71 74.25 336.42 70.14Q334.13 66.03 334.13 58.96V33.1H324.67V22.67H334.13L335.61 8.2H347.48V22.67H362.58V33.1H347.46V59.05Q347.46 63.59 349.25 65.23Q351.04 66.88 355.46 66.88H362.11V77.78Z" }
  ],
} as const;

type Props = {
  variant?: "dark" | "light";
  lit?: boolean;
  className?: string;
  style?: CSSProperties;
  /** id prefix for the gradient, in case several wordmarks share a page */
  idPrefix?: string;
};

export function PaleDotWordmark({ variant = "dark", lit = false, className, style, idPrefix = "pd" }: Props) {
  const { viewBox, dot, letters } = PALEDOT_WORDMARK;
  const r = variant === "dark" ? dot.rDark : dot.rLight;
  const letterFill = variant === "dark" ? "hsl(var(--foreground))" : "hsl(var(--foreground-strong))";
  return (
    <svg className={className ?? "pd-stage-svg"} style={style} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="paledot">
      {lit && (
        <defs>
          <radialGradient id={`${idPrefix}-glow`}>
            <stop offset="0" stopColor="hsl(var(--dot-glow))" stopOpacity="0.38" />
            <stop offset="0.4" stopColor="hsl(var(--dot-glow))" stopOpacity="0.10" />
            <stop offset="1" stopColor="hsl(var(--dot-glow))" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      <g className="pd-letters">
        {letters.map((l) => (
          <path key={l.letter} className="pd-letter" data-letter={l.letter} fill={letterFill} d={l.d} />
        ))}
      </g>
      {variant === "light" && <circle className="pd-space" cx={dot.cx} cy={dot.cy} r={dot.R} fill="hsl(var(--space))" />}
      {lit ? (
        <circle className="pd-halo" cx={dot.cx} cy={dot.cy} r={r * 2.8} fill={`url(#${idPrefix}-glow)`} />
      ) : (
        <circle className="pd-halo" cx={dot.cx} cy={dot.cy} r={r * 2.8} fill="none" />
      )}
      <circle className="pd-dot" cx={dot.cx} cy={dot.cy} r={r} fill="hsl(var(--dot))" />
    </svg>
  );
}

/** The dot mark (favicon / avatar artwork) as an inline SVG. */
export function PaleDotMark({ size = 32, rounded = true, className }: { size?: number; rounded?: boolean; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pale Dot">
      <rect width="32" height="32" rx={rounded ? 7 : 0} fill="hsl(var(--space, 228 24% 5%))" />
      <circle cx="16" cy="16" r="6" fill="hsl(var(--dot, 204 78% 88%))" />
    </svg>
  );
}
