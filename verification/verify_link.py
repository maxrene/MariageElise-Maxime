from playwright.sync_api import sync_playwright

def verify_link():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the page
        page.goto("http://localhost:8888/index.html")

        # Handle password
        page.fill("#password-input", "Dublin")
        page.click("#password-submit")

        # Wait for content to load
        page.wait_for_selector("#main-content", state="visible")

        # Navigate to Infos Pratiques (optional, but helps position)
        # Actually, let's just locate the specific link.
        # The link has class 'cta-button-small' and text "Infos aéroport Bordeaux"

        link = page.get_by_text("Infos aéroport Bordeaux")

        # Scroll it into view
        link.scroll_into_view_if_needed()

        # Get the href attribute
        href = link.get_attribute("href")
        print(f"Href found: {href}")

        expected_href = "https://www.google.com/travel/flights?q=BOD+2026-06-19+2026-06-21"
        if href == expected_href:
            print("SUCCESS: Link is correct.")
        else:
            print(f"FAILURE: Expected {expected_href}, got {href}")

        # Take a screenshot of the link area
        # We can screenshot the parent container
        container = page.locator(".transport-mode").filter(has_text="En Avion")
        container.screenshot(path="verification/link_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_link()
