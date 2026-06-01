/**
 * BufferedNetworkRequest
 * @license MIT
 */
//#region src/TextStream.d.ts
/**
 * A generic interface for streaming transformed text chunks from a `Response`.
 * @template O The transformed chunk type to stream.
 */
declare abstract class TextStreamInterface<O> implements AsyncIterable<O> {
  private stream;
  /**
   * @param respBody A `Response`'s `body`.
   * @param textDecoderStream A custom text decoder stream to use.
   */
  constructor(respBody: NonNullable<Response['body']>, textDecoderStream?: TextDecoderStream);
  [Symbol.asyncIterator](): AsyncIterableIterator<O>;
  /** Transform the chunk. Return `null` to skip it. */
  protected abstract transform(chunk: string): (O | null) | Promise<O | null>;
  /**
   * Polyfill `ReadableStream`'s async iterator for Safari
   * (not neccessary in Safari 26.4+).
   * @see https://caniuse.com/mdn-api_readablestream_--asynciterator
   */
  private polyfillReadableStreamAsyncIterator;
}
/**
 * Stream text chunks from a `Response`.
 */
declare class TextStream extends TextStreamInterface<string> {
  protected transform(chunk: string): string;
}
//#endregion
//#region src/JSONObjectStream.d.ts
/**
 * Stream completed JSON objects in chunks from a `Response`.
 */
declare class JSONObjectStream extends TextStreamInterface<object[]> {
  private fullJSONStr;
  private lastCompletedJSONObjectCount;
  protected transform(chunk: string): object[] | null;
}
//#endregion
//#region src/IncompleteJSONParser.d.ts
/**
 * Extracts valid objects from incomplete JSON.
 */
declare const IncompleteJSONParser: {
  parse(jsonStr: string): object[];
};
//#endregion
export { IncompleteJSONParser, JSONObjectStream, TextStream, TextStreamInterface };
//# sourceMappingURL=index.d.ts.map