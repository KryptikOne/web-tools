"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	Bars3BottomLeftIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./BarcodeGenerator.module.scss";

// ─── Code128B Encoding Tables ─────────────────────────────────────────────────
// Each pattern is 11 modules wide (6 alternating bars/spaces), except STOP (13)
// Format: [bar, space, bar, space, bar, space] widths
const CODE128B_PATTERNS: number[][] = [
	[2,1,2,2,2,2], // 0:  Space
	[2,2,2,1,2,2], // 1:  !
	[2,2,2,2,2,1], // 2:  "
	[1,2,1,2,2,3], // 3:  #
	[1,2,1,3,2,2], // 4:  $
	[1,3,1,2,2,2], // 5:  %
	[1,2,2,2,1,3], // 6:  &
	[1,2,2,3,1,2], // 7:  '
	[1,3,2,2,1,2], // 8:  (
	[2,2,1,2,1,3], // 9:  )
	[2,2,1,3,1,2], // 10: *
	[2,3,1,2,1,2], // 11: +
	[1,1,2,2,3,2], // 12: ,
	[1,2,2,1,3,2], // 13: -
	[1,2,2,2,3,1], // 14: .
	[1,1,3,2,2,2], // 15: /
	[1,2,3,1,2,2], // 16: 0
	[1,2,3,2,2,1], // 17: 1
	[2,2,3,2,1,1], // 18: 2
	[2,2,1,1,3,2], // 19: 3
	[2,2,1,2,3,1], // 20: 4
	[2,1,3,2,1,2], // 21: 5
	[2,2,3,1,1,2], // 22: 6
	[3,1,2,1,3,1], // 23: 7
	[3,1,1,2,2,2], // 24: 8
	[3,2,1,1,2,2], // 25: 9
	[3,2,1,2,2,1], // 26: :
	[3,1,2,2,1,2], // 27: ;
	[3,2,2,1,1,2], // 28: <
	[3,2,2,2,1,1], // 29: =
	[2,1,2,1,2,3], // 30: >
	[2,1,2,3,2,1], // 31: ?
	[2,3,2,1,2,1], // 32: @
	[1,1,1,3,2,3], // 33: A
	[1,3,1,1,2,3], // 34: B
	[1,3,1,3,2,1], // 35: C
	[1,1,2,3,2,3], // 36: D (was missing -- actually not, this is wrong)
	// Correction: Code128B value 33 = 'A', value 0 = ' ' (space, char 32)
	// The mapping is: value = ASCII_code - 32
	// So we need patterns for values 0..106
	[1,3,2,1,2,3], // 37: E (value=37)
	[1,3,2,3,2,1], // 38: F
	[2,1,1,3,2,3], // 39: G
	[2,3,1,1,2,3], // 40: H
	[2,3,1,3,2,1], // 41: I
	[1,1,2,3,3,2], // 42: (was missing)...
	// Actually let me provide the complete correct Code128 patterns
];

// Let me use the full correct Code128 encoding table
// Each entry represents bar/space widths for the 6 elements
// The complete Code128 symbol set (values 0-106)
const CODE128_ENCODINGS: number[][] = [
	[2,1,2,2,2,2], // 0
	[2,2,2,1,2,2], // 1
	[2,2,2,2,2,1], // 2
	[1,2,1,2,2,3], // 3
	[1,2,1,3,2,2], // 4
	[1,3,1,2,2,2], // 5
	[1,2,2,2,1,3], // 6
	[1,2,2,3,1,2], // 7
	[1,3,2,2,1,2], // 8
	[2,2,1,2,1,3], // 9
	[2,2,1,3,1,2], // 10
	[2,3,1,2,1,2], // 11
	[1,1,2,2,3,2], // 12
	[1,2,2,1,3,2], // 13
	[1,2,2,2,3,1], // 14
	[1,1,3,2,2,2], // 15
	[1,2,3,1,2,2], // 16
	[1,2,3,2,2,1], // 17
	[2,2,3,2,1,1], // 18
	[2,2,1,1,3,2], // 19
	[2,2,1,2,3,1], // 20
	[2,1,3,2,1,2], // 21
	[2,2,3,1,1,2], // 22
	[3,1,2,1,3,1], // 23
	[3,1,1,2,2,2], // 24
	[3,2,1,1,2,2], // 25
	[3,2,1,2,2,1], // 26
	[3,1,2,2,1,2], // 27
	[3,2,2,1,1,2], // 28
	[3,2,2,2,1,1], // 29
	[2,1,2,1,2,3], // 30
	[2,1,2,3,2,1], // 31
	[2,3,2,1,2,1], // 32
	[1,1,1,3,2,3], // 33
	[1,3,1,1,2,3], // 34
	[1,3,1,3,2,1], // 35
	[1,1,2,3,2,3], // 36 (D)
	[1,3,2,1,2,3], // 37 (E) -- Correction: value 36 and 37 patterns
	[1,3,2,3,2,1], // 38
	[2,1,1,3,2,3], // 39 (G) -- Correction
	[2,3,1,1,2,3], // 40
	[2,3,1,3,2,1], // 41
	[1,1,2,1,3,3], // 42
	[1,2,2,1,1,3], // 43 -- This is getting error-prone manually
	// ...
];

