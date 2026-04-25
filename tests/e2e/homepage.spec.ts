import { test, expect } from '@playwright/test'

test.describe('Badir Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should load with correct title and meta', async ({ page }) => {
    await expect(page).toHaveTitle(/Badir/)
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /product studio|Muslim builders/i)
  })

  test('should display hero section with key elements', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Build businesses')
    await expect(page.locator('h1')).toContainText('Serve the Ummah')

    // Hero CTAs
    const heroCtas = page.locator('.hero-ctas a')
    await expect(heroCtas).toHaveCount(2)
  })

  test('should display stats bar', async ({ page }) => {
    const stats = page.locator('.stats-bar .stat')
    await expect(stats).toHaveCount(4)
    await expect(page.locator('.stats-bar')).toContainText('24')
    await expect(page.locator('.stats-bar')).toContainText('AI Agents')
  })

  test('should display mission strip with Quran verse', async ({ page }) => {
    const mission = page.locator('.mission-strip')
    await expect(mission).toBeVisible()
    await expect(mission).toContainText('فَاسْتَبِقُوا الْخَيْرَاتِ')
    await expect(mission).toContainText('540 million')
  })

  test('should display 4-phase process', async ({ page }) => {
    const steps = page.locator('.process-step')
    await expect(steps).toHaveCount(4)
    await expect(page.locator('#process')).toContainText('Discovery')
    await expect(page.locator('#process')).toContainText('Brand')
    await expect(page.locator('#process')).toContainText('Build')
    await expect(page.locator('#process')).toContainText('Monitor')
  })

  test('should display portfolio with projects', async ({ page }) => {
    const projects = page.locator('#portfolio .project')
    const count = await projects.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('should display "Why This Matters" section', async ({ page }) => {
    const whySection = page.locator('.why-section')
    await expect(whySection).toBeVisible()

    // Gap and solution cards
    await expect(page.locator('.why-problem')).toContainText('1.8 billion Muslims')
    await expect(page.locator('.why-problem')).toContainText('67% underrepresented')
    await expect(page.locator('.why-solution')).toContainText("We don't inspire. We build.")

    // 4 pillars
    const pillars = page.locator('.why-pillar')
    await expect(pillars).toHaveCount(4)

    // Quranic quote
    await expect(whySection).toContainText('Ar-Ra\'d 13:11')
  })

  test('should display services section with 3 cards', async ({ page }) => {
    const svcCards = page.locator('.svc-card')
    await expect(svcCards).toHaveCount(3)
    await expect(page.locator('#services')).toContainText('AI Operating System')
    await expect(page.locator('#services')).toContainText('Brand Strategy')
    await expect(page.locator('#services')).toContainText('Product Sprints')
  })

  test('should display community section with cards', async ({ page }) => {
    const communityCards = page.locator('.community-card')
    const count = await communityCards.count()
    expect(count).toBeGreaterThanOrEqual(4)

    // Flywheel
    await expect(page.locator('.community-flywheel')).toBeVisible()
  })

  test('should display founder section and AI agent panel', async ({ page }) => {
    await expect(page.locator('.founder-name')).toContainText('Mustafa')
    await expect(page.locator('.agent-panel')).toBeVisible()
    await expect(page.locator('.agent-panel')).toContainText('24 agents online')
  })

  test('should display builder application form', async ({ page }) => {
    const form = page.locator('#apply-form')
    await expect(form).toBeVisible()
    await expect(form.locator('input[name="name"], #apply-name')).toBeVisible()
    await expect(form.locator('input[type="email"], #apply-email')).toBeVisible()
  })

  test('should have valid structured data', async ({ page }) => {
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(scripts.length).toBeGreaterThanOrEqual(1)

    const schemas = scripts.map(s => JSON.parse(s))
    const orgSchema = schemas.find(s => s['@type'] === 'Organization')
    expect(orgSchema).toBeDefined()
    expect(orgSchema.name).toBe('Badir Studio')

    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage')
    expect(faqSchema).toBeDefined()
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(8)
  })

  test('should have canonical URL', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://badir.studio')
  })
})
