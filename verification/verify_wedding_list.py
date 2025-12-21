from playwright.sync_api import sync_playwright

def verify_wedding_list_section():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a desktop device with mouse support to verify hover states if needed, though not strictly required here
        context = browser.new_context(has_touch=False)
        page = context.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8888/index.html")

        # Handle the password modal
        page.fill("#password-input", "Dublin")
        page.click("#password-submit")

        # Wait for the main content to be visible
        page.wait_for_selector("#main-content", state="visible")

        # Navigate to the wedding list section
        section_locator = page.locator("#liste-de-mariage-section")
        section_locator.scroll_into_view_if_needed()

        # Verify the new subtitle
        subtitle = section_locator.locator(".section-title-container .section-subtitle")
        print(f"Subtitle text: {subtitle.text_content()}")

        # Verify the new intro text paragraphs
        intro_text = section_locator.locator(".wedding-list-intro")
        paragraphs = intro_text.locator("p")
        count = paragraphs.count()
        print(f"Number of paragraphs in intro: {count}")

        for i in range(count):
            print(f"Paragraph {i+1}: {paragraphs.nth(i).text_content()}")

        # Verify the button text
        button = intro_text.locator(".cta-button")
        print(f"Button text: {button.text_content()}")

        # Take a screenshot of the section
        page.screenshot(path="verification/wedding_list_verification.png", full_page=False, clip=section_locator.bounding_box())

        browser.close()

if __name__ == "__main__":
    verify_wedding_list_section()
