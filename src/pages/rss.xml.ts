import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

// Drafts are withheld from the feed in a production build only, so a note that
// is still being written stays readable and testable during development.
const isPublished = ({ data }: { data: { draft: boolean } }) => !data.draft || !import.meta.env.PROD

export async function GET(context: APIContext) {
  const notes = await getCollection('blog', isPublished)
  notes.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  return rss({
    title: 'Notes by Tushar Chauhan',
    description: 'Notes on backend systems, streaming, orchestration and state.',
    site: context.site ?? 'https://resume-site.pages.dev',
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.pubDate,
      link: `/blog/${note.id}`,
    })),
    customData: '<language>en</language>',
    // The site is configured trailingSlash: 'never', so the feed must not append
    // one. @astrojs/rss defaults to appending it.
    trailingSlash: false,
  })
}
