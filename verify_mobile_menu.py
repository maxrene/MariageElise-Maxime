
from playwright.sync_api import sync_playwright, expect

def verify_mobile_menu():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # iPhone SE viewport
        context = browser.new_context(viewport={"width": 375, "height": 667}, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148")
        page = context.new_page()

        print("Navigating to liste.html...")
        page.goto("http://localhost:8888/liste.html")

        # Wait for the nav to be populated (it depends on fetching data)
        # The nav is #category-nav. It starts empty.
        print("Waiting for navigation to populate...")
        try:
            page.wait_for_selector("#category-nav ul li", timeout=10000)
        except:
            print("Timeout waiting for nav items. Taking screenshot anyway.")

        # Wait a bit for styles to settle
        page.wait_for_timeout(2000)

        # Screenshot the specific area of the nav + header to see context
        print("Taking screenshot...")
        # We screenshot the top part of the page including the sticky nav
        page.screenshot(path="mobile_menu_verification.png", clip={"x": 0, "y": 0, "width": 375, "height": 600})

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_mobile_menu()
