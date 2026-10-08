import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "public", "icons");

const ROYAL = "#3156E8";
const MINT = "#B8F4DA";

const svg = (size) => {
  const rx = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.42);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${ROYAL}"/>
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.12}" fill="${MINT}" opacity="0.9"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="800"
    font-size="${fontSize}" fill="#ffffff">T</text>
</svg>`;
};

await mkdir(root, { recursive: true });

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const buffer = await sharp(Buffer.from(svg(size))).png().toBuffer();
  await writeFile(path.join(root, `icon-${size}x${size}.png`), buffer);
}

await writeFile(
  path.join(root, "apple-touch-icon.png"),
  await sharp(Buffer.from(svg(180))).png().toBuffer(),
);

console.log("Generated Tavro PWA icons in public/icons/");
