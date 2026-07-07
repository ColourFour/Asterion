# Student Progress Export and Import System

Date: 2026-07-07

## 1. Current localStorage keys used

- `asterion.progress.v1`: the full static student progress record. This includes lesson completions, Checked Practice attempts, Exam Training attempts, diagnostic/P1 repair records, review/error history, knowledge-state records, export profile metadata, and progress settings.
- `asterion.theme.v1`: the local theme preference, currently `dark` or `light`.

The export/import system reads and writes only these two Asterion keys. It does not enumerate or expose unrelated browser storage.

## 2. Export format

Export creates `asterion-progress-YYYY-MM-DD.json`.

The JSON wrapper is versioned independently from the progress object:

```json
{
  "kind": "asterion-progress-export",
  "schemaVersion": 1,
  "exportedAt": "2026-07-07T00:00:00.000Z",
  "storageKeys": ["asterion.progress.v1", "asterion.theme.v1"],
  "progressStorageKey": "asterion.progress.v1",
  "progress": {
    "schemaVersion": 1
  },
  "settings": {
    "theme": "light"
  }
}
```

`progress` is the normalized existing `asterion.progress.v1` object, preserving the current storage shape instead of introducing a second progress schema.

## 3. Import behavior

- The student clicks `Import`, selects a `.json` file, and the browser reads it locally.
- The file must have `kind: "asterion-progress-export"` and export `schemaVersion: 1`.
- The embedded progress object must have supported progress `schemaVersion` and the required core fields: `attempts`, `learningActivityAttempts`, `skillCheckAttempts`, `regionLearning`, and `settings`.
- Malformed JSON, non-Asterion files, unsupported future versions, and incomplete progress objects are rejected before storage is modified.
- Before replacement, the browser confirmation summarizes current and incoming progress. Cancelling keeps existing progress.
- On confirmation, only `asterion.progress.v1` is replaced. `asterion.theme.v1` is restored only when the export contains a valid `dark` or `light` theme.
- The current page refreshes progress text, review groups, gates, and teacher summaries after import without requiring accounts or a server.

## 4. Migration strategy

There are two version markers:

- Export wrapper `schemaVersion`: currently `1`.
- Stored progress `schemaVersion`: currently `1`.

Future migrations should add an import migration function keyed by wrapper/progress version before calling the existing progress normalizer. Unsupported newer versions are rejected rather than partially imported. The runtime still keeps the existing localStorage schema tolerant by normalizing missing legacy fields to defaults.

## 5. Testing performed

- `npm test`: passed. 20 test files and 239 tests completed successfully.
- `npm run build`: passed. Generated 57 static HTML pages in `docs/`.
- `npm run static:check`: first sandboxed browser launch failed with macOS Chromium Mach port permissions. Rerun outside the sandbox passed: static HTML check, rendered static page check, static interaction audit, and P3 Learn/Checked Practice browser checks.
- Live browser export/import smoke test: passed. Exported a valid `asterion-progress-export` JSON wrapper with schema version `1`, progress schema version `1`, and only the Asterion storage keys; imported it after confirmation; verified progress history normalization and theme restoration.
- Live browser response-history smoke test: passed. A wrong Learn response saved Learn-only attempt history without creating Checked Practice evidence. A wrong then correct Checked Practice retry appended response-history records with attempt numbers `1` and `2` and marked the form passed after the correct retry.
