import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashString,
  makeRandom,
  fieldFor,
  channelsFor,
  chromeFor,
  FIELD,
  type Field,
  type PlateVariant,
} from './plate.ts'

const SEEDS = [
  'tushar-chauhan',
  'merchant-assistant',
  'answer-attribution',
  '404',
  'a',
  'load-testing',
  'x-y-z',
]

const FIELD_VARIANTS: PlateVariant[] = ['portrait', 'banner', 'card']

/* Snapshot of fieldFor('merchant-assistant'), checked in so that any change to
   the draw order fails loudly rather than silently redrawing the whole site.
   Kept as JSON rather than as a hand transcribed object literal because a typo
   in 32 channels of 17 walk values is not a defect anyone would find by eye. */
const MERCHANT_ASSISTANT_SNAPSHOT = `{"hex8":"F2DC1878","channels":[{"from":68,"to":586,"walk":[432,700,906,1000,656,877,759,992,611,743,1000,1000,1000,1000,1000,1000,1000],"hasTrace":true,"stepped":true,"deep":true},{"from":762,"to":949,"walk":[-120,-446,-247,-159,-192,-536,-394,-330,-738,-834,-837,-1000,-1000,-935,-818,-586,-984],"hasTrace":true,"stepped":true,"deep":false},{"from":100,"to":682,"walk":[-574,-362,-77,-396,-709,-1000,-1000,-1000,-1000,-1000,-1000,-614,-907,-644,-973,-787,-567],"hasTrace":false,"stepped":false,"deep":false},{"from":69,"to":313,"walk":[321,518,500,532,325,440,857,579,202,336,15,119,385,288,96,-314,-2],"hasTrace":true,"stepped":true,"deep":false},{"from":462,"to":623,"walk":[465,100,-80,164,-166,-74,49,382,287,210,269,-139,176,-40,-167,-171,133],"hasTrace":true,"stepped":true,"deep":false},{"from":560,"to":961,"walk":[-548,-496,-874,-724,-601,-589,-753,-936,-898,-1000,-1000,-1000,-774,-982,-947,-596,-292],"hasTrace":false,"stepped":true,"deep":false},{"from":142,"to":304,"walk":[-273,-432,-412,-377,-612,-608,-230,-490,-300,-143,256,-54,-270,-470,-490,-392,-119],"hasTrace":false,"stepped":false,"deep":false},{"from":547,"to":967,"walk":[-506,-552,-213,-302,109,51,97,377,644,1000,1000,581,464,399,134,-148,-411],"hasTrace":true,"stepped":true,"deep":true},{"from":42,"to":263,"walk":[20,-326,-226,-291,-277,-78,-292,-617,-559,-897,-843,-902,-903,-819,-673,-499,-90],"hasTrace":true,"stepped":false,"deep":false},{"from":233,"to":463,"walk":[637,811,1000,1000,783,926,887,564,908,567,288,214,-106,-77,-88,-288,-630],"hasTrace":true,"stepped":false,"deep":false},{"from":118,"to":547,"walk":[461,569,297,258,305,-111,-23,-60,-308,-536,-384,-446,-104,-2,-291,34,252],"hasTrace":true,"stepped":true,"deep":false},{"from":191,"to":336,"walk":[-192,-477,-847,-967,-693,-348,-629,-630,-779,-719,-321,-622,-337,-68,-286,-605,-560],"hasTrace":true,"stepped":true,"deep":false},{"from":555,"to":851,"walk":[397,-19,-203,-142,-507,-496,-839,-1000,-1000,-580,-754,-789,-497,-397,-269,-479,-221],"hasTrace":true,"stepped":true,"deep":true,"tailTo":1000},{"from":159,"to":450,"walk":[355,528,822,1000,1000,1000,933,1000,670,973,723,720,497,166,373,320,128],"hasTrace":true,"stepped":false,"deep":false},{"from":267,"to":663,"walk":[295,117,524,416,110,71,162,396,208,-137,-193,-336,-75,-332,-425,-596,-529],"hasTrace":true,"stepped":true,"deep":false},{"from":424,"to":929,"walk":[-658,-1000,-1000,-1000,-987,-1000,-1000,-1000,-1000,-923,-876,-939,-814,-1000,-1000,-782,-1000],"hasTrace":false,"stepped":false,"deep":false},{"from":73,"to":597,"walk":[85,293,8,19,222,200,527,930,1000,980,655,312,-90,98,-191,-606,-354],"hasTrace":true,"stepped":true,"deep":true},{"from":677,"to":943,"walk":[670,476,777,939,847,460,555,240,319,490,588,874,552,484,562,662,446],"hasTrace":false,"stepped":false,"deep":false},{"from":293,"to":867,"walk":[-23,360,-57,343,685,1000,1000,1000,787,878,807,771,883,1000,1000,1000,1000],"hasTrace":false,"stepped":false,"deep":false},{"from":133,"to":361,"walk":[157,-147,245,528,283,-132,-434,-74,-304,-536,-582,-438,-617,-395,-582,-888,-995],"hasTrace":true,"stepped":false,"deep":true},{"from":6,"to":579,"walk":[-162,-290,-465,-190,-132,-465,-617,-673,-541,-655,-817,-919,-920,-605,-816,-809,-393],"hasTrace":true,"stepped":false,"deep":true},{"from":286,"to":705,"walk":[-602,-562,-898,-789,-1000,-604,-656,-615,-683,-980,-797,-561,-197,-290,-423,-724,-544],"hasTrace":false,"stepped":true,"deep":true},{"from":547,"to":924,"walk":[31,-247,-34,-171,224,174,-178,77,474,821,674,560,546,619,988,1000,913],"hasTrace":true,"stepped":false,"deep":true},{"from":480,"to":876,"walk":[-328,-627,-518,-326,-11,56,-51,-31,256,-31,370,487,532,188,528,183,-120],"hasTrace":true,"stepped":true,"deep":false},{"from":394,"to":778,"walk":[-101,-210,-596,-865,-905,-1000,-1000,-793,-432,-483,-604,-302,-595,-539,-823,-1000,-894],"hasTrace":true,"stepped":false,"deep":true},{"from":187,"to":522,"walk":[-589,-232,-298,-643,-928,-1000,-1000,-983,-1000,-819,-1000,-594,-865,-540,-950,-748,-702],"hasTrace":false,"stepped":true,"deep":true},{"from":316,"to":545,"walk":[-430,-56,101,502,775,956,1000,1000,869,902,716,830,476,576,636,287,245],"hasTrace":true,"stepped":true,"deep":true},{"from":262,"to":623,"walk":[158,554,486,305,668,252,68,389,527,438,635,223,162,497,289,16,296],"hasTrace":false,"stepped":false,"deep":false},{"from":687,"to":840,"walk":[385,219,368,297,390,9,21,-362,28,284,105,457,811,1000,1000,1000,1000],"hasTrace":true,"stepped":true,"deep":false},{"from":286,"to":603,"walk":[419,701,336,33,22,226,337,67,-102,-373,-120,-82,-213,-132,-117,163,370],"hasTrace":false,"stepped":false,"deep":true,"tailTo":728},{"from":226,"to":574,"walk":[-656,-1000,-1000,-1000,-962,-881,-526,-218,-164,-63,170,-244,-242,-660,-942,-610,-661],"hasTrace":true,"stepped":false,"deep":true},{"from":25,"to":209,"walk":[-422,-171,114,-173,-252,-568,-536,-451,-261,-140,-95,-224,30,-89,96,-76,244],"hasTrace":true,"stepped":true,"deep":true}],"comb":[3,2,2,1,3,2,0,1,0,3,3,1,0,2,1,3,1,1,1,3,3,0,2,1,3,0,3,3,1,3,0,1,1,2,0,2,2,1,0,0,2,1,0,0,1,2,0,0,1,3,2,3,1,1,0,1,2,2,3,0,1,1,0,1,1,0,1,2,0,0,2,0,0,0,2,1,3,2,1,3,2,0,2,3,1,2,0,2,1,0,2,1,1,2,0,0,1,3,1,2,0,1,1,1,3,3,1,2,3,3,0,2,1,1,3,2,0,0,0,3,3,1,2,0,3,0,2,1,2,2,1,0,0,3,0,0,1,0,0,2,0,0,1,3,2,1,2,0,1,0,3,0,1,2,1,3,0,3,1,1,2,3,2,0,1,2,3,3,0,2,0,1,2,1,0,2,2,1,1,0,2,2,0,0,0,2,3,3,2,1,3,2,3,0,2,3,0,3,0,1,2,2,0,2],"mark":{"channel":14,"vertex":7}}`

