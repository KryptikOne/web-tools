// ─── Pure-JS MD5 Implementation ─────────────────────────────────────────────
// Web Crypto API does not support MD5, so we implement it directly.

function leftRotate(x: number, c: number): number {
	return (x << c) | (x >>> (32 - c));
}

export function md5(input: Uint8Array): string {
	const s: number[] = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
		5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
		4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
	];

	const K: number[] = [
		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
		0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
		0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
		0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
		0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
		0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
		0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
		0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
		0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
		0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
		0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
	];

	// Pre-processing: adding padding bits
	const originalLength = input.length;
	const bitLength = originalLength * 8;

	let paddedLength = originalLength + 1;
	while (paddedLength % 64 !== 56) {
		paddedLength++;
	}
	paddedLength += 8;

	const padded = new Uint8Array(paddedLength);
	padded.set(input);
	padded[originalLength] = 0x80;

	// Append original length in bits as 64-bit little-endian
	const view = new DataView(padded.buffer);
	view.setUint32(paddedLength - 8, bitLength & 0xffffffff, true);
	view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

	// Initialize hash values
	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	// Process each 512-bit chunk
	for (let offset = 0; offset < paddedLength; offset += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(offset + j * 4, true);
		}

		let A = a0;
		let B = b0;
		let C = c0;
		let D = d0;

		for (let i = 0; i < 64; i++) {
			let F: number;
			let g: number;

			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}

			F = (F + A + K[i] + M[g]) | 0;
			A = D;
			D = C;
			C = B;
			B = (B + leftRotate(F, s[i])) | 0;
		}

		a0 = (a0 + A) | 0;
		b0 = (b0 + B) | 0;
		c0 = (c0 + C) | 0;
		d0 = (d0 + D) | 0;
	}

	// Output as little-endian hex
	const result = new Uint8Array(16);
	const out = new DataView(result.buffer);
	out.setUint32(0, a0, true);
	out.setUint32(4, b0, true);
	out.setUint32(8, c0, true);
	out.setUint32(12, d0, true);

	return Array.from(result)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Convert an ArrayBuffer to a hex string.
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Convert an ArrayBuffer to a Base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Parse a hex string into a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}
