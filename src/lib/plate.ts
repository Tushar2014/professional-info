/*
  ============================================================================
  TRACE FIELD. The generator behind every Plate on the site.

  One continuous instrument window, sampled at four densities. It is not a
  stack of authored panes and it is not a set of fat lozenges: a channel
  interval is 8 to 12 user units tall inside an 800 unit field, it starts at a
  seeded offset so no interval is ever flush with the frame, and seven other
  mark families are drawn in the same window.

  Purity rules, all load bearing:
    - no Math.random, no Date, no options object, no I/O
    - every emitted coordinate, radius and length is an integer, so the markup
      is byte identical across rebuilds
    - variants never reseed and never regenerate: they SAMPLE the same field,
      which is what makes a project's card and its banner one artwork at two
      densities
    - the only string input is the slug, and the only strings out are the frozen
      literals in chromeFor, so nothing employer shaped can reach a plate
  ============================================================================
*/

export type PlateVariant = 'portrait' | 'banner' | 'card' | 'monogram'

/** One channel of the field. All numbers are integers in viewBox user units,
 *  except walk, which is in milli units of the variant amplitude. */
export type Channel = {
  /** Interval start, 0..1000. */
  from: number
  /** Interval end, from + 140 .. from + 620, never above 1000. */
  to: number
  /** Present on exactly two channels. Dashed continuation end, to < tailTo <= 1000. */
  tailTo?: number
  /** 17 integers in -1000..1000. Always present, even when hasTrace is false. */
  walk: number[]
  /** Whether this channel draws its walk. */
  hasTrace: boolean
  /** true draws the walk orthogonally as a staircase, false as a straight polyline. */
  stepped: boolean
  /** true puts the trace in the deep ink group, false in the bright steel group. */
  deep: boolean
}

export type Field = {
  /** 8 uppercase hex digits of hashString(seed). */
  hex8: string
  /** Exactly 32 channels. */
  channels: Channel[]
  /** Exactly 204 integers in 0..3. Four comb rows of 51 ticks. */
  comb: number[]
  /** The one accent channel and the vertex its ring sits on. */
  mark: { channel: number; vertex: number }
}

export type ChromeRow = { key: string; value: string }
export type Chrome = { head: [string, string]; foot: ChromeRow[] }

export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mulberry32: small, fast, deterministic from a 32-bit seed.
 *  Exported so a unit test can pin the stream. Any edit to the arithmetic below
 *  rerolls every plate on the site and no other test would catch it. */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** The frozen geometry table. The component reads every number from here and
 *  contains no magic number of its own. */
export const FIELD = Object.freeze({
  viewBox: Object.freeze({ w: 1000, h: 800 }),
  /** Structure must remain legible inside this rect at every declared crop. */
  safe: Object.freeze({ x0: 200, x1: 800, y0: 200, y1: 600 }),
  /** Accent mark centres must sit inside this rect. */
  accentSafe: Object.freeze({ x0: 240, x1: 760, y0: 240, y1: 560 }),
  /** Largest distance from an accent mark centre to its own outer edge. */
  accentExtent: 36,
  grid: Object.freeze({ minor: 25, major: 100 }),
  channels: 32,
  vertices: 17,
  /** Every channel whose master index is a multiple of this is a comb row: it
   *  draws a tick comb and draws no interval, no caps and no trace. */
  combStride: 8,
  combTicks: 51,
  combPitch: 20,
  /** Nodes sit on vertices where k % 4 === 2, so k in {2,6,10,14}, x in 125..875,
   *  which keeps every node square fully inside the field. */
  nodeStride: Object.freeze({ mod: 4, rem: 2 }),
  markChannels: Object.freeze([10, 12, 14, 18, 20]),
  minTraced: 18,
  minPerDepth: 3,
  variants: Object.freeze({
    portrait: Object.freeze({
      step: 2, count: 16, pitch: 50, amp: 17, barH: 12, capH: 22,
      radius: 2, nodeSide: 7, ringR: 16, envelope: 10,
      combHeights: Object.freeze([4, 7, 10, 15]), accent: true, footRows: 3,
    }),
    banner: Object.freeze({
      step: 1, count: 32, pitch: 25, amp: 8, barH: 8, capH: 15,
      radius: 2, nodeSide: 5, ringR: 12, envelope: 6,
      combHeights: Object.freeze([3, 5, 7, 10]), accent: true, footRows: 3,
    }),
    card: Object.freeze({
      step: 2, count: 16, pitch: 50, amp: 17, barH: 12, capH: 22,
      radius: 2, nodeSide: 7, ringR: 0, envelope: 0,
      combHeights: Object.freeze([4, 7, 10, 15]), accent: false, footRows: 1,
    }),
    monogram: Object.freeze({
      step: 11, count: 3, pitch: 25, amp: 0, barH: 8, capH: 0,
      radius: 2, nodeSide: 0, ringR: 0, envelope: 0,
      combHeights: Object.freeze([]), accent: false, footRows: 0,
    }),
  }),
  monogram: Object.freeze({
    w: 100, h: 100, minor: 25, rows: Object.freeze([22, 50, 78]),
    barH: 8, widths: Object.freeze([28, 44, 60]),
  }),
  /** Every box aspect ratio the CSS declares, as [w, h]. The crop safety test
   *  iterates this list. Adding a breakpoint means adding its ratio here. */
  ratios: Object.freeze([
    Object.freeze([4, 5]), Object.freeze([4, 3]), Object.freeze([3, 2]),
    Object.freeze([16, 9]), Object.freeze([16, 7]),
  ]),
})

