export const scrambleText = (el: HTMLElement, finalText: string) => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*(){}[]`~";
	// const chars = '!@#$%^&*(){}[]`~1234567890';
	let iterations = 0;
	const scrambleInterval = setInterval(() => {
		el.textContent = finalText
			.split("")
			.map((char, i) => (i < iterations ? char : chars[Math.floor(Math.random() * chars.length)]))
			.join("");
		if (iterations >= finalText.length) clearInterval(scrambleInterval);
		iterations += 1 / 1; // Adjust speed here by changing the denominator
	}, 30);
};
