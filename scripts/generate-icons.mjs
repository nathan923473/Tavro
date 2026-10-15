import sharp from "sharp";
import { access, constants, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "public", "branding", "tavro-logo-source.png");
const iconsDir = path.join(root, "public", "icons");
const brandingDir = path.join(root, "public", "branding");
const appDir = path.join(root, "src", "app");

/** Matches Tavro light surfaces; logo artwork already includes its own squircle background. */
const ICON_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

async function ensureSource() {
  try {
    await access(sourcePath, constants.R_OK);
  } catch {
    console.error(
      "Missing public/branding/tavro-logo-source.png — add the logo source PNG, then run npm run icons again.",
    );
    process.exit(1);
  }
}

function renderSquare(size) {
  return sharp(sourcePath)
    .resize(size, size, {
      fit: "contain",
      background: ICON_BACKGROUND,
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

/** Extra padding for Android maskable safe zone (~80% visible). */
function renderMaskable(size) {
  const inner = Math.round(size * 0.72);
  return sharp(sourcePath)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .extend({
      top: Math.floor((size - inner) / 2),
      bottom: Math.ceil((size - inner) / 2),
      left: Math.floor((size - inner) / 2),
      right: Math.ceil((size - inner) / 2),
      background: ICON_BACKGROUND,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await ensureSource();
await mkdir(iconsDir, { recursive: true });
await mkdir(brandingDir, { recursive: true });
await mkdir(appDir, { recursive: true });

const pwaSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

for (const size of pwaSizes) {
  await writeFile(path.join(iconsDir, `icon-${size}x${size}.png`), await renderSquare(size));
}

await writeFile(
  path.join(iconsDir, "apple-touch-icon.png"),
  await renderSquare(180),
);

await writeFile(
  path.join(iconsDir, "icon-maskable-512x512.png"),
  await renderMaskable(512),
);

for (const size of [64, 128, 256]) {
  await writeFile(
    path.join(brandingDir, `logo-mark-${size}.png`),
    await renderSquare(size),
  );
}

await writeFile(path.join(appDir, "icon.png"), await renderSquare(32));
await writeFile(path.join(appDir, "apple-icon.png"), await renderSquare(180));

console.log("Generated Tavro icons from public/branding/tavro-logo-source.png");
