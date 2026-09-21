import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=1
        )
        page = await context.new_page()

        # Navigate to local server
        await page.goto("http://localhost:8000/index.html")

        # Bypass password
        await page.fill('#password-input', 'Dublin')
        await page.click('#password-submit')

        # Wait for transition
        await page.wait_for_timeout(2000)

        # Scroll to section
        await page.evaluate("""() => {
            const section = document.getElementById('souvenirs-section');
            if(section) {
                section.scrollIntoView();
                section.classList.add('is-visible');
            }
        }""")

        await page.wait_for_timeout(1000)

        # Take screenshot
        await page.screenshot(path="/home/jules/verification/screenshots/verification_server.png")

        await browser.close()

asyncio.run(verify())
