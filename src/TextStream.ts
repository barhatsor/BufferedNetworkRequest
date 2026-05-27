
/**
 * A generic interface for streaming processed text chunks from a `Response`.
 * @template ChunkType The processed chunk type to stream.
 */
export abstract class TextStreamInterface<ChunkType> implements AsyncIterable<ChunkType> {

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

    async *[Symbol.asyncIterator](): AsyncIterableIterator<ChunkType> {

        const streamAsyncIteratorSupported = Symbol.asyncIterator in this.stream

        const asyncIterableStream = streamAsyncIteratorSupported ?
            this.stream :
            this.polyfillReadableStreamAsyncIterator(this.stream)

        for await (const chunk of asyncIterableStream) {

            const processedChunk = this.processChunk(chunk)

            if (processedChunk === null) { continue }

            yield processedChunk

        }

    }

    /** Process the chunk. Return `null` to skip it. */
    protected abstract processChunk(chunk: string): ChunkType | null

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

    protected processChunk(chunk: string) {
        return chunk
    }

}
