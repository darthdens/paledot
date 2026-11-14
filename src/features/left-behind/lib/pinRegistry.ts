// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
/** World positions of landed pins, keyed by trajectory id; written by surface pins each frame. */
export const landedPins = new Map<string, { world: [number, number, number]; body: 'moon' | 'mars'; normal: [number, number, number] }>();
export const SURFACE_BODY: Record<string, 'moon' | 'mars'> = { 'apollo-11': 'moon', 'apollo-15': 'moon', 'apollo-16': 'moon', 'apollo-17': 'moon', 'viking-1': 'mars', opportunity: 'mars', ingenuity: 'mars' };
