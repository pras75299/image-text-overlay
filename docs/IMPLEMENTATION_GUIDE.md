# Overlayly Features Implementation Guide

**Branch:** `pras75299-features-implementation`

## Overview

This guide documents the implementation of new features for the Overlayly (Text Behind Object) app. Features are implemented incrementally with separate commits for each.

---

## Phase 1: Core Features (High Impact)

### Feature 1: Multiple Text Layers
**Status:** In Progress | **Priority:** P0

**Description:** Support multiple text blocks per image with individual positioning, styling, and layer ordering.

**Implementation Plan:**
1. Define `TextLayer` type: `{ id, content, position, fontSize, fontFamily, fontWeight, color, opacity, rotation }`
2. Replace single text state with `textLayers: TextLayer[]` array
3. Add `selectedLayerId: string | null` for active layer
4. Create layer list UI with add/remove/select/duplicate actions
5. Support layer ordering (bring forward/send backward)
6. Refactor drag handlers to work per-layer
7. Update canvas export to render all layers in correct z-order

**Files to modify:**
- `src/components/TextBehindEditor.tsx` (main logic)

** acceptance criteria:**
- [ ] Add multiple text layers
- [ ] Select layer to edit its properties
- [ ] Remove individual layers
- [ ] Duplicate layers
- [ ] Reorder layers (optional for v1)
- [ ] Export includes all layers correctly

---

### Feature 2: Undo/Redo
**Status:** Pending | **Priority:** P0

**Description:** History stack for text changes; keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).

**Implementation Plan:**
1. Create `useHistory` hook with `{ past, present, future }` state
2. Push snapshot on: add/remove layer, position change, style change
3. Limit history size (e.g. 50 steps)
4. Wire Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
5. Disable undo/redo buttons when stack empty

**Files to create:**
- `src/hooks/useHistory.ts`

**Files to modify:**
- `src/components/TextBehindEditor.tsx`

**Acceptance criteria:**
- [ ] Undo reverts last change
- [ ] Redo reapplies undone change
- [ ] Keyboard shortcuts work
- [ ] History capped to prevent memory bloat

---

### Feature 3: Export Format Options
**Status:** Pending | **Priority:** P1

**Description:** Download as PNG, JPEG, or WebP; optional resolution scale.

**Implementation Plan:**
1. Add export options UI: format dropdown, quality slider (JPEG/WebP)
2. Modify `handleDownload` to use `canvas.toBlob` with format
3. Set filename extension based on format
4. Optional: 1x, 2x resolution toggle

**Files to modify:**
- `src/components/TextBehindEditor.tsx`
- Create `src/components/ExportOptions.tsx` (optional extracted component)

**Acceptance criteria:**
- [ ] PNG export (default)
- [ ] JPEG export with quality
- [ ] WebP export with quality
- [ ] Correct file extension on download

---

### Feature 4: Enhanced Font Library
**Status:** Pending | **Priority:** P1

**Description:** Add Google Fonts; font search/filter.

**Implementation Plan:**
1. Add Google Fonts loader (e.g. `@fontsource` or dynamic link)
2. Curate initial list of ~20–30 popular fonts
3. Load fonts on demand or on app init
4. Add font preview in dropdown
5. Ensure fonts render correctly in canvas export

**Files to modify:**
- `src/components/TextBehindEditor.tsx` or `TextControls`
- `index.html` (add Google Fonts link) or `src/lib/fonts.ts`

**Acceptance criteria:**
- [ ] 10+ Google Fonts available
- [ ] Fonts display correctly in preview
- [ ] Export uses selected font

---

### Feature 5: Background Customization
**Status:** Pending | **Priority:** P1

**Description:** Replace background with solid color, gradient, or blur.

**Implementation Plan:**
1. Add background mode: `original | solid | gradient | blur`
2. Solid: color picker
3. Gradient: direction + 2 color stops
4. Blur: draw blurred version of original background
5. Apply before drawing text in export

**Files to modify:**
- `src/components/TextBehindEditor.tsx`
- Create `src/components/BackgroundControls.tsx`

**Acceptance criteria:**
- [ ] Solid color background
- [ ] Gradient background
- [ ] Blurred background
- [ ] Original (default) preserved

---

## Phase 2: UX Enhancements

### Feature 6: Keyboard Shortcuts
**Status:** Pending | **Priority:** P2

**Implementation Plan:**
- Arrow keys: nudge selected text
- Delete/Backspace: remove selected layer
- Escape: deselect
- Add shortcuts help modal (optional)

### Feature 7: Text Effects (Shadow, Outline)
**Status:** Pending | **Priority:** P2

**Implementation Plan:**
- Canvas `shadowColor`, `shadowBlur`, `shadowOffset`
- Canvas `strokeText` for outline
- UI toggles for shadow/outline

### Feature 8: Copy to Clipboard
**Status:** Pending | **Priority:** P2

**Implementation Plan:**
- `navigator.clipboard.write` with blob
- Fallback for older browsers

---

## Phase 3: Polish

### Feature 9: Dark Mode Toggle
### Feature 10: Responsive/Mobile Improvements
### Feature 11: Recent Images (LocalStorage)

---

## Commit Convention

Each feature commit: `pras75299: feat: <feature-name>`

Example: `pras75299: feat: add multiple text layers`

---

## Testing Checklist (Manual)

- [ ] Upload image → segmentation works
- [ ] Add/edit/remove text layers
- [ ] Drag text to reposition
- [ ] Download in each format
- [ ] Undo/redo works
- [ ] Mobile touch drag works
