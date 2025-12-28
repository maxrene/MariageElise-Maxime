from playwright.sync_api import sync_playwright

def verify_mobile_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # iPhone X viewport
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        # Load page via server
        page.goto('http://localhost:8000/liste.html')

        # Inject modal content to test styles (simulating script.js behavior)
        page.evaluate("""() => {
            const modal = document.getElementById('gift-modal');
            const content = document.getElementById('modal-content');

            content.innerHTML = `
                <h3>Test Cadeau</h3>
                <div class="partial-contribution-section">
                    <p>Ce cadeau est participatif !</p>
                    <label>Montant (€):</label>
                    <input type="number" id="contributionAmount" placeholder="Ex: 50" value="50">
                </div>
                <div class="confirmation-section" style="display:block; margin-top:20px;">
                    <label>Votre nom :</label>
                    <input type="text" id="offeredByName" placeholder="Ex: Jean D." value="Jean Test">
                </div>
            `;

            modal.style.display = 'block';
            document.getElementById('modal-overlay').style.display = 'block';
        }""")

        # Wait for styles to apply
        page.wait_for_timeout(500)

        # Check font sizes again to be sure
        text_size = page.eval_on_selector('#offeredByName', 'el => window.getComputedStyle(el).fontSize')
        number_size = page.eval_on_selector('#contributionAmount', 'el => window.getComputedStyle(el).fontSize')

        print(f"Text Input Size: {text_size}")
        print(f"Number Input Size: {number_size}")

        # Take screenshot
        page.screenshot(path='verify_mobile_modal.png')
        browser.close()

if __name__ == "__main__":
    verify_mobile_modal()
