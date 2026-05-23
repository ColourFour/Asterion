# Avatar Assets v0.2

This is the active Avatar Builder art set. Runtime wiring lives in `src/data/avatarCatalog.ts`; components should consume catalog items and must not hard-code asset paths.

Current folders:

```text
public/assets/avatar-v0.2/base/
public/assets/avatar-v0.2/hair/
public/assets/avatar-v0.2/face/
public/assets/avatar-v0.2/outfit/
public/assets/avatar-v0.2/preview/
```

The archived v0.1 placeholder set lives at:

```text
public/assets/avatar-archive/v0.1-original/
```

Empty cloak, accessory, aura, companion, and frame slots are represented by manifest entries marked `isEmpty`; v0.2 does not need transparent no-op PNGs for those slots.
