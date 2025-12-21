import os
import sys
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

# Define the mock data
GIFTS_CSV = """ID,Categorie,Nom,Brand,Prix,Type_Contribution,Description,ImageURL,ProductLink,Offert_par
VN1,Voyage de Noce,Hotel,Hotel Brand,1000,partiel,Description hotel,http://example.com/img.jpg,http://example.com,
LIBRE1,Autre,Participation Libre,Brand,libre,partiel,Description libre,http://example.com/img2.jpg,http://example.com,
"""

CONTRIBUTIONS_CSV = """Timestamp,ID_Cadeau,Nom_Contributeur,Montant
2023-01-01,VN1,Alice,500
2023-01-01,CAGNOTTE,Bob,200
2023-01-01,LIBRE1,Charlie,100
"""

def run_server():
    # Change directory to app root to serve files correctly
    os.chdir('/app')
    server_address = ('', 8889)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print("Serving on port 8889...")
    httpd.serve_forever()

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport to test responsive/integration
        context = browser.new_context(viewport={"width": 414, "height": 896})
        page = context.new_page()

        # Intercept requests to Google Sheets
        def handle_route(route):
            url = route.request.url
            if "gid=0" in url: # Gifts sheet
                print("Intercepting Gifts CSV")
                route.fulfill(status=200, body=GIFTS_CSV, content_type="text/csv")
            elif "gid=88609421" in url: # Contributions sheet
                print("Intercepting Contributions CSV")
                route.fulfill(status=200, body=CONTRIBUTIONS_CSV, content_type="text/csv")
            else:
                route.continue_()

        page.route("**/*docs.google.com/spreadsheets*", handle_route)

        # Navigate to the local server
        page.goto("http://localhost:8889/liste.html")

        # Wait for content to load
        try:
            page.wait_for_selector(".gift-card", timeout=5000)
            # Wait a bit more for JS processing
            time.sleep(1)
        except:
            print("Timeout waiting for gift cards")

        # Scroll to view Voyage de Noce section
        vn_header = page.locator("h3.category-title", has_text="Voyage de Noce")
        if vn_header.count() > 0:
            vn_header.scroll_into_view_if_needed()

        # Take screenshot
        screenshot_path = "/app/verification/verification.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    # Start server in background
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1) # Give server time to start

    verify()
