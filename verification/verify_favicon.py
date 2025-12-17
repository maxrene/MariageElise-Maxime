from playwright.sync_api import sync_playwright

def verify_favicon():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Verify index.html
        print("Checking index.html...")
        page.goto("http://localhost:8888/index.html")

        # Check for link tag
        link = page.locator('link[rel="icon"]')
        if link.count() > 0:
            print("Found favicon link tag in index.html")
            href = link.get_attribute("href")
            print(f"Href: {href}")

            # Verify file fetch
            response = page.request.get(f"http://localhost:8888/{href}")
            if response.status == 200:
                print("Favicon file exists and is accessible")
                # Check if it looks like SVG (start of file)
                content = response.text()
                if "<svg" in content:
                    print("File content appears to be SVG")
                else:
                    print("Warning: File content does not look like SVG")
            else:
                print(f"Error: Favicon file returned status {response.status}")
        else:
            print("Error: Favicon link tag NOT found in index.html")

        # Verify liste.html
        print("\nChecking liste.html...")
        page.goto("http://localhost:8888/liste.html")

        link = page.locator('link[rel="icon"]')
        if link.count() > 0:
            print("Found favicon link tag in liste.html")
            href = link.get_attribute("href")
            print(f"Href: {href}")
            # Already verified file existence
        else:
            print("Error: Favicon link tag NOT found in liste.html")

        browser.close()

if __name__ == "__main__":
    verify_favicon()
