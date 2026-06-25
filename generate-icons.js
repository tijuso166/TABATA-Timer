#!/usr/bin/env node
/**
 * Generates icon-192.png and icon-512.png for the Tabata Timer PWA.
 * Run with: node generate-icons.js
 * No external dependencies required.
 */
const zlib = require('zlib');
const fs   = require('fs');

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c;
    }
    return t;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG helpers ────────────────────────────────────────────────────────────
function pngChunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(d.length);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])));
    return Buffer.concat([len, t, d, crcBuf]);
}

function makePNG(size, draw) {
    // RGBA pixel buffer
    const px = new Uint8Array(size * size * 4); // default: transparent black

    draw(px, size);

    // Build raw filter-0 scanlines
    const raw = Buffer.allocUnsafe((size * 4 + 1) * size);
    for (let y = 0; y < size; y++) {
        const row = y * (size * 4 + 1);
        raw[row] = 0; // filter: None
        for (let x = 0; x < size; x++) {
            const pi = (y * size + x) * 4;
            const ri = row + 1 + x * 4;
            raw[ri]     = px[pi];
            raw[ri + 1] = px[pi + 1];
            raw[ri + 2] = px[pi + 2];
            raw[ri + 3] = px[pi + 3];
        }
    }

    const compressed = zlib.deflateSync(raw, { level: 9 });

    const ihdr = Buffer.allocUnsafe(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8]  = 8; // bit depth
    ihdr[9]  = 6; // RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
}

// ── Icon drawing ───────────────────────────────────────────────────────────
function setPixel(px, size, x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    // Simple alpha-over blending
    const i   = (Math.round(y) * size + Math.round(x)) * 4;
    const sa  = a / 255;
    const da  = px[i + 3] / 255;
    const oa  = sa + da * (1 - sa);
    if (oa <= 0) return;
    px[i]     = Math.round((r * sa + px[i]     * da * (1 - sa)) / oa);
    px[i + 1] = Math.round((g * sa + px[i + 1] * da * (1 - sa)) / oa);
    px[i + 2] = Math.round((b * sa + px[i + 2] * da * (1 - sa)) / oa);
    px[i + 3] = Math.round(oa * 255);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawIcon(px, size) {
    const cx = size / 2;
    const cy = size / 2;

    // 1. Black background
    for (let i = 0; i < size * size * 4; i += 4) {
        px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 255;
    }

    // 2. Gradient ring  (orange #ff6b35 → red #e8001e)
    const outerR = size * 0.40;
    const innerR = size * 0.30;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx   = x - cx;
            const dy   = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < innerR - 1.5 || dist > outerR + 1.5) continue;

            // Gradient angle 0→1 (clockwise from top)
            const angle = Math.atan2(dy, dx);            // -π … π
            const t     = ((angle + Math.PI) / (2 * Math.PI));

            const r = Math.round(lerp(0xff, 0xe8, t));
            const g = Math.round(lerp(0x6b, 0x00, t));
            const b = Math.round(lerp(0x35, 0x1e, t));

            // Anti-alias at ring edges
            const edgeDist = Math.min(dist - innerR, outerR - dist);
            const alpha    = Math.min(1, Math.max(0, edgeDist + 1)) * 255;

            setPixel(px, size, x, y, r, g, b, alpha);
        }
    }

    // 3. White "T" letterform (centered)
    const lh     = size * 0.30;  // letter height
    const lw     = size * 0.24;  // bar width
    const bh     = size * 0.07;  // bar (crossbar) height
    const sw     = size * 0.07;  // stem width

    const lx = cx - lw / 2;
    const ly = cy - lh / 2;

    // Crossbar
    for (let y = Math.floor(ly); y < Math.ceil(ly + bh); y++) {
        for (let x = Math.floor(lx); x < Math.ceil(lx + lw); x++) {
            setPixel(px, size, x, y, 255, 255, 255, 255);
        }
    }
    // Stem
    const sx = cx - sw / 2;
    for (let y = Math.floor(ly); y < Math.ceil(ly + lh); y++) {
        for (let x = Math.floor(sx); x < Math.ceil(sx + sw); x++) {
            setPixel(px, size, x, y, 255, 255, 255, 255);
        }
    }
}

// ── Generate ───────────────────────────────────────────────────────────────
[192, 512].forEach(size => {
    const buf = makePNG(size, drawIcon);
    const file = `icon-${size}.png`;
    fs.writeFileSync(file, buf);
    console.log(`✓ ${file}  (${(buf.length / 1024).toFixed(1)} KB)`);
});
