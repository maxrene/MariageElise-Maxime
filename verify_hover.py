from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)

    # --------------------------------------------------------
    # SCENARIO 1: Desktop Hover (Regression Test)
    # Ensure hover effect still works on desktop
    # --------------------------------------------------------
    print("Testing Desktop Hover...")
    # Explicitly set has_touch=False to emulate a desktop device with a mouse
    context_desktop = browser.new_context(
        viewport={'width': 1280, 'height': 800},
        has_touch=False
    )
    page = context_desktop.new_page()
    page.goto("http://localhost:8888/index.html")

    # Check media query support
    hover_support = page.evaluate("() => window.matchMedia('(hover: hover)').matches")
    print(f"Desktop (hover: hover) matches: {hover_support}")

    # Enter Password
    page.fill("#password-input", "Dublin")
    page.click("#password-submit")

    # Wait for content
    expect(page.locator("#main-content")).to_be_visible()

    # Scroll to Quiz and Start
    quiz_section = page.locator("#quiz-container")
    quiz_section.scroll_into_view_if_needed()

    # Enter Name and Start Quiz
    page.fill("#quiz-player-name", "TestUser")
    page.click("#start-quiz-btn")

    # Hover over first option
    first_option = page.locator(".quiz-option-btn").first
    # We force a hover event
    first_option.hover()

    # Wait a tiny bit for styles to apply
    page.wait_for_timeout(200)

    # Take screenshot of desktop hover
    page.screenshot(path="desktop_hover.png")
    print("Desktop screenshot taken.")

    # Check computed style
    bg_color = first_option.evaluate("el => getComputedStyle(el).backgroundColor")
    print(f"Desktop Hover BG Color: {bg_color}")

    # We expect the hover color
    if bg_color == "rgb(74, 65, 55)":
        print("PASS: Desktop hover color is correct.")
    else:
        print(f"FAIL: Desktop hover color is {bg_color}, expected rgb(74, 65, 55)")


    # --------------------------------------------------------
    # SCENARIO 2: Mobile Sticky Hover (Fix Verification)
    # Ensure clicking does NOT leave a sticky hover state
    # --------------------------------------------------------
    print("\nTesting Mobile Sticky Hover...")

    # iPhone 12 emulation
    iphone_12 = playwright.devices['iPhone 12']
    context_mobile = browser.new_context(**iphone_12)

    page_mobile = context_mobile.new_page()
    page_mobile.goto("http://localhost:8888/index.html")

    # Check media query support on mobile
    hover_support_m = page_mobile.evaluate("() => window.matchMedia('(hover: hover)').matches")
    print(f"Mobile (hover: hover) matches: {hover_support_m}")

    # Enter Password
    page_mobile.fill("#password-input", "Dublin")
    page_mobile.click("#password-submit")

    # Wait for content
    expect(page_mobile.locator("#main-content")).to_be_visible()

    # Scroll to Quiz and Start
    quiz_section_m = page_mobile.locator("#quiz-container")
    quiz_section_m.scroll_into_view_if_needed()

    # Enter Name and Start Quiz
    page_mobile.fill("#quiz-player-name", "MobileUser")
    page_mobile.click("#start-quiz-btn")

    # Tap the first option (answer question 1)
    first_option_m = page_mobile.locator(".quiz-option-btn").first
    first_option_m.tap()

    # Wait for next question
    page_mobile.wait_for_timeout(500)

    # Check the button at the same position (first option of next question)
    first_option_q2 = page_mobile.locator(".quiz-option-btn").first
    bg_color_m = first_option_q2.evaluate("el => getComputedStyle(el).backgroundColor")
    print(f"Mobile BG Color after tap (next question): {bg_color_m}")

    # It should be white (rgb(255, 255, 255)) or transparent, NOT the hover color.
    if bg_color_m == "rgb(255, 255, 255)" or bg_color_m == "rgba(0, 0, 0, 0)":
         print("PASS: Mobile button is NOT highlighted.")
    elif bg_color_m == "rgb(74, 65, 55)":
         print("FAIL: Mobile button IS highlighted (Sticky Hover detected).")
    else:
         print(f"INFO: Mobile button color is {bg_color_m}")

    page_mobile.screenshot(path="mobile_no_hover.png")
    print("Mobile screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
