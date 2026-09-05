/**
 * Minimal store-only ZIP writer.
 *
 * The archive we build holds PDFs, which are already compressed, so deflating
 * them again would cost CPU for almost no saving — "stored" entries keep this
 * dependency-free and fast. Filenames are flagged UTF-8 (bit 11) so Arabic
 * participant names survive in Windows Explorer, macOS Finder and unzip(1).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Bytes): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* MS-DOS packed time/date, the only timestamp a classic ZIP entry carries. */
function dosStamp(d: Date) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  };
}

/* Byte views backed by a plain ArrayBuffer — what Blob accepts directly. */
export type Bytes = Uint8Array<ArrayBuffer>;

export type ZipEntry = { name: string; data: Bytes };

export function createZip(entries: ZipEntry[], when = new Date()): Blob {
  const enc = new TextEncoder();
  const { time, date } = dosStamp(when);
  const parts: Bytes[] = [];
  const central: Bytes[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = enc.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename
    lv.setUint16(8, 0, true); // method: stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed
    lv.setUint32(22, size, true); // uncompressed
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, entry.data);

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // central directory header
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); // offset of the local header
    cd.set(name, 46);
    central.push(cd);

    offset += local.length + size;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central directory
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end], { type: "application/zip" });
}

/* Strips characters that Windows/macOS reject in a filename while keeping
   Arabic letters intact, then de-duplicates so two "أحمد" rows don't collide. */
export function safeFileName(raw: string, fallback = "file") {
  const clean = (raw || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 80)
    .trim();
  return clean || fallback;
}

export function uniqueName(taken: Set<string>, base: string, ext: string) {
  let name = `${base}${ext}`;
  let n = 2;
  while (taken.has(name.toLowerCase())) {
    name = `${base} (${n})${ext}`;
    n += 1;
  }
  taken.add(name.toLowerCase());
  return name;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
