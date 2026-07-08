# Math Input Editor Audit

Date: 2026-07-08

## User-reported failures

1. Clicking the answer field did not show the math keyboard.
2. Typing with the physical keyboard inserted values in reverse order.

## Root causes

The editor display was mounted inside a `<label>` that also contained the hidden raw `submittedAnswer` input. Clicking the display opened the editor, but the label default action then sent a synthetic click/focus to the hidden input. The document-level outside-click handler treated that raw input click as outside the editor and closed the keyboard immediately.

The visible display also focused the hidden raw input. Physical keyboard input could therefore go to the backing input instead of the editor display. Because the editor caret state was initialized at position `0`, direct native input events could keep resetting the caret to the start, producing reversed text order.

The previous checks verified that editor markup existed, but they did not verify that clicking the visible field kept the keyboard open or that typed characters preserved order.

## Fixes applied

- The visible `.math-editor-display` now prevents label default activation and keeps focus on the visible editor.
- Toolbar button clicks stop propagation and return focus to the visible editor after inserting.
- Editor insert/delete/clear operations dispatch marked internal input events.
- Native/non-editor raw input events now derive caret position from `selectionStart` or the end of the new value instead of blindly reusing the stored editor caret.
- The rendered static check now clicks a visible math editor, asserts the keyboard panel stays open, types `1`, `2`, `3`, and asserts the submitted raw value is exactly `123`.

## Verification

- `npm run build`: passed.
- `npm test`: passed, 20 files / 239 tests.
- `npm run static:check`: passed, including the new click-open and physical-key typing-order regression.

## Remaining limitation

This remains a lightweight static editor backed by the existing checker format. It is not a full equation editor or symbolic parser, and it still does not broaden accepted answer meanings.
