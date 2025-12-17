from playwright.sync_api import sync_playwright
import time

def verify_honeymoon_progress():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Subscribe to console events
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        # Navigate to the local server
        page.goto("http://localhost:8080/liste.html")

        # Wait for data to load
        try:
            page.wait_for_selector(".gift-card", timeout=5000)
        except:
            print("Timeout waiting for gift cards")

        # 1. Verify Category Progress Bar
        print("Verifying Category Progress Bar...")
        category_header = page.locator("#cat-voyage-de-noce").locator("..")
        progress_container = category_header.locator(".category-progress-container")

        if progress_container.is_visible():
            progress_text = progress_container.locator(".category-progress-info span").inner_text()
            print(f"Progress Text: {progress_text}")
        else:
            print("FAILURE: Progress bar container NOT found for Voyage de Noce.")

        browser.close()

if __name__ == "__main__":
    verify_honeymoon_progress()