const nonCombIndices = (): number[] => {
  const out: number[] = []
  for (let i = 0; i < FIELD.channels; i += 1) if (i % FIELD.combStride !== 0) out.push(i)
  return out
}

const baselineAt = (v: number, pitch: number): number => Math.round((v + 0.5) * pitch)
const vertexX = (k: number): number => Math.round((k * FIELD.viewBox.w) / (FIELD.vertices - 1))

/* ---------------------------------- hash ---------------------------------- */

test('hashString is deterministic', () => {
  assert.equal(hashString('merchant-assistant'), hashString('merchant-assistant'))
})

test('hashString is always a non-negative integer', () => {
  for (const s of ['', 'a', 'merchant-assistant', 'answer-attribution', 'zzzz']) {
    const h = hashString(s)
    assert.ok(Number.isInteger(h), `${s} produced a non-integer`)
    assert.ok(h >= 0, `${s} produced a negative hash`)
  }
})

test('hashString separates similar inputs', () => {
  assert.notEqual(hashString('project-a'), hashString('project-b'))
})

/* ---------------------------------- PRNG ---------------------------------- */

/* Any edit to the Mulberry32 arithmetic rerolls every plate on the site, and
   this is the only test that would catch it. The literals below are the frozen
   stream, not a description of it. */