/**
 * The draw order below IS the contract. Changing the order of a single r() call
 * rerolls every plate on the site, so the unit test pins the whole object for a
 * fixture seed rather than trusting a reviewer to notice.
 */
export function fieldFor(seed: string): Field {
  const h = hashString(seed)
  const hex8 = h.toString(16).toUpperCase().padStart(8, '0')
  const r = makeRandom(h)

  const comb: number[] = []
  for (let i = 0; i < FIELD.combTicks * 4; i += 1) comb.push(Math.floor(r() * 4))

  const channels: Channel[] = []
  for (let i = 0; i < FIELD.channels; i += 1) {
    const span = 140 + Math.round(r() * 480)
    const from = Math.round(r() * (1000 - span))
    const to = from + span
    const hasTrace = r() < 0.72
    const stepped = r() < 0.5
    const deep = r() < 0.45
    // walk is always drawn, even when hasTrace is false, so flipping the trace
    // probability later cannot reroll anything downstream.
    const walk: number[] = [Math.round((r() * 2 - 1) * 700)]
    for (let k = 1; k < FIELD.vertices; k += 1) {
      walk.push(clamp(walk[k - 1] + Math.round((r() * 2 - 1) * 420), -1000, 1000))
    }
    channels.push({ from, to, walk, hasTrace, stepped, deep })
  }

  // TAILS. Exactly two, one in each half, never adjacent, never on a comb row.
  let t0 = 1 + Math.floor(r() * 14)
  let t1 = 17 + Math.floor(r() * 14)
  while (t0 % FIELD.combStride === 0) t0 += 1
  while (t1 % FIELD.combStride === 0) t1 += 1
  for (const t of [t0, t1]) {
    channels[t].tailTo = Math.min(1000, channels[t].to + 90 + Math.round(r() * 120))
  }

  // MARK. Every entry of markChannels is even, so it survives step 2 sampling,
  // none is a multiple of combStride, and every entry maps into the accent safe
  // band at both densities.
  const markChannel = FIELD.markChannels[Math.floor(r() * FIELD.markChannels.length)]
  const m = channels[markChannel]
  m.hasTrace = true // the ring needs a vertex, so this is forced
  m.deep = false // the subject is the brightest trace in the field
  // The marked interval is redrawn inside the accent safe x band so no declared
  // crop can ever cut it.
  const mspan = 160 + Math.round(r() * 240)
  m.from = 200 + Math.round(r() * (600 - mspan))
  m.to = m.from + mspan
  // The ring sits on the largest excursion whose x is inside the safe band.
  // vertexX(k) = round(k * 1000 / 16), so k in 4..12 gives x in 250..750.
  let vertex = 4
  for (let k = 5; k <= 12; k += 1) {
    if (Math.abs(m.walk[k]) > Math.abs(m.walk[vertex])) vertex = k
  }

  // REPAIR, TRACE DENSITY. A density floor as an invariant rather than a
  // probability: a sparse seed reads as a bar chart instead of a trace field.
  const nonComb: number[] = []
  for (let i = 0; i < FIELD.channels; i += 1) {
    if (i % FIELD.combStride !== 0) nonComb.push(i)
  }
  const tracedCount = (): number => nonComb.filter((i) => channels[i].hasTrace).length
  while (tracedCount() < FIELD.minTraced) {
    const next = nonComb.find((i) => !channels[i].hasTrace)
    if (next === undefined) break
    channels[next].hasTrace = true
  }

  // REPAIR, INK DEPTH. Both depths always appear. One depth reads flat.
  const traced = (): number[] => nonComb.filter((i) => channels[i].hasTrace)
  while (traced().filter((i) => channels[i].deep).length < FIELD.minPerDepth) {
    const next = traced()
      .filter((i) => !channels[i].deep && i !== markChannel)
      .pop()
    if (next === undefined) break
    channels[next].deep = true
  }
  while (traced().filter((i) => !channels[i].deep).length < FIELD.minPerDepth) {
    const next = traced()
      .filter((i) => channels[i].deep)
      .pop()
    if (next === undefined) break
    channels[next].deep = false
  }

  return { hex8, channels, comb, mark: { channel: markChannel, vertex } }
}

export function channelsFor(variant: PlateVariant, field: Field): Channel[] {
  const { step, count } = FIELD.variants[variant]
  const out: Channel[] = []
  for (let v = 0; v < count; v += 1) out.push(field.channels[v * step])
  return out
}

/**
 * Every string here is a true statement about the artwork and nothing else.
 * SEED is the hash of the identifier the plate was drawn from, GRID 25 UNITS is
 * the minor grid pitch of the drawing, and SYNTHETIC plus DATA NONE MEASURED
 * are the disclaimer. There is no count, no index range and no ordinal, because
 * slice crops the field and any count printed in the frame would become false at
 * some breakpoint. This lives in the library rather than inline in the component
 * so a unit test can pin the disclaimer.
 */
export function chromeFor(variant: PlateVariant, field: Field): Chrome {
  const head: [string, string] = ['TRACE FIELD', 'SYNTHETIC']
  if (variant === 'card') return { head, foot: [{ key: 'SEED', value: field.hex8 }] }
  return {
    head,
    foot: [
      { key: 'SEED', value: field.hex8 },
      { key: 'GRID', value: '25 UNITS' },
      { key: 'DATA', value: 'NONE MEASURED' },
    ],
  }
}
