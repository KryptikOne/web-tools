/**
 * Inspect and strip metadata (EXIF, XMP, ICC, comments) from JPEG, PNG and WebP
 * files without re-encoding pixel data.
 */

export type ImageFormat = "jpeg" | "png" | "webp";

export interface MetadataSegment {
	/** Container-level chunk/segment name, e.g. "APP1 (EXIF)", "tEXt", "XMP " */
	name: string;
	kind: "exif" | "xmp" | "icc" | "comment" | "other";
	size: number;
}

export interface GpsInfo {
	latitude: number;
	longitude: number;
	altitude?: number;
}

export interface ExifSummary {
	make?: string;
	model?: string;
	software?: string;
	dateTime?: string;
	dateTimeOriginal?: string;
	orientation?: number;
	artist?: string;
	copyright?: string;
	lensModel?: string;
	exposureTime?: string;
	fNumber?: string;
	iso?: number;
	focalLength?: string;
	gps?: GpsInfo;
}

export interface ImageMetadataReport {
	format: ImageFormat;
	segments: MetadataSegment[];
	exif?: ExifSummary;
	hasXmp: boolean;
	hasIcc: boolean;
	hasComments: boolean;
}

export interface StripOptions {
	/** Remove EXIF (including GPS) and XMP. Default true. */
	exif?: boolean;
	/** Remove ICC colour profile. Default false, because it changes how colours render. */
	icc?: boolean;
	/** Remove free-text comments (JPEG COM, PNG tEXt/zTXt/iTXt). Default true. */
	comments?: boolean;
}

export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
		bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
	) {
		return "png";
	}
	if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
	return null;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
	let s = "";
	for (let i = start; i < start + length && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return s;
}

// ─── EXIF (TIFF) parsing ─────────────────────────────────────────────────────

const TAG = {
	make: 0x010f,
	model: 0x0110,
	orientation: 0x0112,
	software: 0x0131,
	dateTime: 0x0132,
	artist: 0x013b,
	copyright: 0x8298,
	exifIfd: 0x8769,
	gpsIfd: 0x8825,
	exposureTime: 0x829a,
	fNumber: 0x829d,
	iso: 0x8827,
	dateTimeOriginal: 0x9003,
	focalLength: 0x920a,
	lensModel: 0xa434,
	gpsLatRef: 0x0001,
	gpsLat: 0x0002,
	gpsLonRef: 0x0003,
	gpsLon: 0x0004,
	gpsAltRef: 0x0005,
	gpsAlt: 0x0006,
} as const;

type IfdEntry = { tag: number; type: number; count: number; valueOffset: number };

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readIfd(view: DataView, offset: number, little: boolean): IfdEntry[] {
	if (offset + 2 > view.byteLength) return [];
	const count = view.getUint16(offset, little);
	const entries: IfdEntry[] = [];
	for (let i = 0; i < count; i++) {
		const e = offset + 2 + i * 12;
		if (e + 12 > view.byteLength) break;
		entries.push({
			tag: view.getUint16(e, little),
			type: view.getUint16(e + 2, little),
			count: view.getUint32(e + 4, little),
			valueOffset: e + 8,
		});
	}
	return entries;
}

function entryDataOffset(view: DataView, entry: IfdEntry, little: boolean): number {
	const size = (TYPE_SIZE[entry.type] ?? 1) * entry.count;
	return size <= 4 ? entry.valueOffset : view.getUint32(entry.valueOffset, little);
}

function readString(view: DataView, entry: IfdEntry, little: boolean): string | undefined {
	if (entry.type !== 2) return undefined;
	const off = entryDataOffset(view, entry, little);
	let s = "";
	for (let i = 0; i < entry.count && off + i < view.byteLength; i++) {
		const c = view.getUint8(off + i);
		if (c === 0) break;
		s += String.fromCharCode(c);
	}
	return s.trim() || undefined;
}

function readNumber(view: DataView, entry: IfdEntry, little: boolean): number | undefined {
	const off = entryDataOffset(view, entry, little);
	if (off + (TYPE_SIZE[entry.type] ?? 1) > view.byteLength) return undefined;
	switch (entry.type) {
		case 1: return view.getUint8(off);
		case 3: return view.getUint16(off, little);
		case 4: return view.getUint32(off, little);
		case 9: return view.getInt32(off, little);
		default: return undefined;
	}
}