test('makeRandom yields a frozen stream', () => {
  const a = makeRandom(1)
  assert.deepEqual(
    [a(), a(), a(), a()],
    [0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741],
  )

  const b = makeRandom(hashString('a'))
  assert.deepEqual(
    [b(), b(), b(), b()],
    [0.621685681398958, 0.30822347407229245, 0.36686075991019607, 0.5951362824998796],
  )
})

/* ------------------------------- determinism ------------------------------ */

test('fieldFor is deterministic for the same seed', () => {
  for (const seed of SEEDS) assert.deepEqual(fieldFor(seed), fieldFor(seed))
})

test('fieldFor separates two slugs', () => {
  assert.notDeepEqual(fieldFor('project-a'), fieldFor('project-b'))
})

test('fieldFor matches the checked in snapshot, so the draw order cannot drift', () => {
  assert.deepEqual(
    fieldFor('merchant-assistant'),
    JSON.parse(MERCHANT_ASSISTANT_SNAPSHOT) as Field,
  )
})

/* ---------------------------------- shape --------------------------------- */

test('every field has the declared shape', () => {
  for (const seed of SEEDS) {
    const f = fieldFor(seed)
    assert.match(f.hex8, /^[0-9A-F]{8}$/, `${seed}: bad hex8`)
    assert.equal(f.channels.length, FIELD.channels, `${seed}: wrong channel count`)
    assert.equal(f.comb.length, FIELD.combTicks * 4, `${seed}: wrong comb length`)
    for (const value of f.comb) {
      assert.ok(Number.isInteger(value) && value >= 0 && value <= 3, `${seed}: comb out of range`)
    }
    for (const channel of f.channels) {
      assert.equal(channel.walk.length, FIELD.vertices, `${seed}: wrong walk length`)
      for (const w of channel.walk) {
        assert.ok(
          Number.isInteger(w) && w >= -1000 && w <= 1000,
          `${seed}: walk value ${w} out of range`,
        )
      }
    }
  }
})

test('every interval is an integer pair inside the field', () => {
  for (const seed of SEEDS) {
    for (const channel of fieldFor(seed).channels) {
      assert.ok(Number.isInteger(channel.from), `${seed}: non-integer from`)
      assert.ok(Number.isInteger(channel.to), `${seed}: non-integer to`)
      assert.ok(channel.from >= 0, `${seed}: from below zero`)
      assert.ok(channel.to <= FIELD.viewBox.w, `${seed}: to past the frame`)
      assert.ok(channel.to - channel.from >= 140, `${seed}: interval shorter than 140`)
      assert.ok(channel.to - channel.from <= 620, `${seed}: interval longer than 620`)
    }
  }
})

