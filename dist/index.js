/**
 * BufferedNetworkRequest
 * @license MIT
 */
//#region src/TextStream.ts
/**
* A generic interface for streaming processed text chunks from a `Response`.
* @template ChunkType The processed chunk type to stream.
*/
var TextStreamInterface = class {
	/**
	* @param respBody A `Response`'s `body`.
	* @param textDecoderStream A custom text decoder stream to use.
	*/
	constructor(respBody, textDecoderStream = new TextDecoderStream()) {
		this.stream = respBody.pipeThrough(textDecoderStream);
	}
	async *[Symbol.asyncIterator]() {
		const asyncIterableStream = Symbol.asyncIterator in this.stream ? this.stream : this.polyfillReadableStreamAsyncIterator(this.stream);
		for await (const chunk of asyncIterableStream) {
			const processedChunk = this.processChunk(chunk);
			if (processedChunk === null) continue;
			yield processedChunk;
		}
	}
	/**
	* Polyfill `ReadableStream`'s async iterator for Safari
	* (not neccessary in Safari 26.4+).
	* @see https://caniuse.com/mdn-api_readablestream_--asynciterator
	*/
	async *polyfillReadableStreamAsyncIterator(stream) {
		const reader = stream.getReader();
		try {
			let result;
			while (result = await reader.read(), !result.done) yield result.value;
		} catch (error) {
			await reader.cancel(error);
			throw error;
		} finally {
			reader.releaseLock();
		}
	}
};
/**
* Stream text chunks from a `Response`.
*/
var TextStream = class extends TextStreamInterface {
	processChunk(chunk) {
		return chunk;
	}
};
//#endregion
//#region src/IncompleteJSONParser.ts
/**
* Extracts valid objects from incomplete JSON.
*/
const IncompleteJSONParser = { parse(jsonStr) {
	let objNestingCounter = 0;
	let lastValidIndex = 0;
	let inString = false;
	for (let i = 0; i < jsonStr.length; i++) {
		const char = jsonStr[i];
		if (inString && char === "\\") {
			i++;
			continue;
		}
		if (char === "\"") {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (char === "{") {
			if (objNestingCounter === 0) lastValidIndex = i - 1;
			objNestingCounter++;
		} else if (char === "}") objNestingCounter--;
	}
	let validJSONStr = jsonStr;
	if (objNestingCounter !== 0) validJSONStr = jsonStr.slice(0, lastValidIndex + 1);
	validJSONStr = validJSONStr.trim();
	if (validJSONStr.startsWith("[") && !validJSONStr.endsWith("]")) {
		if (validJSONStr.endsWith(",")) validJSONStr = validJSONStr.slice(0, -1);
		validJSONStr += "]";
	}
	let completedJSONObjects = [];
	if (validJSONStr) {
		completedJSONObjects = JSON.parse(validJSONStr);
		if (!Array.isArray(completedJSONObjects)) completedJSONObjects = [completedJSONObjects];
	}
	return completedJSONObjects;
} };
//#endregion
//#region src/JSONObjectStream.ts
/**
* Stream completed JSON objects in chunks from a `Response`.
*/
var JSONObjectStream = class extends TextStreamInterface {
	constructor(..._args) {
		super(..._args);
		this.fullJSONStr = "";
		this.lastCompletedJSONObjectCount = 0;
	}
	processChunk(chunk) {
		this.fullJSONStr += chunk;
		const newCompletedJSONObjects = IncompleteJSONParser.parse(this.fullJSONStr).slice(this.lastCompletedJSONObjectCount);
		if (newCompletedJSONObjects.length === 0) return null;
		this.lastCompletedJSONObjectCount += newCompletedJSONObjects.length;
		return newCompletedJSONObjects;
	}
};
//#endregion
export { IncompleteJSONParser, JSONObjectStream, TextStream, TextStreamInterface };

//# sourceMappingURL=index.js.map