function readRationals(view: DataView, entry: IfdEntry, little: boolean): number[] {
	if (entry.type !== 5 && entry.type !== 10) return [];
	const off = entryDataOffset(view, entry, little);
	const out: number[] = [];
	for (let i = 0; i < entry.count; i++) {
		const p = off + i * 8;
		if (p + 8 > view.byteLength) break;
		const num = entry.type === 5 ? view.getUint32(p, little) : view.getInt32(p, little);
		const den = entry.type === 5 ? view.getUint32(p + 4, little) : view.getInt32(p + 4, little);
		out.push(den === 0 ? 0 : num / den);
	}
	return out;
}

function formatExposure(v: number | undefined): string | undefined {
	if (v === undefined || v <= 0) return undefined;
	return v >= 1 ? `${Number(v.toFixed(1))} s` : `1/${Math.round(1 / v)} s`;
}

/** Parse a TIFF/EXIF block (starting at the byte-order mark) into a summary. */
export function parseExif(tiff: Uint8Array): ExifSummary | undefined {
	if (tiff.length < 8) return undefined;
	const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
	const bom = ascii(tiff, 0, 2);
	if (bom !== "II" && bom !== "MM") return undefined;
	const little = bom === "II";
	const ifd0 = view.getUint32(4, little);
	const summary: ExifSummary = {};

	const entries0 = readIfd(view, ifd0, little);
	let exifOffset: number | undefined;
	let gpsOffset: number | undefined;
	for (const e of entries0) {
		switch (e.tag) {
			case TAG.make: summary.make = readString(view, e, little); break;
			case TAG.model: summary.model = readString(view, e, little); break;
			case TAG.software: summary.software = readString(view, e, little); break;
			case TAG.dateTime: summary.dateTime = readString(view, e, little); break;
			case TAG.artist: summary.artist = readString(view, e, little); break;
			case TAG.copyright: summary.copyright = readString(view, e, little); break;
			case TAG.orientation: summary.orientation = readNumber(view, e, little); break;
			case TAG.exifIfd: exifOffset = readNumber(view, e, little); break;
			case TAG.gpsIfd: gpsOffset = readNumber(view, e, little); break;
		}
	}

	if (exifOffset !== undefined) {
		for (const e of readIfd(view, exifOffset, little)) {
			switch (e.tag) {
				case TAG.dateTimeOriginal: summary.dateTimeOriginal = readString(view, e, little); break;
				case TAG.lensModel: summary.lensModel = readString(view, e, little); break;
				case TAG.iso: summary.iso = readNumber(view, e, little); break;
				case TAG.exposureTime: summary.exposureTime = formatExposure(readRationals(view, e, little)[0]); break;
				case TAG.fNumber: {
					const f = readRationals(view, e, little)[0];
					if (f) summary.fNumber = `f/${Number(f.toFixed(1))}`;
					break;
				}
				case TAG.focalLength: {
					const f = readRationals(view, e, little)[0];
					if (f) summary.focalLength = `${Number(f.toFixed(1))} mm`;
					break;
				}
			}
		}
	}

	if (gpsOffset !== undefined) {
		let latRef = "N";
		let lonRef = "E";
		let lat: number[] = [];
		let lon: number[] = [];
		let altRef = 0;
		let alt: number | undefined;
		for (const e of readIfd(view, gpsOffset, little)) {
			switch (e.tag) {
				case TAG.gpsLatRef: latRef = readString(view, e, little) ?? "N"; break;
				case TAG.gpsLonRef: lonRef = readString(view, e, little) ?? "E"; break;
				case TAG.gpsLat: lat = readRationals(view, e, little); break;
				case TAG.gpsLon: lon = readRationals(view, e, little); break;
				case TAG.gpsAltRef: altRef = readNumber(view, e, little) ?? 0; break;
				case TAG.gpsAlt: alt = readRationals(view, e, little)[0]; break;
			}
		}
		if (lat.length >= 1 && lon.length >= 1) {
			const toDeg = (p: number[]) => (p[0] ?? 0) + (p[1] ?? 0) / 60 + (p[2] ?? 0) / 3600;
			const latitude = toDeg(lat) * (latRef.toUpperCase().startsWith("S") ? -1 : 1);
			const longitude = toDeg(lon) * (lonRef.toUpperCase().startsWith("W") ? -1 : 1);
			summary.gps = { latitude, longitude };
			if (alt !== undefined) summary.gps.altitude = altRef === 1 ? -alt : alt;
		}
	}

	return Object.keys(summary).length ? summary : undefined;
}

// ─── JPEG ────────────────────────────────────────────────────────────────────

interface JpegSegment {
	marker: number;
	start: number; // offset of 0xFF
	end: number; // offset after segment
	dataStart: number;
	dataLength: number;
}