test('exactly two channels carry a dashed continuation', () => {
  for (const seed of SEEDS) {
    const f = fieldFor(seed)
    const tailed = f.channels
      .map((channel, i) => ({ channel, i }))
      .filter(({ channel }) => typeof channel.tailTo === 'number')
    assert.equal(tailed.length, 2, `${seed}: wrong tail count`)
    for (const { channel, i } of tailed) {
      assert.ok((channel.tailTo as number) > channel.to, `${seed}: tail does not extend`)
      assert.ok((channel.tailTo as number) <= FIELD.viewBox.w, `${seed}: tail past the frame`)
      assert.notEqual(i % FIELD.combStride, 0, `${seed}: tail on a comb row`)
    }
    assert.ok(Math.abs(tailed[0].i - tailed[1].i) >= 3, `${seed}: tails too close together`)
  }
})

/* ---------------------------------- mark ---------------------------------- */

test('the accent mark is always on a safe channel and a safe vertex', () => {
  for (const seed of SEEDS) {
    const f = fieldFor(seed)
    assert.ok(FIELD.markChannels.includes(f.mark.channel), `${seed}: mark off the frozen list`)
    assert.equal(f.mark.channel % 2, 0, `${seed}: mark lost by step 2 sampling`)
    assert.notEqual(f.mark.channel % FIELD.combStride, 0, `${seed}: mark on a comb row`)
    assert.ok(f.mark.vertex >= 4 && f.mark.vertex <= 12, `${seed}: ring vertex outside 4 to 12`)

    const m = f.channels[f.mark.channel]
    assert.equal(m.hasTrace, true, `${seed}: marked channel has no trace to ring`)
    assert.equal(m.deep, false, `${seed}: marked channel is not the brightest trace`)
    assert.ok(m.from >= FIELD.safe.x0, `${seed}: marked interval starts outside the safe band`)
    assert.ok(m.to <= FIELD.safe.x1, `${seed}: marked interval ends outside the safe band`)

    for (let k = 4; k <= 12; k += 1) {
      if (k === f.mark.vertex) continue
      const here = Math.abs(m.walk[k])
      const chosen = Math.abs(m.walk[f.mark.vertex])
      assert.ok(here <= chosen, `${seed}: vertex ${k} is a larger excursion than the chosen one`)
      if (k < f.mark.vertex) assert.ok(here < chosen, `${seed}: an earlier vertex ties the chosen one`)
    }
  }
})

/* ------------------------------ density floor ----------------------------- */

test('every field clears the trace density floor and carries both ink depths', () => {
  const nonComb = nonCombIndices()
  for (const seed of SEEDS) {
    const f = fieldFor(seed)
    const traced = nonComb.filter((i) => f.channels[i].hasTrace)
    assert.ok(
      traced.length >= FIELD.minTraced,
      `${seed}: only ${traced.length} traced channels, floor is ${FIELD.minTraced}`,
    )
    const deep = traced.filter((i) => f.channels[i].deep).length
    const bright = traced.length - deep
    assert.ok(deep >= FIELD.minPerDepth, `${seed}: only ${deep} deep traces`)
    assert.ok(bright >= FIELD.minPerDepth, `${seed}: only ${bright} bright traces`)
  }
})

/* -------------------------------- sampling -------------------------------- */

test('variants sample one field rather than reseeding it', () => {
  const f = fieldFor('merchant-assistant')

  assert.equal(channelsFor('portrait', f).length, 16)
  assert.equal(channelsFor('card', f).length, 16)
  assert.deepEqual(channelsFor('card', f), channelsFor('portrait', f))
  assert.deepEqual(
    channelsFor('portrait', f),
    f.channels.filter((_, i) => i % 2 === 0),
  )

  assert.equal(channelsFor('banner', f).length, FIELD.channels)
  assert.deepEqual(channelsFor('banner', f), f.channels)

  const mono = channelsFor('monogram', f)
  assert.equal(mono.length, 3)
  assert.deepEqual(mono, [f.channels[0], f.channels[11], f.channels[22]])
})

