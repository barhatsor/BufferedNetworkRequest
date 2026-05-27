
import { expect, test } from 'vitest'
import { IncompleteJSONParser } from '../src'


// --- IncompleteJSONParser ---

test('IncompleteJSONParser: complete JSON array', () => {
  const result = IncompleteJSONParser.parse('[{"a":1},{"b":2}]')
  expect(result).toEqual([{ a: 1 }, { b: 2 }])
})

test('IncompleteJSONParser: single object', () => {
  const result = IncompleteJSONParser.parse('{"a":1}')
  expect(result).toEqual([{ a: 1 }])
})

test('IncompleteJSONParser: unclosed array', () => {
  const result = IncompleteJSONParser.parse('[{"a":1},{"b":2}')
  expect(result).toEqual([{ a: 1 }, { b: 2 }])
})

test('IncompleteJSONParser: unclosed array with trailing comma', () => {
  const result = IncompleteJSONParser.parse('[{"a":1},{"b":2},')
  expect(result).toEqual([{ a: 1 }, { b: 2 }])
})

test('IncompleteJSONParser: unclosed object truncates to last valid', () => {
  const result = IncompleteJSONParser.parse('[{"a":1},{"b":')
  expect(result).toEqual([{ a: 1 }])
})

test('IncompleteJSONParser: empty string', () => {
  const result = IncompleteJSONParser.parse('')
  expect(result).toEqual([])
})

test('IncompleteJSONParser: nested objects', () => {
  const result = IncompleteJSONParser.parse('[{"a":{"nested":true}},{"b":2}]')
  expect(result).toEqual([{ a: { nested: true } }, { b: 2 }])
})

test('IncompleteJSONParser: nested unclosed object', () => {
  const result = IncompleteJSONParser.parse('[{"a":{"nested":true}},{"b":{"c":')
  expect(result).toEqual([{ a: { nested: true } }])
})


// "}{}{" is not miscounted as object boundaries
test('IncompleteJSONParser: string containing braces is not counted', () => {
  const result = IncompleteJSONParser.parse('[{"a":"}{}{"}]')
  expect(result).toEqual([{ a: "}{}{" }])
})

// \" inside strings doesn't toggle string tracking
test('IncompleteJSONParser: escaped quote inside string', () => {
  const result = IncompleteJSONParser.parse('[{"a":"he said \\"hello\\""}]')
  expect(result).toEqual([{ a: 'he said "hello"' }])
})

// \\" correctly ends the string (backslash is escaped, quote is real)       
test('IncompleteJSONParser: escaped backslash before quote', () => {
  const result = IncompleteJSONParser.parse('[{"a":"trail\\\\"}]')
  expect(result).toEqual([{ a: "trail\\" }])
})

// \"{}\" handles both together
test('IncompleteJSONParser: string with braces and escaped quotes', () => {
  const result = IncompleteJSONParser.parse('[{"a":"\\"{}\\""}]')
  expect(result).toEqual([{ a: '"{}"' }])
})

// incomplete object after a string containing { still truncates correctly
test('IncompleteJSONParser: unclosed object inside string value with braces', () => {
  const result = IncompleteJSONParser.parse('[{"a":"{}"},{"b":"{')
  expect(result).toEqual([{ a: "{}" }])
})
