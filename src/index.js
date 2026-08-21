import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { CELEBRATION_TEXT, FPS, LABEL, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { getLivesTouched, startPolling } from "./lives-touched.js";
import { createCelebration, drawConfetti } from "./celebration.js";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
	layout: LAYOUT,
	panelWidth: 28,
	isMirrored: true,
	transport: !IS_DEV ? {
		type: 'serial',
		path: '/dev/ttyACM0',
		baudRate: 57600
	} : {
		type: 'ip',
		host: '127.0.0.1',
		port: 3000
	}
});

const { width, height } = display;

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Register fonts
registerFont(
	path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
	{ family: "OpenSans" },
);
registerFont(
	path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
	{ family: "PPNeueMontreal" },
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
	family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

/** 12px is the largest crisp size where "LIVES TOUCHED" still fits on one line. */
const LABEL_FONT = '12px "Px437_ACM_VGA"';
const LABEL_Y = 0;
/** Number sizes to try, largest first, so a long number can never run off the board. */
const VALUE_SIZES = [16, 12, 8];
const VALUE_Y = 11;
/** Shown until the first fetch lands. */
const PLACEHOLDER = "--";
const CELEBRATION_FONT = '16px "Px437_ACM_VGA"';
const CELEBRATION_Y = 7;

/** Draw text horizontally centred, snapped to whole pixels. */
function fillTextCentered(text, y) {
	const { width: textWidth } = ctx.measureText(text);
	ctx.fillText(text, Math.round((width - textWidth) / 2), y);
}

function drawCounter(value) {
	// Caption on the top row
	ctx.font = LABEL_FONT;
	fillTextCentered(LABEL, LABEL_Y);

	// The number itself, filling the rest of the board
	const text = value === null ? PLACEHOLDER : String(value);
	const size = VALUE_SIZES.find((candidate) => {
		ctx.font = `${candidate}px "Px437_ACM_VGA"`;
		return ctx.measureText(text).width <= width;
	}) ?? VALUE_SIZES.at(-1);
	ctx.font = `${size}px "Px437_ACM_VGA"`;
	// Keep smaller fallbacks centred in the band the biggest size would occupy.
	fillTextCentered(text, VALUE_Y + Math.round((VALUE_SIZES[0] - size) / 2));
}

function drawCelebration(phase) {
	ctx.font = CELEBRATION_FONT;
	fillTextCentered(CELEBRATION_TEXT, CELEBRATION_Y);
	drawConfetti(ctx, phase);
}

function render(value, celebrating, phase) {
	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "#fff";

	if (celebrating) {
		drawCelebration(phase);
	} else {
		drawCounter(value);
	}

	// Convert image to binary (purely black and white) for flipdot display
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		// Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
		const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
		const binary = brightness > 127 ? 255 : 0;
		data[i] = binary; // R
		data[i + 1] = binary; // G
		data[i + 2] = binary; // B
		data[i + 3] = 255; // The board is not transparent :-)
	}
	ctx.putImageData(imageData, 0, 0);

	if (IS_DEV) {
		// Save the canvas as a PNG file
		const filename = path.join(outputDir, "frame.png");
		fs.writeFileSync(filename, canvas.toBuffer("image/png"));
	} else {
		display.setImageData(ctx.getImageData(0, 0, display.width, display.height));
		if (display.isDirty()) {
			display.flush();
		}
	}
}

// Keep the number up to date in the background
startPolling();

console.log(`Rendering a ${width}x${height} canvas`);
console.log("View at http://localhost:3000/view");

// The board only changes when the number does (or when the confetti twinkles),
// so redraw on change instead of flipping dots on every tick.
let renderedFrame;
let loggedValue;
const celebration = createCelebration();
const ticker = new Ticker({ fps: FPS });

ticker.start(({ elapsedTime }) => {
	const { value, error, fetchedAt } = getLivesTouched();
	const { celebrating, phase } = celebration.update(
		value,
		Date.now(),
		elapsedTime,
	);

	const frame = `${value}:${celebrating}:${phase}`;
	if (frame === renderedFrame) return;
	renderedFrame = frame;

	render(value, celebrating, phase);

	if (value === loggedValue) return;
	loggedValue = value;

	const at = fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : "never";
	console.log(
		`${LABEL}: ${value ?? PLACEHOLDER} (fetched ${at}${error ? `, last error: ${error}` : ""})`,
	);
});
