
import { expect, test } from 'vitest'
import { createReadableStream } from './util/createReadableStream'
import { JSONObjectStream } from '../src'


// --- JSONObjectStream ---

test('JSONObjectStream: streams JSON array in chunks', async () => {
  // Simulate a JSON array arriving in pieces
  const chunks = [
    '[{"id":1,"name":"first"},',
    '{"id":2,"name":"second"},',
    '{"id":3,"name":"third"}]'
  ]
  const stream = new JSONObjectStream(createReadableStream(chunks))

  const allObjects: object[] = []
  for await (const objects of stream) {
    allObjects.push(...objects)
  }

  expect(allObjects).toEqual([
    { id: 1, name: 'first' },
    { id: 2, name: 'second' },
    { id: 3, name: 'third' },
  ])
})

test('JSONObjectStream: no duplicate objects across chunks', async () => {
  const chunks = [
    '[{"id":1},',
    '{"id":2},',
    '{"id":3}]'
  ]
  const stream = new JSONObjectStream(createReadableStream(chunks))

  const perChunk: object[][] = []
  for await (const objects of stream) {
    perChunk.push(objects)
  }

  // First chunk yields object 1, second yields object 2, third yields object 3
  expect(perChunk[0]).toEqual([{ id: 1 }])
  expect(perChunk[1]).toEqual([{ id: 2 }])
  expect(perChunk[2]).toEqual([{ id: 3 }])
})

test('JSONObjectStream: handles object split across chunks', async () => {
  const chunks = [
    '[{"id":1},{"id":',
    '2},{"id":3}]'
  ]
  const stream = new JSONObjectStream(createReadableStream(chunks))

  const allObjects: object[] = []
  for await (const objects of stream) {
    allObjects.push(...objects)
  }

  expect(allObjects).toEqual([
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ])
})

test('JSONObjectStream: skips chunks with no new complete objects', async () => {
  // Second chunk doesn't complete a new object
  const chunks = [
    '[{"id":1},{"na',
    'me":"tes',
    't"}]'
  ]
  const stream = new JSONObjectStream(createReadableStream(chunks))

  const perChunk: object[][] = []
  for await (const objects of stream) {
    perChunk.push(objects)
  }

  // Chunk 1: yields {id:1}
  // Chunk 2: "name":"tes" doesn't complete the object, so null (skipped)
  // Chunk 3: completes {name:"test"}, yields it
  expect(perChunk).toHaveLength(2)
  expect(perChunk[0]).toEqual([{ id: 1 }])
  expect(perChunk[1]).toEqual([{ name: 'test' }])
})

test('JSONObjectStream: nested objects in array', async () => {
  const chunks = [
    '[{"user":{"name":"alice","age":30}},',
    '{"user":{"name":"bob","age":25}}]'
  ]
  const stream = new JSONObjectStream(createReadableStream(chunks))

  const allObjects: object[] = []
  for await (const objects of stream) {
    allObjects.push(...objects)
  }

  expect(allObjects).toEqual([
    { user: { name: 'alice', age: 30 } },
    { user: { name: 'bob', age: 25 } },
  ])
})
