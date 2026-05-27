
/**
 * Simulated network profiles matching Chrome DevTools throttling presets. \
 * `bytesPerSecond` = download throughput, `latencyMs` = initial round-trip delay. \
 * [DevTools Source](https://github.com/ChromeDevTools/devtools-frontend/blob/d171921829581f059b68230952d7c4da3bc499eb/front_end/core/sdk/NetworkManager.ts#L498-L540)
 */
export const throttleProfiles: Record<string, { bytesPerSecond: number, latencyMs: number }> = {
    none:   { bytesPerSecond: Infinity, latencyMs: 0 },
    fast4g: { bytesPerSecond: 9   * 1000 * 1000 / 8 * .9, latencyMs: 60 * 2.75 },   // 9 Mbps, 60ms RTT
    slow4g: { bytesPerSecond: 1.6 * 1000 * 1000 / 8 * .9, latencyMs: 150 * 3.75 },  // ~1.6 Mbps, 150ms RTT
    '3g':   { bytesPerSecond: 500 * 1000        / 8 * .8, latencyMs: 400 * 5 },     // ~500 Kbps, 400ms RTT
}

/**
 * Simulates a slow network connection by wrapping a `Response`'s `ReadableStream`
 * in a `TransformStream` that limits how fast data passes through.
 */
export function throttleStream({ stream, profile }: {
    stream: NonNullable<Response['body']>,
    profile: { bytesPerSecond: number, latencyMs: number }
}): NonNullable<Response['body']> {

    // Only apply the initial round-trip delay once (on the first chunk).
    let initialDelay = true

    return stream.pipeThrough(new TransformStream({

        async transform(chunk, controller) {

            // Simulate network round-trip latency before the first byte arrives.
            if (initialDelay && profile.latencyMs > 0) {
                await sleep(profile.latencyMs)
                initialDelay = false
            }

            // Split the chunk into smaller slices released over time,
            // so the consumer sees data trickling in gradually (like on an actual slow connection)
            // rather than receiving the whole chunk at once after a single delay.
            // We target 10 slices per second, so each slice = 1/10th of the per-second byte budget.
            const sliceSize = Math.max(1, Math.floor(profile.bytesPerSecond / 10))
            let offset = 0

            while (offset < chunk.length) {

                const end = Math.min(offset + sliceSize, chunk.length)
                // Subarray shares memory with the original chunk, so we copy it
                // to ensure the slice remains valid after the original is released.
                controller.enqueue(new Uint8Array(chunk.subarray(offset, end)))
                offset = end

                // Wait 100ms between slices (10 slices/sec = 100ms apart).
                if (offset < chunk.length) {
                    await sleep(100)
                }

            }

            // After releasing all slices, add a final delay proportional to the chunk size.
            // This ensures overall throughput stays close to the profile's byte rate,
            // accounting for chunks that were smaller than sliceSize.
            const chunkDelay = (chunk.length / profile.bytesPerSecond) * 1000
            await sleep(chunkDelay)

        }

    }))

}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
