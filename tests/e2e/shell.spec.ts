import { test, expect } from '@playwright/test'

test('no theme control exists', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/)
})

test('the page renders its full content with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')

  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'How I design backend systems' })).toBeVisible()
  await expect(page.locator('.layers .request-path')).toHaveCount(0)
  await expect(page.locator('[data-meter]')).toHaveCount(4)

  // The meter fill is the server rendered final state, so every track already
  // carries a non zero --fill before a single line of script runs.
  const fills = page.locator('[data-meter] > span')
  const total = await fills.count()
  expect(total).toBe(4)
  for (let i = 0; i < total; i += 1) {
    const style = await fills.nth(i).getAttribute('style')
    expect(style, 'the meter span has no inline style').toBeTruthy()
    const match = /--fill:\s*([0-9.]+)/.exec(style as string)
    expect(match, `no --fill custom property in ${style}`).toBeTruthy()
    expect(Number.parseFloat((match as RegExpExecArray)[1])).toBeGreaterThan(0)
  }

  await context.close()
})

test('the skip link moves focus to main', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toHaveAccessibleName('Skip to content')
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
})
