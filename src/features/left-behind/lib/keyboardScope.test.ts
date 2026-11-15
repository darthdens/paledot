// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect, it } from 'vitest';
import { isSceneShortcutTarget } from './keyboardScope';
it('allows scene shortcuts from the canvas', () => { expect(isSceneShortcutTarget(document.createElement('canvas'))).toBe(true); });
it('does not steal Space from a tour button', () => { expect(isSceneShortcutTarget(document.createElement('button'))).toBe(false); });
it('does not steal arrow keys from the date input', () => { const input=document.createElement('input');input.type='date';expect(isSceneShortcutTarget(input)).toBe(false); });
it('does not activate planets while a dialog is focused', () => { const dialog=document.createElement('div'),child=document.createElement('span');dialog.setAttribute('role','dialog');dialog.append(child);expect(isSceneShortcutTarget(child)).toBe(false); });