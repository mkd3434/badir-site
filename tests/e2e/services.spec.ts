import { test, expect } from '@playwright/test'

test.describe('Badir Services Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should load with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Services|Badir/)
  })

  test('should display hero with strategy-first message', async ({ page }) => {
    const hero = page.locator('.services-hero, .hero, section').first()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toContainText(/strategy|skipped/i)
  })

  test('should display problem stats section', async ({ page }) => {
    await expect(page.locator('text=90%')).toBeVisible()
    await expect(page.locator('text=$35K')).toBeVisible()
  })

  test('should display strategy comparison (with vs without)', async ({ page }) => {
    await expect(page.locator('text=Building without strategy')).toBeVisible()
    await expect(page.locator('text=Building with strategy first')).toBeVisible()
  })

  test('should display 4-phase pipeline', async ({ page }) => {
    await expect(page.locator('text=PHASE 01')).toBeVisible()
    await expect(page.locator('text=PHASE 02')).toBeVisible()
    await expect(page.locator('text=PHASE 03')).toBeVisible()
    await expect(page.locator('text=PHASE 04')).toBeVisible()
  })

  test('should display CORE framework cards', async ({ page }) => {
    const coreCards = page.locator('.core-card')
    await expect(coreCards).toHaveCount(4)
    await expect(page.locator('.core-card h3:has-text("Core Purpose")')).toBeVisible()
    await expect(page.locator('.core-card h3:has-text("Origin Story")')).toBeVisible()
    await expect(page.locator('.core-card h3:has-text("Resonance Points")')).toBeVisible()
    await expect(page.locator('.core-card h3:has-text("Expression System")')).toBeVisible()
  })

  test('should NOT display pricing section', async ({ page }) => {
    await expect(page.locator('#pricing')).not.toBeVisible()
    await expect(page.locator('.pricing-section')).not.toBeVisible()
  })

  test('should display FAQ with accordion', async ({ page }) => {
    const faqItems = page.locator('.faq-item')
    const count = await faqItems.count()
    expect(count).toBeGreaterThanOrEqual(6)

    // Test accordion toggle
    const firstQuestion = faqItems.first().locator('.faq-q')
    await firstQuestion.click()
    await expect(faqItems.first()).toHaveClass(/open/)

    // Answer should be visible
    const answer = faqItems.first().locator('.faq-a')
    await expect(answer).toBeVisible()
  })

  test('should display final CTA', async ({ page }) => {
    const cta = page.locator('text=Start a Project').last()
    await expect(cta).toBeVisible()
  })

  test('should have valid Service schema', async ({ page }) => {
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const schemas = scripts.map(s => JSON.parse(s))
    const serviceSchema = schemas.find(s => s['@type'] === 'Service')
    expect(serviceSchema).toBeDefined()
    expect(serviceSchema.name).toBe('Badir Studio Services')
    expect(serviceSchema.serviceType).toBeDefined()
    expect(serviceSchema.serviceType.length).toBe(5)
  })

  test('should have valid FAQPage schema', async ({ page }) => {
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const schemas = scripts.map(s => JSON.parse(s))
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(6)
  })

  test('should have nav with Home link back', async ({ page }) => {
    const homeLink = page.locator('nav a[href="/"]').first()
    await expect(homeLink).toBeVisible()
  })
})
