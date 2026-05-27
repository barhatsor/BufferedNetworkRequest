import { JSONObjectStream } from "bufferednetworkrequest";
//#region bench/throttle.ts
/**
* Simulated network profiles matching Chrome DevTools throttling presets. \
* `bytesPerSecond` = download throughput, `latencyMs` = initial round-trip delay. \
* [DevTools Source](https://github.com/ChromeDevTools/devtools-frontend/blob/d171921829581f059b68230952d7c4da3bc499eb/front_end/core/sdk/NetworkManager.ts#L498-L540)
*/
const throttleProfiles = {
	none: {
		bytesPerSecond: Infinity,
		latencyMs: 0
	},
	fast4g: {
		bytesPerSecond: 9 * 1e3 * 1e3 / 8 * .9,
		latencyMs: 60 * 2.75
	},
	slow4g: {
		bytesPerSecond: 1.6 * 1e3 * 1e3 / 8 * .9,
		latencyMs: 150 * 3.75
	},
	"3g": {
		bytesPerSecond: 500 * 1e3 / 8 * .8,
		latencyMs: 400 * 5
	}
};
/**
* Simulates a slow network connection by wrapping a `Response`'s `ReadableStream`
* in a `TransformStream` that limits how fast data passes through.
*/
function throttleStream({ stream, profile }) {
	let initialDelay = true;
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		if (initialDelay && profile.latencyMs > 0) {
			await sleep(profile.latencyMs);
			initialDelay = false;
		}
		const sliceSize = Math.max(1, Math.floor(profile.bytesPerSecond / 10));
		let offset = 0;
		while (offset < chunk.length) {
			const end = Math.min(offset + sliceSize, chunk.length);
			controller.enqueue(new Uint8Array(chunk.subarray(offset, end)));
			offset = end;
			if (offset < chunk.length) await sleep(100);
		}
		await sleep(chunk.length / profile.bytesPerSecond * 1e3);
	} }));
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
//#endregion
//#region bench/ui.ts
const statusEl = document.querySelector(".status");
const throttleSelect = document.querySelector("#throttle");
const runButton = document.querySelector("#run");
const cancelButton = document.querySelector("#cancel");
function getSelectedProfile() {
	return throttleSelect.value;
}
function setRunning(value) {
	runButton.disabled = value;
	cancelButton.disabled = !value;
}
function onRun(handler) {
	runButton.addEventListener("click", handler);
}
function onCancel(handler) {
	cancelButton.addEventListener("click", handler);
}
function clear() {
	statusEl.innerHTML = "";
}
function log(tag, text) {
	const el = document.createElement(tag);
	el.textContent = text;
	statusEl.appendChild(el);
	scrollToBottom();
}
function scrollToBottom() {
	document.body.scrollIntoView({ block: "end" });
}
function round(value, decimals) {
	const m = 10 ** decimals;
	return Math.round(value * m) / m;
}
//#endregion
//#region bench/index.ts
let running = false;
let abortController = null;
onRun(run);
onCancel(() => abortController?.abort());
async function run() {
	if (running) return;
	running = true;
	setRunning(true);
	clear();
	abortController = new AbortController();
	const { signal } = abortController;
	const profile = throttleProfiles[getSelectedProfile()];
	log("h5", "Fetching...");
	try {
		const response = await fetch("https://jsonplaceholder.typicode.com/photos", {
			cache: "no-store",
			signal
		});
		if (!response.ok) throw new Error(`Request failed: Code ${response.status}`);
		if (!response.body) throw new Error(`Response was empty.`);
		showResults(await streamObjects({
			respBody: profile.latencyMs !== 0 || isFinite(profile.bytesPerSecond) ? throttleStream({
				stream: response.body,
				profile
			}) : response.body,
			signal
		}));
		console.info("[done] response", response);
	} catch (error) {
		if (isAbortError(error)) {
			log("h3", "Cancelled.");
			return;
		}
		throw error;
	} finally {
		running = false;
		setRunning(false);
	}
}
async function streamObjects({ respBody, signal }) {
	const startTime = performance.now();
	let prevTime = startTime;
	let firstLoadTime = null;
	let totalObjects = 0;
	const stream = new JSONObjectStream(respBody);
	for await (const objects of stream) {
		signal.throwIfAborted();
		totalObjects += objects.length;
		for (const object of objects) log("code", JSON.stringify(object));
		const now = performance.now();
		log("h2", `loaded ${objects.length} in +${round(now - prevTime, 2)}ms`);
		prevTime = now;
		firstLoadTime ??= now;
	}
	return {
		startTime,
		firstLoadTime,
		totalObjects
	};
}
function showResults({ startTime, firstLoadTime, totalObjects }) {
	const endTime = performance.now();
	const totalTime = endTime - startTime;
	const timeSaved = endTime - firstLoadTime;
	const improvement = round(timeSaved / totalTime * 100, 2);
	log("h3", `done. (loaded ${totalObjects} objects)`);
	log("h1", `time saved: ${improvement}% (${round(timeSaved / 1e3, 2)}s of ${round(totalTime / 1e3, 2)}s)`);
}
/** https://webidl.spec.whatwg.org/#aborterror */
function isAbortError(error) {
	return error instanceof DOMException && error.name === "AbortError";
}
//#endregion

//# sourceMappingURL=index.js.map