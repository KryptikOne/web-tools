import { describe, it, expect } from "vitest";
import { encodeState, decodeState, SHARE_PARAM } from "@/lib/construction/shareUtils";

describe("shareUtils", () => {
	it("round-trips an object through the hash token", async () => {
		const token = await encodeState({ a: 1, b: "x", list: [1.5, 2] });
		expect(token).not.toContain("=");
		expect(await decodeState(`#${SHARE_PARAM}=${token}`)).toEqual({ a: 1, b: "x", list: [1.5, 2] });
		expect(await decodeState(token)).toEqual({ a: 1, b: "x", list: [1.5, 2] });
	});

	it("returns null for garbage or a missing hash", async () => {
		expect(await decodeState(`#${SHARE_PARAM}=garbage!!`)).toBeNull();
		expect(await decodeState("")).toBeNull();
		expect(await decodeState("#other=abc")).toBeNull();
	});
});
