/**
 * The schematic request path.
 *
 * One exported constant, consumed by both the homepage and the case study page,
 * so the two renderings of the diagram cannot drift apart. The axis is unitless
 * on purpose: there are no millisecond figures, no HTTP statuses and no
 * telemetry anywhere in this file. It describes the SHAPE of a staged request,
 * nothing more.
 */

export type Span = {
  id: string
  label: string
  from: number
  to: number
  authored: boolean
  weight: 'wrapper' | 'stage'
  tailTo?: number
}

export const AXIS_MIN = 0
export const AXIS_MAX = 100

export const REQUEST_SPANS: Span[] = [
  { id: 'edge', label: 'STREAMING EDGE', from: 0, to: 100, authored: false, weight: 'wrapper' },
  { id: 'orch', label: 'ORCHESTRATION', from: 4, to: 97, authored: false, weight: 'wrapper' },
  { id: 'safety', label: 'SAFETY', from: 8, to: 26, authored: false, weight: 'stage' },
  { id: 'intent', label: 'INTENT', from: 8, to: 21, authored: false, weight: 'stage', tailTo: 26 },
  { id: 'retrieval', label: 'RETRIEVAL', from: 30, to: 58, authored: false, weight: 'stage' },
  { id: 'generation', label: 'GENERATION', from: 59, to: 85, authored: false, weight: 'stage' },
  { id: 'attribution', label: 'ATTRIBUTION', from: 30, to: 92, authored: true, weight: 'stage' },
  { id: 'state', label: 'CONVERSATION STATE', from: 86, to: 97, authored: true, weight: 'stage' },
]

/** Case study slugs that render the request path beneath their body copy. */
export const REQUEST_PATH_SLUGS = new Set(['merchant-assistant'])

const AXIS_RANGE = AXIS_MAX - AXIS_MIN

function pct(value: number): number {
  return Math.round(((value - AXIS_MIN) / AXIS_RANGE) * 100 * 1000) / 1000
}

function css(value: number): string {
  return `${pct(value)}%`
}

export function spanGeometry(span: Span): {
  left: string
  width: string
  tailLeft?: string
  tailWidth?: string
} {
  const geometry: { left: string; width: string; tailLeft?: string; tailWidth?: string } = {
    left: css(span.from),
    width: `${Math.round((pct(span.to) - pct(span.from)) * 1000) / 1000}%`,
  }

  if (span.tailTo !== undefined) {
    geometry.tailLeft = css(span.to)
    geometry.tailWidth = `${Math.round((pct(span.tailTo) - pct(span.to)) * 1000) / 1000}%`
  }

  return geometry
}
