
import { TextStreamInterface } from './TextStream'
import { IncompleteJSONParser } from './IncompleteJSONParser'

/**
 * Stream completed JSON objects in chunks from a `Response`.
 */
export class JSONObjectStream extends TextStreamInterface<object[]> {

    private fullJSONStr = ''
    private lastCompletedJSONObjectCount = 0

    protected processChunk(chunk: string) {

        this.fullJSONStr += chunk

        // get completed JSON objects in full JSON string
        const completedJSONObjects = IncompleteJSONParser.parse(
            this.fullJSONStr
        )

        // remove JSON objects we've already returned
        const newCompletedJSONObjects = completedJSONObjects.slice(
            this.lastCompletedJSONObjectCount
        )

        // if there are no new completed JSON objects, don't send an update
        if (newCompletedJSONObjects.length === 0) {
            return null
        }

        this.lastCompletedJSONObjectCount += newCompletedJSONObjects.length

        return newCompletedJSONObjects

    }

}
