import { test, expect } from '@playwright/test';

test('Capture d\'écran du pop-up de mot de passe', async ({ page }) => {
  // Naviguer vers la page locale
  await page.goto('file:///app/index.html');

  // Attendre que le modal soit potentiellement visible
  await page.waitForSelector('#password-modal', { state: 'visible', timeout: 5000 });

  // Prendre une capture d'écran
  await page.screenshot({ path: 'password-modal-avant-correction.png', fullPage: true });
});
