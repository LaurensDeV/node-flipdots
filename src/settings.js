export const FPS = 15;

export const LAYOUT = [
  [3, 2, 1],
  [4, 5, 6],
  [9, 8, 7],
  [10, 11, 12],
];

/** Source for the number on the board. Responds with plain text, e.g. `24`. */
export const LIVES_TOUCHED_URL = "https://observatory.owow.dev/lives-touched";

/** How often the number is re-fetched (15 minutes). */
export const REFRESH_INTERVAL = 15 * 60 * 1000;

/** How long a single request may take before it is aborted. */
export const REQUEST_TIMEOUT = 10 * 1000;

/** Caption above the number. Keep it short: the board is only 84px wide. */
export const LABEL = "LIVES TOUCHED";

/** How soon a failed fetch is retried, instead of waiting out REFRESH_INTERVAL. */
export const RETRY_INTERVAL = 30 * 1000;

/**
 * Inclusive range that gets the "1 BILLION" celebration screen instead of the
 * raw number.
 */
export const CELEBRATION_RANGE = [1_000_000_000, 1_000_100_000];
export const CELEBRATION_TEXT = "1 BILLION";

/** One twinkle step of the confetti, in milliseconds. */
export const TWINKLE_INTERVAL = 1000;
/**
 * How long the confetti twinkles after the count crosses into the celebration
 * range. Once the minute is up the board holds a still starfield and goes back
 * to changing only when the number does.
 */
export const TWINKLE_DURATION = 60 * 1000;
