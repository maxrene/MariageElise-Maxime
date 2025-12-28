from playwright.sync_api import sync_playwright

def verify_fontsize():
    with sync_playwright() as p:
        # Launch browser (desktop context by default, but we can resize or simulate mobile)
        browser = p.chromium.launch()
        # Create a context that resembles a mobile device
        context = browser.new_context(
            viewport={'width': 375, 'height': 667},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Load the page (assuming served locally or use file:// with proper handling)
        # Since we have external fetches, we might mock them or just check static CSS which is loaded.
        # However, the modal content is dynamic. We need to trigger it.
        # But we can also check the CSS file content or just inject the HTML structure to test.

        # Simpler: just load the page. If fetch fails, the CSS is still there.
        # But modal is hidden and empty.

        # Let's inject the modal HTML structure directly to test the CSS application.
        page.goto('file:///app/liste.html')

        # Inject modal content similar to what script.js does
        page.evaluate("""() => {
            const modalContent = document.getElementById('modal-content');
            modalContent.innerHTML = `
                <div class="partial-contribution-section">
                    <input type="number" id="contributionAmount">
                </div>
                <input type="text" id="offeredByName">
            `;
            document.getElementById('gift-modal').style.display = 'block';
        }""")

        # Check font sizes
        text_input_size = page.eval_on_selector('#offeredByName', 'el => window.getComputedStyle(el).fontSize')
        number_input_size = page.eval_on_selector('#contributionAmount', 'el => window.getComputedStyle(el).fontSize')

        print(f"Text Input Font Size: {text_input_size}")
        print(f"Number Input Font Size: {number_input_size}")

        browser.close()

if __name__ == "__main__":
    verify_fontsize()
