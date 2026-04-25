import { test, expect } from '@playwright/test'

test.describe('Navigation & Links', () => {
  test('desktop nav has all expected links', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const nav = page.locator('nav')
    await expect(nav.locator('a[href="#process"]')).toBeVisible()
    await expect(nav.locator('a[href="#portfolio"]')).toBeVisible()
    await expect(nav.locator('a[href="/services"]')).toBeVisible()
    await expect(nav.locator('a[href="#community"]')).toBeVisible()
    await expect(nav.locator('a[href="/about"]')).toBeVisible()
  })

  test('Services nav link goes to /services page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('nav .nav-center a[href="/services"]').click()
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/services')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('footer has Services link to /services', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const footerServicesLink = page.locator('footer a[href="/services"]')
    await expect(footerServicesLink).toBeVisible()
  })

  test('scorecard page loads', async ({ page }) => {
    const response = await page.goto('/scorecard')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Scorecard|Badir/)
  })

  test('no dead /apply link in nav', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // /apply should NOT be a nav link (it was removed)
    const applyNavLink = page.locator('nav .nav-center a[href="/apply"]')
    await expect(applyNavLink).toHaveCount(0)
  })
})

// Mobile navigation tests run in the 'mobile' project defined in playwright.config.ts
test.describe('Mobile Navigation @mobile', () => {
  test('hamburger menu opens and shows all links', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    })
    const page = await context.newPage()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const hamburger = page.locator('.hamburger')
    await expect(hamburger).toBeVisible()

    await hamburger.click()

    const mobileMenu = page.locator('#mobile-menu, .mobile-menu')
    await expect(mobileMenu.locator('a[href="/services"]')).toBeVisible()
    await expect(mobileMenu.locator('a[href="/about"]')).toBeVisible()

    await context.close()
  })

  test('mobile: Services link navigates correctly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    })
    const page = await context.newPage()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('.hamburger').click()
    await page.locator('.mobile-menu a[href="/services"]').click()
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/services')

    await context.close()
  })
})

test.describe('Cross-page consistency', () => {
  test('services page links back to homepage', async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('nav a[href="/"]').first().click()
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toBe('https://badir.studio/')
  })

  test('robots.txt is accessible and correct', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)

    const text = await page.locator('body').textContent()
    expect(text).toContain('Sitemap: https://badir.studio/sitemap.xml')
    expect(text).toContain('Disallow: /admin')
    expect(text).toContain('Disallow: /draft')
  })

  test('sitemap.xml is accessible and includes /services', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
  })
})
