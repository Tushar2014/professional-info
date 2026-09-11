import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ProfileSchema, formatRange, isCurrent } from './profile.schema'
import { profile } from './profile'

test('the real profile satisfies the schema', () => {
  assert.doesNotThrow(() => ProfileSchema.parse(profile))
})

test('the schema rejects a missing required field', () => {
  const bad = { ...profile, name: undefined }
  assert.throws(() => ProfileSchema.parse(bad))
})

test('the schema rejects a phone-shaped contact field', () => {
  assert.throws(() => ProfileSchema.parse({ ...profile, email: '+91 9760255545' }))
})

test('formatRange renders a closed range', () => {
  assert.equal(formatRange('2020-10', '2023-12'), '2020–2023')
})

test('formatRange renders an open range as ongoing', () => {
  assert.equal(formatRange('2026-01', null), '2026–now')
})

test('isCurrent is true only for a null end date', () => {
  assert.equal(isCurrent({ end: null }), true)
  assert.equal(isCurrent({ end: '2023-12' }), false)
})

test('exactly one experience entry is current', () => {
  assert.equal(profile.experience.filter(isCurrent).length, 1)
})

test('experience is ordered newest first', () => {
  const starts = profile.experience.map((role) => role.start)
  assert.deepEqual(starts, [...starts].sort().reverse())
})

test('no experience highlight contains a placeholder marker', () => {
  const json = JSON.stringify(profile)
  assert.ok(!json.includes('FILL_IN'), 'profile contains unfilled FILL_IN placeholder')
})
