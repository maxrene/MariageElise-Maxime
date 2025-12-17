from playwright.sync_api import sync_playwright

def verify_honeymoon_progress():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/liste.html")

        # Wait for data to load
        page.wait_for_selector(".gift-card", timeout=10000)

        # Scroll to Voyage de Noce section
        page.locator("#cat-voyage-de-noce").scroll_into_view_if_needed()

        # Take a screenshot
        page.screenshot(path="verification/honeymoon_progress.png")
        print("Screenshot saved to verification/honeymoon_progress.png")

        browser.close()

if __name__ == "__main__":
    verify_honeymoon_progress()
