import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "public", "icons");

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3d8b6e"/>
      <stop offset="100%" style="stop-color:#2f6f58"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.42}" r="${size * 0.14}" fill="#ffffff" opacity="0.95"/>
  <path d="M ${size * 0.32} ${size * 0.62} Q ${size * 0.5} ${size * 0.78} ${size * 0.68} ${size * 0.62}" stroke="#ffffff" stroke-width="${size * 0.04}" fill="none" stroke-linecap="round"/>
  <path d="M ${size * 0.28} ${size * 0.38} L ${size * 0.36} ${size * 0.46} M ${size * 0.72} ${size * 0.38} L ${size * 0.64} ${size * 0.46}" stroke="#ffffff" stroke-width="${size * 0.035}" stroke-linecap="round"/>
</svg>`;

await mkdir(root, { recursive: true });

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const buffer = await sharp(Buffer.from(svg(size))).png().toBuffer();
  await writeFile(path.join(root, `icon-${size}x${size}.png`), buffer);
}

await writeFile(
  path.join(root, "apple-touch-icon.png"),
  await sharp(Buffer.from(svg(180))).png().toBuffer(),
);

console.log("Generated PWA icons in public/icons/");
