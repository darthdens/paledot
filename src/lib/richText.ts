// Shared rich-text utilities for admin editor + public rendering

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const parseHex = (hex: string) => {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const parseRgb = (value: string) => {
  const m = value
    .replace(/\s+/g, '')
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,(\d*\.?\d+))?\)$/i);
  if (!m) return null;
  const r = clamp(parseInt(m[1], 10), 0, 255);
  const g = clamp(parseInt(m[2], 10), 0, 255);
  const b = clamp(parseInt(m[3], 10), 0, 255);
  return { r, g, b };
};

const shouldStripTextColor = (value: string) => {
  const v = (value || '').trim().toLowerCase();
  if (!v) return false;
  if (v === 'inherit' || v === 'currentcolor') return false;

  const rgb = v.startsWith('rgb') ? parseRgb(v) : null;
  const hex = v.startsWith('#') ? parseHex(v) : null;
  const c = rgb || hex;
  if (!c) return false;

  const isGray = c.r === c.g && c.g === c.b;
  if (!isGray) return false;

  // Strip near-black / near-white grayscale values that become unreadable depending on theme.
  const level = c.r; // grayscale
  return level <= 55 || level >= 200;
};

/**
 * Removes hardcoded near-black/near-white inline text colors so text always inherits theme `foreground`.
 * Keeps colorful text (red/blue/etc.) + background highlights intact.
 */
export const sanitizeRichTextHtml = (html: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');

    doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const decls = style
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean);

      const filtered = decls.filter((d) => {
        const [rawProp, ...rest] = d.split(':');
        const prop = (rawProp || '').trim().toLowerCase();
        const value = rest.join(':').trim();

        if (
          prop === 'color' ||
          prop === '-webkit-text-fill-color' ||
          prop === '-webkit-text-stroke-color'
        ) {
          return !shouldStripTextColor(value);
        }

        return true;
      });

      const next = filtered.join('; ').replace(/;;+/g, ';').trim();
      if (!next) el.removeAttribute('style');
      else el.setAttribute('style', next);
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};
