/**
 * Web Crypto helpers: base64↔bytes, PEM encoding, PBKDF2-derived AES-GCM,
 * HMAC, and RSA key export utilities.
 *
 * Builds on existing hashUtils helpers where possible.
 */

import { arrayBufferToBase64, hexToBytes } from "./hashUtils";

export { arrayBufferToBase64, hexToBytes };

/**
 * Decode a standard base64 string to Uint8Array (UTF-8 safe).
 */
export function base64ToBytes(b64: string): Uint8Array {
	const normalized = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized + "===".slice((normalized.length + 3) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

export function bytesToBase64(bytes: Uint8Array | ArrayBuffer): string {
	if (bytes instanceof Uint8Array) {
		const copy = new ArrayBuffer(bytes.byteLength);
		new Uint8Array(copy).set(bytes);
		return arrayBufferToBase64(copy);
	}
	return arrayBufferToBase64(bytes);
}

/**
 * Wrap a base64 string in PEM headers (64-char line breaks).
 */
export function pemEncode(label: string, base64: string): string {
	const wrapped = base64.match(/.{1,64}/g)?.join("\n") ?? "";
	return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
}

/**
 * Extract the base64 body from a PEM block. Returns null if invalid.
 */
export function pemDecode(pem: string): { label: string; base64: string } | null {
	const match = pem.match(/-----BEGIN ([^-]+)-----\s*([\s\S]+?)\s*-----END \1-----/);
	if (!match) return null;
	return { label: match[1].trim(), base64: match[2].replace(/\s+/g, "") };
}

/**
 * Derive a 256-bit AES-GCM key from a passphrase using PBKDF2-SHA-256.
 */
export async function deriveAesKey(
	passphrase: string,
	salt: Uint8Array,
	iterations: number = 150_000
): Promise<CryptoKey> {
	const enc = new TextEncoder().encode(passphrase);
	const baseKey = await crypto.subtle.importKey(
		"raw",
		enc as BufferSource,
		"PBKDF2",
		false,
		["deriveKey"]
	);
	return crypto.subtle.deriveKey(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

/**
 * Encrypt a UTF-8 string with AES-GCM using a passphrase.
 * Output is base64( salt(16) ‖ iv(12) ‖ ciphertext+tag ).
 */
export async function encryptText(
	plaintext: string,
	passphrase: string,
	iterations: number = 150_000
): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveAesKey(passphrase, salt, iterations);
	const data = new TextEncoder().encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: iv as BufferSource },
		key,
		data as BufferSource
	);

	const out = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
	out.set(salt, 0);
	out.set(iv, salt.length);
	out.set(new Uint8Array(ciphertext), salt.length + iv.length);
	return bytesToBase64(out);
}

/**
 * Decrypt the output of encryptText. Throws on bad passphrase/corrupted data.
 */
export async function decryptText(
	ciphertextB64: string,
	passphrase: string,
	iterations: number = 150_000
): Promise<string> {
	const blob = base64ToBytes(ciphertextB64);
	if (blob.length < 16 + 12 + 16) {
		throw new Error("Ciphertext too short");
	}
	const salt = blob.slice(0, 16);
	const iv = blob.slice(16, 28);
	const ct = blob.slice(28);
	const key = await deriveAesKey(passphrase, salt, iterations);
	try {
		const plain = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as BufferSource },
			key,
			ct as BufferSource
		);
		return new TextDecoder().decode(plain);
	} catch {
		throw new Error("Wrong passphrase or corrupt data");
	}
}

export type HmacAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

/**
 * Compute HMAC over a message. Key and message are both UTF-8 strings unless rawKey is true.
 */
export async function hmac(
	algorithm: HmacAlgo,
	key: string | Uint8Array,
	message: string | Uint8Array
): Promise<ArrayBuffer> {
	const keyBytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
	const msgBytes = typeof message === "string" ? new TextEncoder().encode(message) : message;
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes as BufferSource,
		{ name: "HMAC", hash: algorithm },
		false,
		["sign"]
	);
	return crypto.subtle.sign("HMAC", cryptoKey, msgBytes as BufferSource);
}

export type RsaKeyUse = "signing" | "encryption";

export interface RsaKeyPair {
	publicKeyPem: string;
	privateKeyPem: string;
}

/**
 * Generate an RSA key pair and export to PEM (SPKI public, PKCS#8 private).
 */
export async function generateRsaKeyPair(
	modulusLength: 2048 | 3072 | 4096,
	use: RsaKeyUse = "signing"
): Promise<RsaKeyPair> {
	const algorithm =
		use === "signing"
			? {
					name: "RSASSA-PKCS1-v1_5",
					modulusLength,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256",
				}
			: {
					name: "RSA-OAEP",
					modulusLength,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256",
				};

	const keyPair = (await crypto.subtle.generateKey(algorithm, true, [
		use === "signing" ? "sign" : "encrypt",
		use === "signing" ? "verify" : "decrypt",
	])) as CryptoKeyPair;

	const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
	const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

	return {
		publicKeyPem: pemEncode("PUBLIC KEY", bytesToBase64(spki)),
		privateKeyPem: pemEncode("PRIVATE KEY", bytesToBase64(pkcs8)),
	};
}
