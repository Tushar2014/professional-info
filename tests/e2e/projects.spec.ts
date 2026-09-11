import { test, expect } from '@playwright/test'

// The tag list is generated from whatever project content exists, so these
// tests read a real tag out of the rendered filter rather than naming one.
// Hardcoding a tag would make the suite fail the moment content changes.
async function firstTag(page: import('@playwright/test').Page): Promise<string> {
  const tag = await page.locator('[data-tag]:not([data-tag="all"])').first().getAttribute('data-tag')
  expect(tag, 'the filter rendered no tags, so there is nothing to filter by').toBeTruthy()
  return tag as string
}

test('all projects are listed by default', async ({ page }) => {
  await page.goto('/projects')
  const rows = page.locator('[data-project]')
  await expect(rows.first()).toBeVisible()
  const total = await rows.count()
  expect(total).toBeGreaterThan(0)
  await expect(page.locator('[data-project]:visible')).toHaveCount(total)
})

test('the page lists every project without client-side JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/projects')
  await expect(page.locator('[data-project]').first()).toBeVisible()
  const total = await page.locator('[data-project]').count()
  await expect(page.locator('[data-project]:visible')).toHaveCount(total)
  await context.close()
})

test('selecting a tag hides projects without it', async ({ page }) => {
  await page.goto('/projects')
  const tag = await firstTag(page)
  const total = await page.locator('[data-project]').count()

  await page.locator(`[data-tag="${tag}"]`).click()

  const shown = page.locator('[data-project]:visible')
  await expect(shown.first()).toBeVisible()
  expect(await shown.count()).toBeLessThanOrEqual(total)
  for (const row of await shown.all()) {
    expect((await row.getAttribute('data-tags'))?.split(' ')).toContain(tag)
  }
  // Every hidden row must lack the tag, which is the half a single-project
  // fixture cannot demonstrate on its own.
  for (const row of await page.locator('[data-project][hidden]').all()) {
    expect((await row.getAttribute('data-tags'))?.split(' ')).not.toContain(tag)
  }
})

test('the active tag is announced as pressed and the others are not', async ({ page }) => {
  await page.goto('/projects')
  const tag = await firstTag(page)
  const button = page.locator(`[data-tag="${tag}"]`)
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-tag="all"]')).toHaveAttribute('aria-pressed', 'false')
})

test('selecting all restores every project', async ({ page }) => {
  await page.goto('/projects')
  const tag = await firstTag(page)
  const total = await page.locator('[data-project]').count()
  await page.locator(`[data-tag="${tag}"]`).click()
  await page.locator('[data-tag="all"]').click()
  await expect(page.locator('[data-project]:visible')).toHaveCount(total)
})
