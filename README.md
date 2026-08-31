# BufferedNetworkRequest

Make your interfaces render ~30% faster on 3G using streams and partial JSON parsing.

[![NPM version][npm-version-img]][npm-version-url]
[![Minified size][minified-size-img]][minified-size-url]
[![CI][ci-src]][ci-href]

- Stream network requests as they arrive
- Extract valid JSON objects from incomplete chunks
- **~30% faster** [First Contentful Paint] on 3G

[Benchmark] | [Basic Demo]

## Installation

### NPM
```sh
npm install bufferednetworkrequest
```

### CDN
Import the module directly:
```js
import * as BufferedNetworkRequest from 'https://unpkg.com/bufferednetworkrequest'
```

## Usage

### Streaming JSON objects

```js
import { JSONObjectStream } from 'bufferednetworkrequest'

const response = await fetch('https://jsonplaceholder.typicode.com/photos')

if (!response.ok) throw new Error(`Request failed: Code ${response.status}`)
if (!response.body) throw new Error(`Response was empty.`)

const stream = new JSONObjectStream(response.body)

let respObjects = []

for await (const objects of stream) {
    // do something with the chunk
    respObjects.push(...objects)
}

console.log(respObjects)
```

### Streaming Text

```js
import { TextStream } from 'bufferednetworkrequest'

const response = await fetch(url)

if (!response.ok) throw new Error(`Request failed: Code ${response.status}`)
if (!response.body) throw new Error(`Response was empty.`)

const stream = new TextStream(response.body)

let text = ''

for await (const textChunk of stream) {
    // do something with the chunk
    text += textChunk
}

console.log(text)
```

## Architecture

The library uses the [Web Streams API]. `TextStreamInterface<ChunkType>` is an abstract base class that pipes a `Response.body` through a `TextDecoderStream` and exposes an async iterator. Subclasses implement `processChunk()` to transform each text chunk:

- [**TextStream**](src/TextStream.ts) — Returns raw text chunks as-is
- [**JSONObjectStream**](src/JSONObjectStream.ts) — Accumulates chunks into a JSON string, uses `IncompleteJSONParser` to extract complete objects as they come in, and yields only newly-completed objects (no duplicates across iterations)
- [**IncompleteJSONParser**](src/IncompleteJSONParser.ts) — Extracts valid JSON objects from incomplete chunks by tracking brace nesting to find the last fully-closed object, and closing unclosed top-level arrays

## Developing

```sh
npm install
npm run build
```

Then:
```sh
npm run test
```

## License

[MIT](/LICENSE)


<!-- References -->
[First Contentful Paint]: https://web.dev/articles/fcp
[Benchmark]: https://cde.run/barhatsor/BufferedNetworkRequest/demos/bench/index.html
[Basic Demo]: https://cde.run/barhatsor/BufferedNetworkRequest/demos/basic-demo/index.html
[Web Streams API]: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API

<!-- Badges -->
[npm-version-img]: https://img.shields.io/npm/v/bufferednetworkrequest
[npm-version-url]: https://www.npmjs.com/package/bufferednetworkrequest
[minified-size-img]: https://img.shields.io/github/size/barhatsor/BufferedNetworkRequest/dist/index.min.js
[minified-size-url]: /dist/index.min.js
[ci-src]: https://github.com/barhatsor/BufferedNetworkRequest/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/barhatsor/BufferedNetworkRequest/actions/workflows/ci.yml
