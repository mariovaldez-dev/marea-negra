import { test, expect } from '@playwright/test'

test.describe('Marea Negra Smoke Tests', () => {
  test('Página Principal carga correctamente con título y botón de pedir', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Marea Negra/i)
    const pedirBtn = page.getByRole('link', { name: /pedir/i }).first()
    await expect(pedirBtn).toBeVisible()
  })

  test('Pantalla /pedir carga el menú y buscador', async ({ page }) => {
    await page.goto('/pedir')
    await expect(page.locator('text=MAREA NEGRA').first()).toBeVisible()
    const searchInput = page.getByPlaceholder(/Buscar/i)
    await expect(searchInput).toBeVisible()
  })

  test('Pantalla /micuenta carga correctamente', async ({ page }) => {
    await page.goto('/micuenta')
    await expect(page.locator('text=MAREA NEGRA').first()).toBeVisible()
  })
})
