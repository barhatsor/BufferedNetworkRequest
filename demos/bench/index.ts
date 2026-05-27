
import { JSONObjectStream } from 'bufferednetworkrequest'
import { throttleProfiles, throttleStream } from './throttle'
import * as ui from './ui'


let running = false
let abortController: AbortController | null = null

ui.onRun(run)
ui.onCancel(() => abortController?.abort())


async function run() {

    if (running) return

    running = true
    ui.setRunning(true)

    ui.clear()

    abortController = new AbortController()
    const { signal } = abortController
    const profile = throttleProfiles[ui.getSelectedProfile()]

    ui.log('h5', 'Fetching...')

    try {

        const response = await fetch('https://jsonplaceholder.typicode.com/photos', {
            cache: 'no-store',
            signal
        })

        if (!response.ok) throw new Error(`Request failed: Code ${response.status}`)
        if (!response.body) throw new Error(`Response was empty.`)

        const shouldThrottle = (
            profile.latencyMs !== 0 ||
            isFinite(profile.bytesPerSecond)
        )

        const respBody = shouldThrottle ?
            throttleStream({ stream: response.body, profile }) :
            response.body

        const results = await streamObjects({ respBody, signal })
        showResults(results)

        console.info('[done] response', response)

    } catch (error) {

        if (isAbortError(error)) {
            ui.log('h3', 'Cancelled.')
            return
        }

        throw error

    } finally {
        
        running = false
        ui.setRunning(false)

    }

}

async function streamObjects({ respBody, signal }: {
    respBody: NonNullable<Response['body']>,
    signal: AbortSignal
}) {

    const startTime = performance.now()
    let prevTime = startTime
    let firstLoadTime: number | null = null

    let totalObjects = 0

    const stream = new JSONObjectStream(respBody)

    for await (const objects of stream) {

        signal.throwIfAborted()

        totalObjects += objects.length

        for (const object of objects) {
            ui.log('code', JSON.stringify(object))
        }

        const now = performance.now()
        ui.log('h2', `loaded ${objects.length} in +${ui.round(now - prevTime, 2)}ms`)

        prevTime = now
        firstLoadTime ??= now

    }

    return { startTime, firstLoadTime: firstLoadTime!, totalObjects }

}

function showResults({ startTime, firstLoadTime, totalObjects }: {
    startTime: number
    firstLoadTime: number
    totalObjects: number
}) {

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const timeSaved = endTime - firstLoadTime
    const improvement = ui.round((timeSaved / totalTime) * 100, 2)

    ui.log('h3', `done. (loaded ${totalObjects} objects)`)
    ui.log('h1', `time saved: ${improvement}% (${ui.round(timeSaved / 1000, 2)}s of ${ui.round(totalTime / 1000, 2)}s)`)

}


type AbortError = DOMException & { name: 'AbortError' }

/** https://webidl.spec.whatwg.org/#aborterror */
function isAbortError(error: unknown): error is AbortError {
    return (
        error instanceof DOMException &&
        error.name === 'AbortError'
    )
}
