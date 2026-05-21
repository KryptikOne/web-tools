/**
 * IPv4 parsing, formatting, and CIDR/subnet math.
 * All math uses unsigned 32-bit integers (>>> 0 to keep unsigned).
 */

export function parseIPv4(input: string): number {
	const trimmed = input.trim();
	const parts = trimmed.split(".");
	if (parts.length !== 4) throw new Error("IPv4 must have 4 octets");
	let n = 0;
	for (const part of parts) {
		if (!/^\d+$/.test(part)) throw new Error(`Invalid octet: ${part}`);
		const v = Number(part);
		if (v < 0 || v > 255) throw new Error(`Octet out of range: ${part}`);
		n = (n << 8) | v;
	}
	return n >>> 0;
}

export function formatIPv4(n: number): string {
	n = n >>> 0;
	return `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
}

export function ipv4ToInt(input: string): number {
	return parseIPv4(input);
}

export function ipv4ToHex(input: string): string {
	const n = parseIPv4(input);
	return "0x" + n.toString(16).toUpperCase().padStart(8, "0");
}

export function ipv4ToBinary(input: string): string {
	const n = parseIPv4(input);
	return n.toString(2).padStart(32, "0").match(/.{8}/g)!.join(".");
}

export function ipv4ToOctal(input: string): string {
	const n = parseIPv4(input);
	return "0o" + n.toString(8);
}

export function ipv4ToIpv6Mapped(input: string): string {
	const parts = parseIPv4(input);
	const hi = ((parts >>> 16) & 0xffff).toString(16);
	const lo = (parts & 0xffff).toString(16);
	return `::ffff:${hi}:${lo}`;
}

export function intToIpv4(n: number): string {
	return formatIPv4(n);
}

export function hexToIpv4(input: string): string {
	const cleaned = input.trim().replace(/^0x/i, "");
	if (!/^[0-9a-f]{1,8}$/i.test(cleaned)) throw new Error("Invalid hex IPv4");
	return formatIPv4(parseInt(cleaned, 16));
}

export function binaryToIpv4(input: string): string {
	const cleaned = input.trim().replace(/\./g, "");
	if (!/^[01]{32}$/.test(cleaned)) throw new Error("Binary IPv4 must be 32 bits");
	return formatIPv4(parseInt(cleaned, 2));
}

export function parseNetmask(mask: string): number {
	const n = parseIPv4(mask);
	// Verify it's a valid (contiguous) netmask
	const inv = (~n) >>> 0;
	if ((inv & (inv + 1)) !== 0 && n !== 0xffffffff && n !== 0) {
		throw new Error("Netmask is not contiguous");
	}
	return n;
}

export function maskToCidr(mask: number): number {
	mask = mask >>> 0;
	let count = 0;
	for (let i = 31; i >= 0; i--) {
		if ((mask >>> i) & 1) count++;
		else break;
	}
	return count;
}

export function cidrToMask(prefix: number): number {
	if (prefix < 0 || prefix > 32) throw new Error("CIDR prefix must be 0-32");
	if (prefix === 0) return 0;
	return (0xffffffff << (32 - prefix)) >>> 0;
}

export interface CidrInput {
	ip: number;
	prefix: number;
}

export function parseCidr(input: string): CidrInput {
	const trimmed = input.trim();
	const [ipStr, prefixStr] = trimmed.split("/");
	if (!prefixStr) throw new Error("Missing CIDR prefix (e.g. 10.0.0.0/24)");
	const prefix = Number(prefixStr);
	if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
		throw new Error("CIDR prefix must be an integer 0-32");
	}
	return { ip: parseIPv4(ipStr), prefix };
}

export interface SubnetInfo {
	network: string;
	broadcast: string;
	firstHost: string;
	lastHost: string;
	netmask: string;
	netmaskHex: string;
	wildcard: string;
	prefix: number;
	totalHosts: number;
	usableHosts: number;
	addressClass: string;
}

export function getSubnetInfo(ip: number, prefix: number): SubnetInfo {
	const mask = cidrToMask(prefix);
	const network = (ip & mask) >>> 0;
	const broadcast = (network | (~mask >>> 0)) >>> 0;
	const total = prefix === 32 ? 1 : 2 ** (32 - prefix);

	let firstHost: number;
	let lastHost: number;
	let usableHosts: number;
	if (prefix >= 31) {
		firstHost = network;
		lastHost = broadcast;
		usableHosts = total;
	} else {
		firstHost = (network + 1) >>> 0;
		lastHost = (broadcast - 1) >>> 0;
		usableHosts = Math.max(0, total - 2);
	}

	const firstOctet = (network >>> 24) & 0xff;
	let addressClass = "Unknown";
	if (firstOctet < 128) addressClass = "A";
	else if (firstOctet < 192) addressClass = "B";
	else if (firstOctet < 224) addressClass = "C";
	else if (firstOctet < 240) addressClass = "D (Multicast)";
	else addressClass = "E (Reserved)";

	return {
		network: formatIPv4(network),
		broadcast: formatIPv4(broadcast),
		firstHost: formatIPv4(firstHost),
		lastHost: formatIPv4(lastHost),
		netmask: formatIPv4(mask),
		netmaskHex: "0x" + mask.toString(16).toUpperCase().padStart(8, "0"),
		wildcard: formatIPv4(~mask >>> 0),
		prefix,
		totalHosts: total,
		usableHosts,
		addressClass,
	};
}

/**
 * Given a start and end IPv4 (inclusive), return the minimal list of CIDR
 * blocks that exactly covers the range.
 */
export function rangeToCidrs(startIp: number, endIp: number): string[] {
	if (endIp < startIp) throw new Error("End IP must be >= start IP");
	const result: string[] = [];
	let current = startIp >>> 0;
	const end = endIp >>> 0;

	while (current <= end) {
		// Largest power-of-two-aligned block starting at current that fits in [current, end].
		let maxSize = 32;
		while (maxSize > 0) {
			const mask = cidrToMask(maxSize - 1);
			if ((current & mask) !== current) break;
			const blockSize = 2 ** (32 - (maxSize - 1));
			if (current + blockSize - 1 > end) break;
			maxSize--;
		}
		result.push(`${formatIPv4(current)}/${maxSize}`);
		const size = 2 ** (32 - maxSize);
		current = (current + size) >>> 0;
		// Guard against wrap-around at end of address space
		if (current === 0 && maxSize === 0) break;
	}
	return result;
}