function walkJpeg(bytes: Uint8Array): { segments: JpegSegment[]; sosOffset: number } {
	const segments: JpegSegment[] = [];
	let pos = 2;
	while (pos + 4 <= bytes.length) {
		if (bytes[pos] !== 0xff) break;
		const marker = bytes[pos + 1];
		if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) {
			pos += 2;
			continue;
		}
		if (marker === 0xda) return { segments, sosOffset: pos }; // Start of scan: image data follows
		const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
		segments.push({ marker, start: pos, end: pos + 2 + length, dataStart: pos + 4, dataLength: length - 2 });
		pos += 2 + length;
	}
	return { segments, sosOffset: pos };
}

function classifyJpegSegment(bytes: Uint8Array, seg: JpegSegment): MetadataSegment | null {
	const head = ascii(bytes, seg.dataStart, 29);
	if (seg.marker === 0xe1 && head.startsWith("Exif\0")) return { name: "APP1 (EXIF)", kind: "exif", size: seg.dataLength };
	if (seg.marker === 0xe1 && head.startsWith("http://ns.adobe.com/xap/1.0/")) return { name: "APP1 (XMP)", kind: "xmp", size: seg.dataLength };
	if (seg.marker === 0xe1 && head.startsWith("http://ns.adobe.com/xmp/extension/")) return { name: "APP1 (XMP ext)", kind: "xmp", size: seg.dataLength };
	if (seg.marker === 0xe2 && head.startsWith("ICC_PROFILE")) return { name: "APP2 (ICC)", kind: "icc", size: seg.dataLength };
	if (seg.marker === 0xed && head.startsWith("Photoshop")) return { name: "APP13 (IPTC/Photoshop)", kind: "exif", size: seg.dataLength };
	if (seg.marker === 0xfe) return { name: "COM", kind: "comment", size: seg.dataLength };
	if (seg.marker >= 0xe0 && seg.marker <= 0xef && seg.marker !== 0xe0) {
		return { name: `APP${seg.marker - 0xe0}`, kind: "other", size: seg.dataLength };
	}
	return null;
}

// ─── PNG ─────────────────────────────────────────────────────────────────────

interface PngChunk {
	type: string;
	start: number;
	end: number;
	dataStart: number;
	length: number;
}

function walkPng(bytes: Uint8Array): PngChunk[] {
	const chunks: PngChunk[] = [];
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let pos = 8;
	while (pos + 12 <= bytes.length) {
		const length = view.getUint32(pos);
		const type = ascii(bytes, pos + 4, 4);
		chunks.push({ type, start: pos, end: pos + 12 + length, dataStart: pos + 8, length });
		pos += 12 + length;
		if (type === "IEND") break;
	}
	return chunks;
}

const PNG_TEXT = new Set(["tEXt", "zTXt", "iTXt"]);

function classifyPngChunk(c: PngChunk): MetadataSegment | null {
	if (c.type === "eXIf") return { name: "eXIf", kind: "exif", size: c.length };
	if (c.type === "iCCP") return { name: "iCCP", kind: "icc", size: c.length };
	if (c.type === "tIME") return { name: "tIME", kind: "comment", size: c.length };
	if (PNG_TEXT.has(c.type)) return { name: c.type, kind: "comment", size: c.length };
	return null;
}

// ─── WebP ────────────────────────────────────────────────────────────────────

interface RiffChunk {
	fourcc: string;
	start: number;
	end: number; // includes padding byte
	dataStart: number;
	length: number;
}

function walkWebp(bytes: Uint8Array): RiffChunk[] {
	const chunks: RiffChunk[] = [];
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let pos = 12;
	while (pos + 8 <= bytes.length) {
		const fourcc = ascii(bytes, pos, 4);
		const length = view.getUint32(pos + 4, true);
		const padded = length + (length % 2);
		chunks.push({ fourcc, start: pos, end: pos + 8 + padded, dataStart: pos + 8, length });
		pos += 8 + padded;
	}
	return chunks;
}

