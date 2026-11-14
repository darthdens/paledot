// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useSurfaceAttachments } from '../state/surfaceAttachments';
/** Rendered inside a body's spinning mesh so attachments turn with the texture. Empty unless registered. */
export function SurfaceSlot({ bodyId }: { bodyId: string }) {
  const items = useSurfaceAttachments(bodyId);
  const keys = Object.keys(items);
  if (!keys.length) return null;
  return <group name={`surface-${bodyId}`}>{keys.map(k => <group key={k}>{items[k]}</group>)}</group>;
}
