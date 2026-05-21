/**
 * MAC address parsing, normalization, and formatting.
 */

export type MacSeparator = ":" | "-" | "." | "";
export type MacCase = "upper" | "lower";

/**
 * Strip any common separators and return uppercase 12-hex-character form.
 * Throws on invalid input.
 */
export function normalizeMac(input: string): string {
	const cleaned = input.trim().replace(/[\s:.\-]/g, "").toUpperCase();
	if (!/^[0-9A-F]{12}$/.test(cleaned)) {
		throw new Error("Invalid MAC address");
	}
	return cleaned;
}

/**
 * Format a 12-hex-character MAC into the requested representation.
 * Cisco dotted form ("xxxx.xxxx.xxxx") uses 3 groups of 4.
 */
export function formatMac(
	hex: string,
	separator: MacSeparator = ":",
	caseMode: MacCase = "lower"
): string {
	const normalized = hex.replace(/[\s:.\-]/g, "");
	if (!/^[0-9a-fA-F]{12}$/.test(normalized)) throw new Error("Invalid MAC");
	const cased = caseMode === "upper" ? normalized.toUpperCase() : normalized.toLowerCase();

	if (separator === ".") {
		return cased.match(/.{4}/g)!.join(".");
	}
	if (separator === "") return cased;
	return cased.match(/.{2}/g)!.join(separator);
}

/**
 * Extract the OUI (first 24 bits) from a MAC.
 * Returned in normalized 6-hex-character uppercase form.
 */
export function getOui(mac: string): string {
	return normalizeMac(mac).slice(0, 6);
}

/**
 * Get a random MAC address as raw 6-byte array, applying the given bit flags.
 */
export function randomMacBytes(options: {
	locallyAdministered?: boolean;
	multicast?: boolean;
	prefix?: string;
}): Uint8Array {
	const bytes = new Uint8Array(6);
	crypto.getRandomValues(bytes);

	if (options.prefix) {
		const prefix = options.prefix.replace(/[\s:.\-]/g, "");
		if (!/^[0-9a-fA-F]{6}$/.test(prefix)) {
			throw new Error("Vendor prefix must be 6 hex characters (24 bits)");
		}
		bytes[0] = parseInt(prefix.slice(0, 2), 16);
		bytes[1] = parseInt(prefix.slice(2, 4), 16);
		bytes[2] = parseInt(prefix.slice(4, 6), 16);
	} else {
		// I/G bit (bit 0 of first octet): 0 = unicast, 1 = multicast
		if (options.multicast) bytes[0] |= 0x01;
		else bytes[0] &= 0xfe;
		// U/L bit (bit 1 of first octet): 0 = universally administered, 1 = locally administered
		if (options.locallyAdministered) bytes[0] |= 0x02;
		else bytes[0] &= 0xfd;
	}

	return bytes;
}

export function bytesToMacHex(bytes: Uint8Array): string {
	let hex = "";
	for (const b of bytes) hex += b.toString(16).padStart(2, "0");
	return hex.toUpperCase();
}

export function isLocallyAdministered(mac: string): boolean {
	const norm = normalizeMac(mac);
	return (parseInt(norm.slice(0, 2), 16) & 0x02) !== 0;
}

export function isMulticast(mac: string): boolean {
	const norm = normalizeMac(mac);
	return (parseInt(norm.slice(0, 2), 16) & 0x01) !== 0;
}
