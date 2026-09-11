import { z } from 'astro/zod'

const YearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'expected YYYY-MM')

export const ProfileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  bio: z.string().min(1),
  email: z.string().email(),
  socials: z.array(z.object({ label: z.string().min(1), href: z.string().url() })).min(1),
  experience: z
    .array(
      z.object({
        company: z.string().min(1),
        title: z.string().min(1),
        team: z.string().optional(),
        start: YearMonth,
        end: YearMonth.nullable(),
        summary: z.string().min(1),
        highlights: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  skills: z.array(z.object({ group: z.string().min(1), items: z.array(z.string().min(1)).min(1) })),
  education: z.array(
    z.object({
      degree: z.string().min(1),
      institution: z.string().min(1),
      start: YearMonth,
      end: YearMonth,
    }),
  ),
})

export type Profile = z.infer<typeof ProfileSchema>

export function formatRange(start: string, end: string | null): string {
  const from = start.slice(0, 4)
  return end === null ? `${from}–now` : `${from}–${end.slice(0, 4)}`
}

export function isCurrent(role: { end: string | null }): boolean {
  return role.end === null
}
