from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Verify Mobile Popup Scroll
        context_mobile = browser.new_context(
            viewport={'width': 375, 'height': 667},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
        )
        page_mobile = context_mobile.new_page()

        # Intercept CSV request to return dummy data if needed, but real data should work for layout test
        page_mobile.goto("http://localhost:8888/liste.html")

        # Click on a gift to open modal (assuming first button is clickable)
        # Wait for content to load
        page_mobile.wait_for_selector('.gift-card')

        # Click a revolut button
        page_mobile.click('.revolut-button')

        # Wait for modal
        page_mobile.wait_for_selector('#modal-content')

        # Screenshot mobile modal
        page_mobile.screenshot(path="verify_mobile_modal.png")
        print("Mobile screenshot taken.")

        # 2. Verify Progress Bar (Mocked Data)
        # We need to intercept the CSV fetch to provide data that triggers the progress bar logic
        context_desktop = browser.new_context()
        page_desktop = context_desktop.new_page()

        # Mock Gifts CSV
        mock_gifts_csv = """ID,Categorie,Nom,Brand,Prix,Type_Contribution,Description,ImageURL,ProductLink,Offert_par
1,Voyage de Noce,Partial Gift,Brand,1000,partiel,Desc,,Link,
2,Voyage de Noce,Unique Offered Gift,Brand,500,unique,Desc,,Link,TestUser
3,Voyage de Noce,Unique Not Offered,Brand,500,unique,Desc,,Link,"""

        # Mock Contributions CSV (Partial gift has 500 contributed)
        mock_contrib_csv = """Timestamp,ID_Cadeau,Nom_Contributeur,Montant
2023-01-01,1,User1,500"""

        def handle_route(route):
            if "gid=0" in route.request.url:
                route.fulfill(status=200, body=mock_gifts_csv, content_type="text/csv")
            elif "gid=88609421" in route.request.url:
                route.fulfill(status=200, body=mock_contrib_csv, content_type="text/csv")
            else:
                route.continue_()

        page_desktop.route("**/*", handle_route)

        page_desktop.goto("http://localhost:8888/liste.html")

        # Wait for "Voyage de Noce" category
        page_desktop.wait_for_selector("#cat-voyage-de-noce")

        # Scroll to it
        page_desktop.locator("#cat-voyage-de-noce").scroll_into_view_if_needed()

        # Wait for progress bar animation
        page_desktop.wait_for_timeout(1000)

        # Screenshot the category header with progress bar
        # Total Goal: 1000 + 500 + 500 = 2000
        # Total Raised: 500 (partial) + 500 (unique offered) = 1000
        # Expected %: 50%
        page_desktop.screenshot(path="verify_progress_bar.png")
        print("Progress bar screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
