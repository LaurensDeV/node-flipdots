import {
	LIVES_TOUCHED_URL,
	REFRESH_INTERVAL,
	REQUEST_TIMEOUT,
	RETRY_INTERVAL,
} from "./settings.js";

const state = {
	/** Last successfully fetched number, or null while we never had one. */
	value: null,
	/** Timestamp of the last successful fetch. */
	fetchedAt: null,
	/** Message of the last failed fetch, cleared as soon as one succeeds. */
	error: null,
};

/**
 * The endpoint responds with plain text ("24"), so pick the first number out of
 * the body. That also survives a body that grows into JSON or gets a suffix.
 */
function parseCount(body) {
	const match = body.replace(/[\s,]/g, "").match(/-?\d+(?:\.\d+)?/);
	return match ? Number(match[0]) : null;
}

async function fetchLivesTouched() {
	try {
		const response = await fetch(LIVES_TOUCHED_URL, {
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const value = parseCount(await response.text());
		if (value === null) {
			throw new Error("no number in response");
		}

		state.value = value;
		state.fetchedAt = Date.now();
		state.error = null;
	} catch (error) {
		// Keep showing the previous number; a hiccup should not blank the board.
		state.error = error instanceof Error ? error.message : String(error);
	}

	return state.error === null;
}

/**
 * Fetch right away, then keep refreshing in the background. Chained timeouts
 * instead of an interval, so requests never overlap and a failure can be
 * retried well before the next scheduled refresh.
 */
export function startPolling() {
	const poll = async () => {
		const ok = await fetchLivesTouched();
		setTimeout(poll, ok ? REFRESH_INTERVAL : RETRY_INTERVAL);
	};

	poll();
}

export function getLivesTouched() {
	return state
}
