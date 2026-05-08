# Avatar Assets

Drop layered Avatar Builder PNGs in this folder. The builder reads `src/data/avatarCatalog.ts`, so real assets can replace placeholders without component rewrites.

Expected folders:

```text
public/assets/avatar/base/
public/assets/avatar/hair/
public/assets/avatar/face/
public/assets/avatar/outfit/
public/assets/avatar/cloak/
public/assets/avatar/accessory/
public/assets/avatar/aura/
public/assets/avatar/companion/
public/assets/avatar/frame/
public/assets/avatar/preview/
```

Each production layer should be a transparent 512x512 PNG with the same character alignment and canvas as every other layer. File names should match the catalog item ID, for example:

```text
public/assets/avatar/base/academy-student-base.png
public/assets/avatar/hair/practical-crop.png
public/assets/avatar/cloak/apprentice-cloak.png
public/assets/avatar/preview/apprentice-cloak.png
```

If a file is absent or fails to load, the Avatar Builder keeps using safe CSS placeholder layers. Tests do not require production art.
