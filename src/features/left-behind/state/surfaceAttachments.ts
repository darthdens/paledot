// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { ReactNode } from 'react';
import { create } from 'zustand';
/** Children rendered inside a body's spinning mesh (see SurfaceSlot), keyed by body id then item key. */
type Attachments = { items: Record<string, Record<string, ReactNode>>; set: (bodyId: string, key: string, node: ReactNode | null) => void };
export const useSurfaceAttachmentStore = create<Attachments>(set => ({
  items: {},
  set: (bodyId, key, node) => set(s => {
    const body = { ...(s.items[bodyId] ?? {}) };
    if (node === null) delete body[key]; else body[key] = node;
    return { items: { ...s.items, [bodyId]: body } };
  }),
}));
const EMPTY: Record<string, ReactNode> = {};
export const useSurfaceAttachments = (bodyId: string) => useSurfaceAttachmentStore(s => s.items[bodyId] ?? EMPTY);
