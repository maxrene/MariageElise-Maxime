from playwright.sync_api import sync_playwright

def screenshot_favicon():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We can't easily screenshot the browser UI (favicon) in headless mode.
        # But we can verify the SVG renders by opening it directly.

        page.goto("http://localhost:8888/images/favicon.svg")
        page.set_viewport_size({"width": 200, "height": 200})
        page.screenshot(path="verification/favicon_preview.png")
        print("Screenshot of favicon SVG taken.")
        browser.close()

if __name__ == "__main__":
    screenshot_favicon()
