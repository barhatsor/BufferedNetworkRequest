
import { expect, test } from 'vitest'
import { createReadableStream } from './util/createReadableStream'
import { TextStream } from '../src'


// --- TextStream ---

test('TextStream: yields all chunks', async () => {
  const chunks = ['hello', ' ', 'world']
  const stream = new TextStream(createReadableStream(chunks))

  const received: string[] = []
  for await (const chunk of stream) {
    received.push(chunk)
  }

  expect(received).toEqual(chunks)
})

test('TextStream: single chunk', async () => {
  const stream = new TextStream(createReadableStream(['single']))

  const received: string[] = []
  for await (const chunk of stream) {
    received.push(chunk)
  }

  expect(received).toEqual(['single'])
})

test('TextStream: empty stream', async () => {
  const stream = new TextStream(createReadableStream([]))

  const received: string[] = []
  for await (const chunk of stream) {
    received.push(chunk)
  }

  expect(received).toEqual([])
})

test('TextStream: unicode chunks', async () => {
  const chunks = ['héllo', ' wörld', ' 🎉']
  const stream = new TextStream(createReadableStream(chunks))

  const received: string[] = []
  for await (const chunk of stream) {
    received.push(chunk)
  }

  expect(received).toEqual(chunks)
})