// Instead of manually typing 107 patterns which is error-prone,
// let me use the binary encoding strings which are easier to verify.
// Each Code128 symbol is represented as an 11-bit binary pattern (STOP is 13-bit).
// 1 = bar (dark), 0 = space (light)

const CODE128_BINARY: string[] = [
	"11011001100", // 0
	"11001101100", // 1
	"11001100110", // 2
	"10010011000", // 3
	"10010001100", // 4
	"10001001100", // 5
	"10011001000", // 6
	"10011000100", // 7
	"10001100100", // 8
	"11001001000", // 9
	"11001000100", // 10
	"11000100100", // 11
	"10110011100", // 12
	"10011011100", // 13
	"10011001110", // 14
	"10111001100", // 15
	"10011101100", // 16
	"10011100110", // 17
	"11001110010", // 18
	"11001011100", // 19
	"11001001110", // 20
	"11011100100", // 21
	"11001110100", // 22
	"11101101110", // 23
	"11101001100", // 24
	"11100101100", // 25
	"11100100110", // 26
	"11101100100", // 27
	"11100110100", // 28
	"11100110010", // 29
	"11011011000", // 30
	"11011000110", // 31
	"11000110110", // 32
	"10100011000", // 33
	"10001011000", // 34
	"10001000110", // 35
	"10110001000", // 36
	"10001101000", // 37
	"10001100010", // 38
	"11010001000", // 39
	"11000101000", // 40
	"11000100010", // 41
	"10110111000", // 42
	"10110001110", // 43
	"10001101110", // 44
	"10111011000", // 45
	"10111000110", // 46
	"10001110110", // 47
	"11101110110", // 48
	"11010001110", // 49
	"11000101110", // 50
	"11011101000", // 51
	"11011100010", // 52
	"11011101110", // 53
	"11101011000", // 54
	"11101000110", // 55
	"11100010110", // 56
	"11101101000", // 57
	"11101100010", // 58
	"11100011010", // 59
	"11101111010", // 60
	"11001000010", // 61
	"11110001010", // 62
	"10100110000", // 63
	"10100001100", // 64
	"10010110000", // 65
	"10010000110", // 66
	"10000101100", // 67
	"10000100110", // 68
	"10110010000", // 69
	"10110000100", // 70
	"10011010000", // 71
	"10011000010", // 72
	"10000110100", // 73
	"10000110010", // 74
	"11000010010", // 75
	"11001010000", // 76
	"11110111010", // 77
	"11000010100", // 78
	"10001111010", // 79
	"10100111100", // 80
	"10010111100", // 81
	"10010011110", // 82
	"10111100100", // 83
	"10011110100", // 84
	"10011110010", // 85
	"11110100100", // 86
	"11110010100", // 87
	"11110010010", // 88
	"11011011110", // 89
	"11011110110", // 90
	"11110110110", // 91
	"10101111000", // 92
	"10100011110", // 93
	"10001011110", // 94
	"10111101000", // 95
	"10111100010", // 96
	"11110101000", // 97
	"11110100010", // 98
	"10111011110", // 99
	"10111101110", // 100
	"11101011110", // 101
	"11110101110", // 102
	"11010000100", // 103 = START_A
	"11010010000", // 104 = START_B
	"11010011100", // 105 = START_C
	"11000111010", // 106 = STOP (first part)
];