/* ------------------------------- chrome copy ------------------------------ */

test('plate chrome states only true things about the artwork', () => {
  const f = fieldFor('merchant-assistant')
  for (const variant of FIELD_VARIANTS) {
    const chrome = chromeFor(variant, f)
    assert.deepEqual(chrome.head, ['TRACE FIELD', 'SYNTHETIC'], `${variant}: head drifted`)
    assert.deepEqual(chrome.foot[0], { key: 'SEED', value: f.hex8 }, `${variant}: seed row drifted`)
    assert.equal(
      chrome.foot.length,
      FIELD.variants[variant].footRows,
      `${variant}: foot row count disagrees with FIELD`,
    )
    for (const row of chrome.foot) {
      assert.match(row.value, /^[0-9A-Z ]+$/, `${variant}: ${row.key} value is not frame safe`)
    }
  }

  // The disclaimer is the point of the frame, so it is pinned rather than trusted.
  const joined = [...FIELD_VARIANTS.slice(0, 2)]
    .map((variant) => {
      const chrome = chromeFor(variant, f)
      return [...chrome.head, ...chrome.foot.map((row) => `${row.key} ${row.value}`)].join(' ')
    })
    .join(' ')
  assert.ok(joined.includes('SYNTHETIC'), 'the frame stopped saying SYNTHETIC')
  assert.ok(joined.includes('NONE MEASURED'), 'the frame stopped saying NONE MEASURED')
})

/* --------------------- geometry, pure arithmetic on FIELD ------------------ */

test('FIELD.safe survives every declared crop', () => {
  const { w, h } = FIELD.viewBox
  const viewRatio = w / h
  for (const [rw, rh] of FIELD.ratios) {
    const r = rw / rh
    let x0 = 0
    let x1 = w
    let y0 = 0
    let y1 = h
    if (r < viewRatio) {
      const visible = (r / viewRatio) * w
      x0 = (w - visible) / 2
      x1 = x0 + visible
    } else if (r > viewRatio) {
      const visible = (viewRatio / r) * h
      y0 = (h - visible) / 2
      y1 = y0 + visible
    }
    assert.ok(x0 <= FIELD.safe.x0, `${rw}/${rh} crops the safe rect on the left`)
    assert.ok(x1 >= FIELD.safe.x1, `${rw}/${rh} crops the safe rect on the right`)
    assert.ok(y0 <= FIELD.safe.y0, `${rw}/${rh} crops the safe rect on the top`)
    assert.ok(y1 >= FIELD.safe.y1, `${rw}/${rh} crops the safe rect on the bottom`)
  }
})

test('an accent mark plus its own extent stays inside FIELD.safe', () => {
  const e = FIELD.accentExtent
  assert.ok(FIELD.accentSafe.x0 - e >= FIELD.safe.x0)
  assert.ok(FIELD.accentSafe.x1 + e <= FIELD.safe.x1)
  assert.ok(FIELD.accentSafe.y0 - e >= FIELD.safe.y0)
  assert.ok(FIELD.accentSafe.y1 + e <= FIELD.safe.y1)
})

/* The reach of a lane depends on which mark families that lane can carry, so
   this is asserted family by family rather than with one worst case number. A
   comb lane draws no interval, no cap and no trace; the envelope, the ring and
   the crosshair only ever appear on a FIELD.markChannels lane, which the next
   test covers on its own. */
