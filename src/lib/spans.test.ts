import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AXIS_MAX, AXIS_MIN, REQUEST_SPANS, spanGeometry, type Span } from './spans.ts'

function byId(id: string): Span {
  const span = REQUEST_SPANS.find((s) => s.id === id)
  assert.ok(span, `no span with id ${id}`)
  return span as Span
}

function numeric(value: string): number {
  assert.match(value, /%$/, `${value} is not a percentage string`)
  return Number.parseFloat(value)
}

test('the enclosing edge span covers the whole axis', () => {
  const geometry = spanGeometry(byId('edge'))
  assert.equal(geometry.left, '0%')
  assert.equal(geometry.width, '100%')
})

test('safety and intent start at exactly the same x, which is what proves the concurrency', () => {
  assert.equal(spanGeometry(byId('safety')).left, spanGeometry(byId('intent')).left)
})

test('the cancellation tail starts where the intent bar ends', () => {
  const intent = byId('intent')
  const geometry = spanGeometry(intent)
  assert.equal(geometry.tailLeft, `${intent.to}%`)
  assert.equal(numeric(geometry.tailLeft as string), numeric(geometry.left) + numeric(geometry.width))
})

test('only the cancelled span carries tail geometry', () => {
  for (const span of REQUEST_SPANS) {
    const geometry = spanGeometry(span)
    if (span.tailTo === undefined) {
      assert.equal(geometry.tailLeft, undefined, `${span.id} should have no tail`)
      assert.equal(geometry.tailWidth, undefined, `${span.id} should have no tail width`)
    } else {
      assert.ok(geometry.tailWidth, `${span.id} should have a tail width`)
      assert.ok(numeric(geometry.tailWidth as string) > 0, `${span.id} tail has no length`)
    }
  }
})

test('no span exceeds 100 percent of the axis', () => {
  for (const span of REQUEST_SPANS) {
    const geometry = spanGeometry(span)
    const total = numeric(geometry.left) + numeric(geometry.width)
    assert.ok(total <= 100.001, `${span.id} runs to ${total}%`)
    if (geometry.tailLeft && geometry.tailWidth) {
      const tailEnd = numeric(geometry.tailLeft) + numeric(geometry.tailWidth)
      assert.ok(tailEnd <= 100.001, `${span.id} tail runs to ${tailEnd}%`)
    }
  }
})

test('every span moves forward in time and sits inside the axis', () => {
  for (const span of REQUEST_SPANS) {
    assert.ok(span.from < span.to, `${span.id} has from >= to`)
    assert.ok(span.from >= AXIS_MIN, `${span.id} starts before the axis`)
    assert.ok(span.to <= AXIS_MAX, `${span.id} ends after the axis`)
    if (span.tailTo !== undefined) {
      assert.ok(span.tailTo > span.to, `${span.id} tail does not extend past its bar`)
      assert.ok(span.tailTo <= AXIS_MAX, `${span.id} tail ends after the axis`)
    }
  }
})

test('exactly two spans are authored, and eight spans are drawn in total', () => {
  assert.equal(REQUEST_SPANS.length, 8)
  assert.equal(REQUEST_SPANS.filter((s) => s.authored).length, 2)
  assert.equal(REQUEST_SPANS.filter((s) => s.tailTo !== undefined).length, 1)
})