const CODE128_STOP_PATTERN = "1100011101011"; // Full STOP pattern (13 modules)
const CODE128_START_B = 104;

// ─── Format Definitions ───────────────────────────────────────────────────────
type BarcodeFormat = "code128" | "code39" | "ean13" | "upca" | "itf14" | "codabar";

interface FormatInfo {
	label: string;
	description: string;
	validator: (data: string) => string | null; // Returns error message or null
}

const FORMAT_INFO: Record<BarcodeFormat, FormatInfo> = {
	code128: {
		label: "Code 128",
		description: "Supports all ASCII characters (most versatile)",
		validator: (data: string) => {
			if (data.length === 0) return "Enter barcode data";
			for (let i = 0; i < data.length; i++) {
				const code = data.charCodeAt(i);
				if (code < 32 || code > 126) return `Unsupported character at position ${i + 1}`;
			}
			return null;
		},
	},
	code39: {
		label: "Code 39",
		description: "Alphanumeric + special chars (-.$/+% SPACE)",
		validator: (data: string) => {
			if (data.length === 0) return "Enter barcode data";
			if (!/^[A-Z0-9\-.\$\/\+%\s]+$/.test(data.toUpperCase()))
				return "Only A-Z, 0-9, and - . $ / + % SPACE allowed";
			return null;
		},
	},
	ean13: {
		label: "EAN-13",
		description: "Exactly 13 digits (European Article Number)",
		validator: (data: string) => {
			if (!/^\d{13}$/.test(data)) return "Must be exactly 13 digits";
			// Verify check digit
			const digits = data.split("").map(Number);
			const sum = digits
				.slice(0, 12)
				.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
			const checkDigit = (10 - (sum % 10)) % 10;
			if (checkDigit !== digits[12]) return `Invalid check digit. Expected ${checkDigit}`;
			return null;
		},
	},
	upca: {
		label: "UPC-A",
		description: "Exactly 12 digits (Universal Product Code)",
		validator: (data: string) => {
			if (!/^\d{12}$/.test(data)) return "Must be exactly 12 digits";
			// Verify check digit
			const digits = data.split("").map(Number);
			const sum = digits
				.slice(0, 11)
				.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
			const checkDigit = (10 - (sum % 10)) % 10;
			if (checkDigit !== digits[11]) return `Invalid check digit. Expected ${checkDigit}`;
			return null;
		},
	},
	itf14: {
		label: "ITF-14",
		description: "Exactly 14 digits (Interleaved 2 of 5)",
		validator: (data: string) => {
			if (!/^\d{14}$/.test(data)) return "Must be exactly 14 digits";
			return null;
		},
	},
	codabar: {
		label: "Codabar",
		description: "Digits + - $ : / . + and start/stop (A-D)",
		validator: (data: string) => {
			if (data.length === 0) return "Enter barcode data";
			if (!/^[A-Da-d][0-9\-\$\:\/\.\+]+[A-Da-d]$/.test(data))
				return "Must start and end with A-D, contain digits and - $ : / . +";
			return null;
		},
	},
};

const FORMATS: BarcodeFormat[] = ["code128", "code39", "ean13", "upca", "itf14", "codabar"];

// ─── Code39 Encoding ──────────────────────────────────────────────────────────
const CODE39_CHARS: Record<string, string> = {
	"0": "101001101101", "1": "110100101011", "2": "101100101011",
	"3": "110110010101", "4": "101001101011", "5": "110100110101",
	"6": "101100110101", "7": "101001011011", "8": "110100101101",
	"9": "101100101101", "A": "110101001011", "B": "101101001011",
	"C": "110110100101", "D": "101011001011", "E": "110101100101",
	"F": "101101100101", "G": "101010011011", "H": "110101001101",
	"I": "101101001101", "J": "101011001101", "K": "110101010011",
	"L": "101101010011", "M": "110110101001", "N": "101011010011",
	"O": "110101101001", "P": "101101101001", "Q": "101010110011",
	"R": "110101011001", "S": "101101011001", "T": "101011011001",
	"U": "110010101011", "V": "100110101011", "W": "110011010101",
	"X": "100101101011", "Y": "110010110101", "Z": "100110110101",
	"-": "100101011011", ".": "110010101101", " ": "100110101101",
	"$": "100100100101", "/": "100100101001", "+": "100101001001",
	"%": "101001001001", "*": "100101101101",
};

