import { describe, it, expect } from "vitest";
import { detectImageFormat, inspectImageMetadata, stripImageMetadata } from "@/lib/imageMetadataUtils";

function buildTiff(): Uint8Array {
	const buf = new ArrayBuffer(146);
	const v = new DataView(buf);
	const b = new Uint8Array(buf);
	b.set([0x49, 0x49], 0); // II
	v.setUint16(2, 42, true);
	v.setUint32(4, 8, true);
	// IFD0 @8: 2 entries
	v.setUint16(8, 2, true);
	v.setUint16(10, 0x010f, true); v.setUint16(12, 2, true); v.setUint32(14, 6, true); v.setUint32(18, 38, true); // Make
	v.setUint16(22, 0x8825, true); v.setUint16(24, 4, true); v.setUint32(26, 1, true); v.setUint32(30, 44, true); // GPS IFD
	v.setUint32(34, 0, true);
	b.set([0x43, 0x61, 0x6e, 0x6f, 0x6e, 0], 38); // "Canon\0"
	// GPS IFD @44: 4 entries
	v.setUint16(44, 4, true);
	let e = 46;
	v.setUint16(e, 1, true); v.setUint16(e + 2, 2, true); v.setUint32(e + 4, 2, true); b.set([0x4e, 0], e + 8); e += 12; // N
	v.setUint16(e, 2, true); v.setUint16(e + 2, 5, true); v.setUint32(e + 4, 3, true); v.setUint32(e + 8, 98, true); e += 12;
	v.setUint16(e, 3, true); v.setUint16(e + 2, 2, true); v.setUint32(e + 4, 2, true); b.set([0x57, 0], e + 8); e += 12; // W
	v.setUint16(e, 4, true); v.setUint16(e + 2, 5, true); v.setUint32(e + 4, 3, true); v.setUint32(e + 8, 122, true); e += 12;
	v.setUint32(e, 0, true);
	const rat = (off: number, vals: number[]) => vals.forEach((n, i) => { v.setUint32(off + i * 8, n, true); v.setUint32(off + i * 8 + 4, 1, true); });
	rat(98, [40, 26, 46]);
	rat(122, [79, 58, 56]);
	return b;
}

function jpegSegment(marker: number, data: Uint8Array): Uint8Array {
	const len = data.length + 2;
	return new Uint8Array([0xff, marker, len >> 8, len & 0xff, ...data]);
}

function buildJpeg(): Uint8Array {
	const exif = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0, ...buildTiff()]);
	const comment = new Uint8Array([0x68, 0x69]);
	const dqt = new Uint8Array(4).fill(1);
	return new Uint8Array([
		0xff, 0xd8,
		...jpegSegment(0xe1, exif),
		...jpegSegment(0xfe, comment),
		...jpegSegment(0xdb, dqt),
		0xff, 0xda, 0, 2, 0xaa, 0xbb, 0xcc,
		0xff, 0xd9,
	]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const out = new Uint8Array(12 + data.length);
	new DataView(out.buffer).setUint32(0, data.length);
	out.set(Array.from(type, (c) => c.charCodeAt(0)), 4);
	out.set(data, 8);
	return out;
}

function buildPng(): Uint8Array {
	return new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		...pngChunk("IHDR", new Uint8Array(13)),
		...pngChunk("tEXt", new Uint8Array([0x41, 0, 0x42])),
		...pngChunk("IDAT", new Uint8Array([1, 2, 3])),
		...pngChunk("IEND", new Uint8Array(0)),
	]);
}

describe("imageMetadataUtils", () => {
	it("detects formats", () => {
		expect(detectImageFormat(buildJpeg())).toBe("jpeg");
		expect(detectImageFormat(buildPng())).toBe("png");
		expect(detectImageFormat(new Uint8Array([1, 2, 3]))).toBeNull();
	});

	it("reads EXIF make and GPS from a JPEG", () => {
		const report = inspectImageMetadata(buildJpeg())!;
		expect(report.segments.map((s) => s.name)).toEqual(["APP1 (EXIF)", "COM"]);
		expect(report.exif?.make).toBe("Canon");
		expect(report.exif?.gps?.latitude).toBeCloseTo(40.446, 3);
		expect(report.exif?.gps?.longitude).toBeCloseTo(-79.982, 3);
	});

	it("strips EXIF and comments from a JPEG but keeps the image data", () => {
		const stripped = stripImageMetadata(buildJpeg());
		const report = inspectImageMetadata(stripped)!;
		expect(report.segments).toEqual([]);
		expect(Array.from(stripped.subarray(0, 4))).toEqual([0xff, 0xd8, 0xff, 0xdb]);
		expect(Array.from(stripped.subarray(-2))).toEqual([0xff, 0xd9]);
	});

	it("strips text chunks from a PNG and keeps IHDR/IDAT/IEND", () => {
		const png = buildPng();
		expect(inspectImageMetadata(png)!.hasComments).toBe(true);
		const stripped = stripImageMetadata(png);
		expect(inspectImageMetadata(stripped)!.segments).toEqual([]);
		expect(stripped.length).toBe(png.length - 12 - 3);
	});
});