function classifyWebpChunk(c: RiffChunk): MetadataSegment | null {
	if (c.fourcc === "EXIF") return { name: "EXIF", kind: "exif", size: c.length };
	if (c.fourcc === "XMP ") return { name: "XMP", kind: "xmp", size: c.length };
	if (c.fourcc === "ICCP") return { name: "ICCP", kind: "icc", size: c.length };
	return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function inspectImageMetadata(bytes: Uint8Array): ImageMetadataReport | null {
	const format = detectImageFormat(bytes);
	if (!format) return null;
	const segments: MetadataSegment[] = [];
	let exif: ExifSummary | undefined;

	if (format === "jpeg") {
		for (const seg of walkJpeg(bytes).segments) {
			const meta = classifyJpegSegment(bytes, seg);
			if (!meta) continue;
			segments.push(meta);
			if (meta.name === "APP1 (EXIF)" && !exif) {
				exif = parseExif(bytes.subarray(seg.dataStart + 6, seg.dataStart + seg.dataLength));
			}
		}
	} else if (format === "png") {
		for (const c of walkPng(bytes)) {
			const meta = classifyPngChunk(c);
			if (!meta) continue;
			segments.push(meta);
			if (c.type === "eXIf" && !exif) exif = parseExif(bytes.subarray(c.dataStart, c.dataStart + c.length));
		}
	} else {
		for (const c of walkWebp(bytes)) {
			const meta = classifyWebpChunk(c);
			if (!meta) continue;
			segments.push(meta);
			if (c.fourcc === "EXIF" && !exif) {
				let data = bytes.subarray(c.dataStart, c.dataStart + c.length);
				if (ascii(data, 0, 6) === "Exif\0\0") data = data.subarray(6);
				exif = parseExif(data);
			}
		}
	}

	return {
		format,
		segments,
		exif,
		hasXmp: segments.some((s) => s.kind === "xmp"),
		hasIcc: segments.some((s) => s.kind === "icc"),
		hasComments: segments.some((s) => s.kind === "comment"),
	};
}

function shouldStrip(kind: MetadataSegment["kind"], opts: Required<StripOptions>): boolean {
	if (kind === "exif" || kind === "xmp") return opts.exif;
	if (kind === "icc") return opts.icc;
	if (kind === "comment") return opts.comments;
	return false;
}

function concat(parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((n, p) => n + p.length, 0);
	const out = new Uint8Array(total);
	let pos = 0;
	for (const p of parts) {
		out.set(p, pos);
		pos += p.length;
	}
	return out;
}

/** Return a copy of the image with the selected metadata removed. Pixel data is untouched. */
export function stripImageMetadata(bytes: Uint8Array, options: StripOptions = {}): Uint8Array {
	const opts: Required<StripOptions> = { exif: true, icc: false, comments: true, ...options };
	const format = detectImageFormat(bytes);
	if (!format) throw new Error("Unsupported image format");
	const parts: Uint8Array[] = [];

	if (format === "jpeg") {
		const { segments, sosOffset } = walkJpeg(bytes);
		parts.push(bytes.subarray(0, 2));
		let cursor = 2;
		for (const seg of segments) {
			const meta = classifyJpegSegment(bytes, seg);
			if (seg.start > cursor) parts.push(bytes.subarray(cursor, seg.start));
			if (!(meta && shouldStrip(meta.kind, opts))) parts.push(bytes.subarray(seg.start, seg.end));
			cursor = seg.end;
		}
		parts.push(bytes.subarray(Math.max(cursor, sosOffset)));
		return concat(parts);
	}

	if (format === "png") {
		parts.push(bytes.subarray(0, 8));
		for (const c of walkPng(bytes)) {
			const meta = classifyPngChunk(c);
			if (!(meta && shouldStrip(meta.kind, opts))) parts.push(bytes.subarray(c.start, c.end));
		}
		return concat(parts);
	}

	// WebP: rebuild RIFF with updated size and VP8X flags
	const kept: RiffChunk[] = [];
	for (const c of walkWebp(bytes)) {
		const meta = classifyWebpChunk(c);
		if (!(meta && shouldStrip(meta.kind, opts))) kept.push(c);
	}
	const body = concat(kept.map((c) => bytes.subarray(c.start, c.end)));
	const header = new Uint8Array(12);
	header.set(bytes.subarray(0, 12));
	new DataView(header.buffer).setUint32(4, body.length + 4, true);
	const out = concat([header, body]);
	const vp8x = kept.find((c) => c.fourcc === "VP8X");
	if (vp8x) {
		// Flags byte lives at dataStart; clear ICC (bit 5), EXIF (bit 3), XMP (bit 2) when removed
		const flagPos = 12 + (vp8x.start - 12) + 8;
		let flags = out[flagPos];
		const stillHas = (fourcc: string) => kept.some((c) => c.fourcc === fourcc);
		if (!stillHas("ICCP")) flags &= ~0x20;
		if (!stillHas("EXIF")) flags &= ~0x08;
		if (!stillHas("XMP ")) flags &= ~0x04;
		out[flagPos] = flags;
	}
	return out;
}
