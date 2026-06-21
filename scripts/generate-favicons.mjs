import sharp from "sharp";
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/logo.png");

const trimmed = await sharp(source)
  .ensureAlpha()
  .trim({ threshold: 1 })
  .toBuffer();

async function writeIcon(size, relativePath) {
  const out = join(root, relativePath);
  await sharp(trimmed)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", relativePath);
}

await writeIcon(16, "public/favicon-16.png");
await writeIcon(32, "public/favicon-32.png");
await writeIcon(48, "public/favicon-48.png");
await writeIcon(180, "public/apple-touch-icon.png");
await writeIcon(192, "public/icon-192.png");

await writeIcon(32, "src/app/icon.png");
await writeIcon(180, "src/app/apple-icon.png");

console.log("favicons generated from public/logo.png (transparent, no flatten)");
