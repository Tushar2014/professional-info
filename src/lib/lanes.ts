/**
 * Lane assignment for the experience rail.
 *
 * Roles that do not overlap all share lane 0, which is the whole of the current
 * data. The function exists so that a future overlapping role (a contract on top
 * of a full time role, say) gets its own lane without any page needing a
 * rewrite. Lane numbers are never hardcoded at a call site.
 */

type LaneRole = { start: string; end: string | null }

function monthIndex(yyyymm: string): number {
  const year = Number.parseInt(yyyymm.slice(0, 4), 10)
  const month = Number.parseInt(yyyymm.slice(5, 7), 10)
  return year * 12 + (month - 1)
}

function currentMonthIndex(): number {
  const now = new Date()
  return now.getUTCFullYear() * 12 + now.getUTCMonth()
}

function endIndex(role: LaneRole): number {
  return role.end === null ? currentMonthIndex() : monthIndex(role.end)
}

function overlaps(a: LaneRole, b: LaneRole): boolean {
  return monthIndex(a.start) <= endIndex(b) && monthIndex(b.start) <= endIndex(a)
}

export function assignLanes(roles: LaneRole[]): number[] {
  const lanes: LaneRole[][] = []
  const assigned: number[] = []

  for (const role of roles) {
    let lane = 0
    while (lanes[lane] !== undefined && lanes[lane].some((other) => overlaps(role, other))) {
      lane += 1
    }
    if (lanes[lane] === undefined) lanes[lane] = []
    lanes[lane].push(role)
    assigned.push(lane)
  }

  return assigned
}
