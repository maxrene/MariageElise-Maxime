from playwright.sync_api import sync_playwright

def verify_cagnotte_block():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- DESKTOP VIEW ---
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto('http://localhost:8888/liste.html')

        # Wait for data to load (since it fetches via JS)
        page.wait_for_selector('.cagnotte-section', timeout=10000)

        # Scroll to the section
        element = page.locator('.cagnotte-section')
        element.scroll_into_view_if_needed()

        page.wait_for_timeout(2000) # Wait for potential animations

        # Screenshot Desktop
        page.screenshot(path='verification/cagnotte_desktop.png', full_page=False)
        print("Desktop screenshot taken.")

        # --- MOBILE VIEW ---
        page_mobile = browser.new_page(viewport={'width': 375, 'height': 667})
        page_mobile.goto('http://localhost:8888/liste.html')

        # Wait for data to load
        page_mobile.wait_for_selector('.cagnotte-section', timeout=10000)

        element_mobile = page_mobile.locator('.cagnotte-section')
        element_mobile.scroll_into_view_if_needed()

        page_mobile.wait_for_timeout(2000)

        # Screenshot Mobile
        page_mobile.screenshot(path='verification/cagnotte_mobile.png', full_page=False)
        print("Mobile screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_cagnotte_block()
