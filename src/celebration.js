/**
 * The "1 BILLION" screen: the message on one line with confetti scattered in
 * the bands above and below it.
 */
import {
	CELEBRATION_RANGE,
	TWINKLE_DURATION,
	TWINKLE_INTERVAL,
} from "./settings.js";

/** How many twinkle steps before the pattern repeats. */
export const TWINKLE_PHASES = 3;

/**
 * Confetti positions as [x, y, isStar], hand-placed around the message box
 * (roughly x 6-78, y 9-21). A star is a 3x3 plus, everything else a single dot.
 */
const CONFETTI = [
	// Band above the message
	[2, 4, true], [11, 1, false], [17, 5, false], [26, 2, true],
	[36, 5, false], [43, 1, true], [53, 4, false], [60, 1, true],
	[69, 5, false], [77, 2, true], [82, 6, false],
	// Band below the message
	[4, 26, false], [9, 23, true], [19, 26, true], [28, 24, false],
	[37, 26, true], [47, 23, false], [54, 26, true], [63, 24, false],
	[71, 26, true], [79, 23, true],
	// A speck in each side margin
	[1, 12, false], [82, 15, false],
];

function drawStar(ctx, x, y) {
	ctx.fillRect(x, y, 1, 1);
	ctx.fillRect(x - 1, y, 1, 1);
	ctx.fillRect(x + 1, y, 1, 1);
	ctx.fillRect(x, y - 1, 1, 1);
	ctx.fillRect(x, y + 1, 1, 1);
}

/**
 * Draw the confetti for one twinkle step. Each step hides a third of it, which
 * reads as twinkling while only ever flipping a handful of dots.
 */
export function drawConfetti(ctx, phase) {
	CONFETTI.forEach(([x, y, isStar], i) => {
		if (i % TWINKLE_PHASES === phase % TWINKLE_PHASES) return;

		if (isStar) {
			drawStar(ctx, x, y);
		} else {
			ctx.fillRect(x, y, 1, 1);
		}
	});
}

/** Is this number worth throwing confetti at? */
export function isCelebration(value) {
	const [min, max] = CELEBRATION_RANGE;
	return value !== null && value >= min && value <= max;
}

/**
 * Decides what the celebration screen is doing right now.
 *
 * The confetti twinkles only for the crossing itself - the moment a value below
 * a billion is followed by one inside the range - and for at most
 * TWINKLE_DURATION. Every other in-range value (a board that is already past
 * the milestone, a climbing count, a restart after the party) shows the message
 * without moving a dot.
 */
export function createCelebration() {
	let previousValue;
	let twinkleStartedAt = null;

	return {
		/**
		 * @param value    latest number, or null before the first fetch lands
		 * @param now      wall clock, for timing the party out
		 * @param elapsed  monotonic ms, for stepping the confetti
		 */
		update(value, now, elapsed) {
			if (value !== previousValue) {
				const crossed =
					typeof previousValue === "number" &&
					previousValue < CELEBRATION_RANGE[0] &&
					isCelebration(value);

				if (crossed) {
					twinkleStartedAt = now;
				}
				previousValue = value;
			}

			const celebrating = isCelebration(value);
			const isTwinkling =
				celebrating &&
				twinkleStartedAt !== null &&
				now - twinkleStartedAt < TWINKLE_DURATION;

			return {
				celebrating,
				phase: isTwinkling
					? Math.floor(elapsed / TWINKLE_INTERVAL) % TWINKLE_PHASES
					: 0,
			};
		},
	};
}