test('no variant can draw outside the viewBox', () => {
  for (const variant of FIELD_VARIANTS) {
    const g = FIELD.variants[variant]
    const combReach = Math.max(...g.combHeights)
    const barReach = Math.max(g.capH / 2, g.barH / 2)
    const traceReach = g.amp + g.nodeSide / 2

    for (let v = 0; v < g.count; v += 1) {
      const y = baselineAt(v, g.pitch)
      assert.ok(Number.isInteger(y), `${variant}: non-integer baseline`)
      assert.ok(y >= 0 && y <= FIELD.viewBox.h, `${variant}: lane ${v} baseline off the field`)

      if ((v * g.step) % FIELD.combStride === 0) {
        assert.ok(y - combReach >= 0, `${variant}: comb lane ${v} ticks above the frame`)
        continue
      }
      assert.ok(y - barReach >= 0, `${variant}: lane ${v} caps above the frame`)
      assert.ok(y + barReach <= FIELD.viewBox.h, `${variant}: lane ${v} caps below the frame`)
      assert.ok(y - traceReach >= 0, `${variant}: lane ${v} traces above the frame`)
      assert.ok(y + traceReach <= FIELD.viewBox.h, `${variant}: lane ${v} traces below the frame`)
    }
  }
})

test('the marked lane can draw its envelope inside the viewBox at every density', () => {
  for (const variant of ['portrait', 'banner'] as PlateVariant[]) {
    const g = FIELD.variants[variant]
    for (const master of FIELD.markChannels) {
      const y = baselineAt(master / g.step, g.pitch)
      assert.ok(y - g.amp - g.envelope >= 0, `${variant}: envelope on ${master} clips at the top`)
      assert.ok(
        y + g.amp + g.envelope <= FIELD.viewBox.h,
        `${variant}: envelope on ${master} clips at the bottom`,
      )
    }
  }
})

test('every candidate mark channel keeps its ring inside FIELD.safe', () => {
  for (const variant of ['portrait', 'banner'] as PlateVariant[]) {
    const g = FIELD.variants[variant]
    for (const master of FIELD.markChannels) {
      const y = baselineAt(master / g.step, g.pitch)
      const reach = g.amp + g.ringR + 20
      assert.ok(y - reach >= FIELD.safe.y0, `${variant}: channel ${master} rings above the safe rect`)
      assert.ok(y + reach <= FIELD.safe.y1, `${variant}: channel ${master} rings below the safe rect`)
    }
  }
})

test('the comb rhythm is locked to the 100 unit major module at both densities', () => {
  for (const variant of FIELD_VARIANTS) {
    const g = FIELD.variants[variant]
    const rows: number[] = []
    for (let v = 0; v < g.count; v += 1) {
      if ((v * g.step) % FIELD.combStride === 0) rows.push(baselineAt(v, g.pitch))
    }
    assert.equal(rows.length, 4, `${variant}: wrong comb row count`)
    assert.deepEqual(
      rows,
      variant === 'banner' ? [13, 213, 413, 613] : [25, 225, 425, 625],
      `${variant}: comb rows moved`,
    )
    for (let i = 1; i < rows.length; i += 1) {
      assert.equal(rows[i] - rows[i - 1], 200, `${variant}: comb spacing is not 200`)
    }
  }
})

test('the vertex grid is frozen and no node square is clipped', () => {
  const xs = Array.from({ length: FIELD.vertices }, (_, k) => vertexX(k))
  assert.deepEqual(xs, [0, 63, 125, 188, 250, 313, 375, 438, 500, 563, 625, 688, 750, 813, 875, 938, 1000])
  for (let k = 0; k < FIELD.vertices; k += 1) {
    if (k % FIELD.nodeStride.mod !== FIELD.nodeStride.rem) continue
    assert.ok(xs[k] >= 125 && xs[k] <= 875, `node vertex ${k} sits at the frame edge`)
  }
})

test('the variant table is internally consistent and spends no accent below banner', () => {
  for (const variant of ['portrait', 'banner', 'card', 'monogram'] as PlateVariant[]) {
    const g = FIELD.variants[variant]
    assert.ok(
      (g.count - 1) * g.step < FIELD.channels,
      `${variant}: sampling walks off the end of the field`,
    )
  }
  for (const variant of FIELD_VARIANTS) {
    const g = FIELD.variants[variant]
    assert.equal(g.pitch * g.count, FIELD.viewBox.h, `${variant}: lanes do not fill the field`)
  }
  assert.equal(FIELD.variants.card.accent, false)
  assert.equal(FIELD.variants.monogram.accent, false)
  assert.equal(FIELD.variants.portrait.accent, true)
  assert.equal(FIELD.variants.banner.accent, true)
})
