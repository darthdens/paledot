// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
/** Scene shortcuts must not steal keys from controls, editable text or dialogs. */
export function isSceneShortcutTarget(target: EventTarget | null) {
  return !(target instanceof Element) || !target.closest('button,a,input,textarea,select,[role="dialog"],[role="switch"],[contenteditable="true"]');
}