// ─── Codabar Encoding ─────────────────────────────────────────────────────────
const CODABAR_CHARS: Record<string, string> = {
	"0": "1010100110", "1": "1010110010", "2": "1010010110",
	"3": "1100101010", "4": "1011010010", "5": "1101010010",
	"6": "1001010110", "7": "1001011010", "8": "1001101010",
	"9": "1101001010", "-": "1010011010", "$": "1011001010",
	":": "11010110110", "/": "11011010110", ".": "11011011010",
	"+": "10110110110",
	"A": "10110010010", "B": "10010010110", "C": "10100010110", "D": "10100011010",
	"a": "10110010010", "b": "10010010110", "c": "10100010110", "d": "10100011010",
};

// ─── EAN/UPC Encoding ─────────────────────────────────────────────────────────
const EAN_L_CODES = [
	"0001101", "0011001", "0010011", "0111101", "0100011",
	"0110001", "0101111", "0111011", "0110111", "0001011",
];
const EAN_G_CODES = [
	"0100111", "0110011", "0011011", "0100001", "0011101",
	"0111001", "0000101", "0010001", "0001001", "0010111",
];
const EAN_R_CODES = [
	"1110010", "1100110", "1101100", "1000010", "1011100",
	"1001110", "1010000", "1000100", "1001000", "1110100",
];
const EAN_FIRST_DIGIT_PATTERNS = [
	"LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
	"LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

// ─── ITF Encoding ─────────────────────────────────────────────────────────────
const ITF_PATTERNS: Record<string, string> = {
	"0": "00110", "1": "10001", "2": "01001", "3": "11000",
	"4": "00101", "5": "10100", "6": "01100", "7": "00011",
	"8": "10010", "9": "01010",
};

// ─── Encoding Functions ───────────────────────────────────────────────────────

function encodeCode128(data: string): string {
	// Start with START_B
	const values: number[] = [CODE128_START_B];

	// Encode each character: value = charCode - 32
	for (let i = 0; i < data.length; i++) {
		values.push(data.charCodeAt(i) - 32);
	}

	// Calculate checksum
	let checksum = values[0]; // Start code value
	for (let i = 1; i < values.length; i++) {
		checksum += values[i] * i;
	}
	checksum = checksum % 103;
	values.push(checksum);

	// Build binary string
	let binary = "";
	for (const val of values) {
		binary += CODE128_BINARY[val];
	}
	// Add STOP pattern
	binary += CODE128_STOP_PATTERN;

	return binary;
}

function encodeCode39(data: string): string {
	const upper = data.toUpperCase();
	let binary = CODE39_CHARS["*"] + "0"; // Start character + inter-char gap
	for (let i = 0; i < upper.length; i++) {
		const char = upper[i];
		if (CODE39_CHARS[char]) {
			binary += CODE39_CHARS[char] + "0"; // Each character + gap
		}
	}
	binary += CODE39_CHARS["*"]; // Stop character
	return binary;
}

function encodeEAN13(data: string): string {
	const digits = data.split("").map(Number);
	const firstDigit = digits[0];
	const pattern = EAN_FIRST_DIGIT_PATTERNS[firstDigit];

	let binary = "101"; // Start guard

	// Left side (digits 1-6)
	for (let i = 0; i < 6; i++) {
		const digit = digits[i + 1];
		if (pattern[i] === "L") {
			binary += EAN_L_CODES[digit];
		} else {
			binary += EAN_G_CODES[digit];
		}
	}

	binary += "01010"; // Center guard

	// Right side (digits 7-12)
	for (let i = 0; i < 6; i++) {
		binary += EAN_R_CODES[digits[i + 7]];
	}

	binary += "101"; // End guard
	return binary;
}

function encodeUPCA(data: string): string {
	const digits = data.split("").map(Number);

	let binary = "101"; // Start guard

	// Left side (digits 0-5)
	for (let i = 0; i < 6; i++) {
		binary += EAN_L_CODES[digits[i]];
	}

	binary += "01010"; // Center guard

	// Right side (digits 6-11)
	for (let i = 6; i < 12; i++) {
		binary += EAN_R_CODES[digits[i]];
	}

	binary += "101"; // End guard
	return binary;
}

function encodeITF14(data: string): string {
	const digits = data.split("").map(Number);

	// ITF start pattern
	let binary = "1010";

	// Process pairs
	for (let i = 0; i < digits.length; i += 2) {
		const bars = ITF_PATTERNS[digits[i].toString()];
		const spaces = ITF_PATTERNS[digits[i + 1].toString()];

		for (let j = 0; j < 5; j++) {
			const barWidth = bars[j] === "1" ? "111" : "1";
			const spaceWidth = spaces[j] === "1" ? "000" : "0";
			binary += barWidth + spaceWidth;
		}
	}

	// ITF stop pattern
	binary += "11101";
	return binary;
}

function encodeCodabar(data: string): string {
	let binary = "";
	for (let i = 0; i < data.length; i++) {
		if (i > 0) binary += "0"; // Inter-character gap
		const char = data[i];
		if (CODABAR_CHARS[char]) {
			binary += CODABAR_CHARS[char];
		}
	}
	return binary;
}

function encodeBarcode(data: string, format: BarcodeFormat): string | null {
	try {
		switch (format) {
			case "code128": return encodeCode128(data);
			case "code39": return encodeCode39(data);
			case "ean13": return encodeEAN13(data);
			case "upca": return encodeUPCA(data);
			case "itf14": return encodeITF14(data);
			case "codabar": return encodeCodabar(data);
			default: return null;
		}
	} catch {
		return null;
	}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BarcodeGenerator() {
	const [data, setData] = useState("Hello World");
	const [format, setFormat] = useState<BarcodeFormat>("code128");
	const [barWidth, setBarWidth] = useState(2);
	const [barcodeHeight, setBarcodeHeight] = useState(100);
	const [showText, setShowText] = useState(true);
	const [barColor, setBarColor] = useState("#000000");
	const [bgColor, setBgColor] = useState("#ffffff");
	const [validationError, setValidationError] = useState<string | null>(null);

	const canvasRef = useRef<HTMLCanvasElement>(null);

	const renderBarcode = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Validate input
		const error = FORMAT_INFO[format].validator(data);
		setValidationError(error);

		if (error) {
			// Render empty state
			canvas.width = 300;
			canvas.height = 100;
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = barColor;
			ctx.font = "14px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.globalAlpha = 0.3;
			ctx.fillText("Invalid input", canvas.width / 2, canvas.height / 2);
			ctx.globalAlpha = 1;
			return;
		}

		// Encode
		const binary = encodeBarcode(data, format);
		if (!binary) {
			canvas.width = 300;
			canvas.height = 100;
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			return;
		}

		// Calculate dimensions
		const padding = 20;
		const textHeight = showText ? 30 : 0;
		const totalWidth = binary.length * barWidth + padding * 2;
		const totalHeight = barcodeHeight + textHeight + padding * 2;

		canvas.width = totalWidth;
		canvas.height = totalHeight;

		// Fill background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, totalWidth, totalHeight);

		// Draw bars
		ctx.fillStyle = barColor;
		for (let i = 0; i < binary.length; i++) {
			if (binary[i] === "1") {
				ctx.fillRect(
					padding + i * barWidth,
					padding,
					barWidth,
					barcodeHeight
				);
			}
		}

		// Draw text below barcode
		if (showText) {
			ctx.fillStyle = barColor;
			ctx.font = `${Math.max(12, Math.min(16, barWidth * 6))}px monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			ctx.fillText(data, totalWidth / 2, padding + barcodeHeight + 8);
		}
	}, [data, format, barWidth, barcodeHeight, showText, barColor, bgColor]);

	useEffect(() => {
		renderBarcode();
	}, [renderBarcode]);

	const handleDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas || validationError) return;

		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.download = `barcode-${format}-${Date.now()}.png`;
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
		}, "image/png");
	};

	const handleFormatChange = (newFormat: BarcodeFormat) => {
		setFormat(newFormat);
		// Provide sensible defaults per format
		switch (newFormat) {
			case "ean13":
				setData("5901234123457");
				break;
			case "upca":
				setData("012345678905");
				break;
			case "itf14":
				setData("00012345678905");
				break;
			case "codabar":
				setData("A12345B");
				break;
			case "code39":
				setData("HELLO");
				break;
			case "code128":
				setData("Hello World");
				break;
		}
	};

	return (
		<div className={`gap-6 ${styles.container}`}>
			{/* Settings Panel */}
			<div className={`flex flex-col gap-6 ${styles.settingsPanel}`}>
				{/* Barcode Data */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Barcode Data</h2>
					<div className="flex flex-col gap-2">
						<input
							type="text"
							value={data}
							onChange={(e) => setData(e.target.value)}
							placeholder="Enter barcode data..."
							className={styles.input}
						/>
						{validationError && (
							<div className={`flex items-center gap-2 ${styles.errorMessage}`}>
								<ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
								<span>{validationError}</span>
							</div>
						)}
						<p className={`text-xs ${styles.formatHint}`}>
							{FORMAT_INFO[format].description}
						</p>
					</div>
				</div>

				{/* Format Selector */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Format</h2>
					<div className="grid grid-cols-2 gap-2">
						{FORMATS.map((f) => (
							<button
								key={f}
								className={`${styles.formatBtn} ${format === f ? styles.active : ""}`}
								onClick={() => handleFormatChange(f)}
							>
								{FORMAT_INFO[f].label}
							</button>
						))}
					</div>
				</div>

				{/* Appearance Options */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Appearance</h2>
					<div className="flex flex-col gap-4">
						{/* Bar Width */}
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Bar Width</span>
								<span className={styles.sliderValue}>{barWidth}px</span>
							</div>
							<input
								type="range"
								min="1"
								max="5"
								step="1"
								value={barWidth}
								onChange={(e) => setBarWidth(parseInt(e.target.value, 10))}
								className={styles.slider}
							/>
						</div>

						{/* Height */}
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Height</span>
								<span className={styles.sliderValue}>{barcodeHeight}px</span>
							</div>
							<input
								type="range"
								min="40"
								max="200"
								step="5"
								value={barcodeHeight}
								onChange={(e) => setBarcodeHeight(parseInt(e.target.value, 10))}
								className={styles.slider}
							/>
						</div>

						{/* Show Text */}
						<label className={`flex items-center gap-3 cursor-pointer ${styles.toggleLabel}`}>
							<input
								type="checkbox"
								checked={showText}
								onChange={(e) => setShowText(e.target.checked)}
								className={styles.checkbox}
							/>
							<span className={styles.sliderLabel}>Show text below barcode</span>
						</label>
					</div>
				</div>

				{/* Colors */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Colors</h2>
					<div className="flex flex-col gap-4">
						<div>
							<label className={styles.inputLabel}>Bar Color</label>
							<div className="flex gap-3 items-center">
								<ColorPickerPopover color={barColor} onChange={setBarColor} swatchSize="sm" />
								<input
									type="text"
									value={barColor}
									onChange={(e) => setBarColor(e.target.value)}
									className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
								/>
							</div>
						</div>
						<div>
							<label className={styles.inputLabel}>Background Color</label>
							<div className="flex gap-3 items-center">
								<ColorPickerPopover color={bgColor} onChange={setBgColor} swatchSize="sm" />
								<input
									type="text"
									value={bgColor}
									onChange={(e) => setBgColor(e.target.value)}
									className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Panel */}
			<div className={`flex flex-col ${styles.previewPanel}`}>
				<div className={styles.glassCard}>
					<div className={`flex items-start justify-between mb-6 gap-4 ${styles.previewHeader}`}>
						<div>
							<h2 className={styles.sectionTitle}>Preview</h2>
							<p className={`mt-1 text-sm ${styles.previewInfo}`}>
								{FORMAT_INFO[format].label} &bull; {data.length} characters
							</p>
						</div>
						<button
							className={`whitespace-nowrap ${styles.downloadBtn}`}
							onClick={handleDownload}
							disabled={!!validationError}
						>
							<ArrowDownTrayIcon className="w-5 h-5" />
							Download PNG
						</button>
					</div>

					<div className={`flex items-center justify-center rounded-lg mb-6 ${styles.previewContainer}`}>
						<canvas ref={canvasRef} className={`max-w-full ${styles.barcodeCanvas}`} />
					</div>

					<div className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}>
						<Bars3BottomLeftIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
						<p className={styles.infoText}>
							Barcodes are generated entirely in your browser using the Canvas API. No data is sent to any server. Code 128 supports all standard ASCII characters and is the most versatile format.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
