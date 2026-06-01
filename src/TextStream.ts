
/**
 * A generic interface for streaming transformed text chunks from a `Response`.
 * @template O The transformed chunk type to stream.
 */
export abstract class TextStreamInterface<O> implements AsyncIterable<O> {

    private stream: ReadableStream<string>

    /**
     * @param respBody A `Response`'s `body`.
     * @param textDecoderStream A custom text decoder stream to use.
     */
    constructor(
        respBody: NonNullable<Response['body']>,
        textDecoderStream = new TextDecoderStream()
    ) {

        this.stream = respBody.pipeThrough(
            textDecoderStream
        )

    }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<O> {

        const streamAsyncIteratorSupported = Symbol.asyncIterator in this.stream

        const asyncIterableStream = streamAsyncIteratorSupported ?
            this.stream :
            this.polyfillReadableStreamAsyncIterator(this.stream)

        for await (const chunk of asyncIterableStream) {

            const transformedChunk = await this.transform(chunk)

            if (transformedChunk === null) { continue }

            yield transformedChunk

        }

    }

    /** Transform the chunk. Return `null` to skip it. */
    protected abstract transform(chunk: string): (O | null) | Promise<O | null>

    /**
     * Polyfill `ReadableStream`'s async iterator for Safari
     * (not neccessary in Safari 26.4+).
     * @see https://caniuse.com/mdn-api_readablestream_--asynciterator
     */
    private async *polyfillReadableStreamAsyncIterator(
        stream: ReadableStream<string>
    ): AsyncGenerator<string> {

        const reader = stream.getReader()

        try {

            let result: ReadableStreamReadResult<string>

            while (
                result = await reader.read(),
                !result.done
            ) {

                yield result.value

            }

        } catch (error) {

            await reader.cancel(error)
            throw error

        } finally {

            reader.releaseLock()

        }

    }

}


/**
 * Stream text chunks from a `Response`.
 */
export class TextStream extends TextStreamInterface<string> {

    protected transform(chunk: string) {
        return chunk
    }

}
