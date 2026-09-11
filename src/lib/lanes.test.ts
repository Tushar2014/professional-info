import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignLanes } from './lanes.ts'
import { profile } from '../data/profile.ts'

test('the real roles do not overlap, so all three sit on lane 0', () => {
  const lanes = assignLanes(profile.experience.map(({ start, end }) => ({ start, end })))
  assert.equal(lanes.length, profile.experience.length)
  assert.deepEqual(
    lanes,
    profile.experience.map(() => 0),
  )
})

test('a pair of overlapping roles is split across two lanes', () => {
  const lanes = assignLanes([
    { start: '2020-01', end: '2022-12' },
    { start: '2021-06', end: '2023-06' },
  ])
  assert.deepEqual(lanes, [0, 1])
})

test('a triple overlap uses three lanes', () => {
  const lanes = assignLanes([
    { start: '2020-01', end: '2024-12' },
    { start: '2021-01', end: '2024-12' },
    { start: '2022-01', end: '2024-12' },
  ])
  assert.deepEqual(lanes, [0, 1, 2])
})

test('a role reuses the lowest free lane once an earlier one has ended', () => {
  const lanes = assignLanes([
    { start: '2020-01', end: '2020-12' },
    { start: '2020-06', end: '2021-06' },
    { start: '2021-01', end: '2021-12' },
  ])
  assert.deepEqual(lanes, [0, 1, 0])
})

test('an open ended role runs to the current month and overlaps anything still running', () => {
  const lanes = assignLanes([
    { start: '2020-01', end: null },
    { start: '2024-01', end: null },
  ])
  assert.deepEqual(lanes, [0, 1])
})

test('adjacent roles that hand over in consecutive months do not overlap', () => {
  const lanes = assignLanes([
    { start: '2020-01', end: '2023-12' },
    { start: '2024-01', end: '2026-04' },
  ])
  assert.deepEqual(lanes, [0, 0])
})

test('an empty role list yields an empty lane list', () => {
  assert.deepEqual(assignLanes([]), [])
})
