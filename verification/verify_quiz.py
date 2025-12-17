from playwright.sync_api import sync_playwright

def verify_quiz(page):
    # The page uses a password protection logic (check script.js)
    # The password is 'Dublin'
    page.goto('http://localhost:8080/index.html')

    # Wait for the password modal
    page.wait_for_selector('#password-modal', state='visible')

    # Enter password
    page.fill('#password-input', 'Dublin')
    page.click('#password-submit')

    # Wait for main content
    page.wait_for_selector('#main-content', state='visible')

    # Scroll to the quiz container
    quiz_container = page.locator('#quiz-container')
    quiz_container.scroll_into_view_if_needed()

    # Verify Start Screen
    page.screenshot(path='verification/quiz_step_1_start.png')

    # Enter Name and Start
    page.fill('#quiz-player-name', 'Jules')
    page.click('#start-quiz-btn')

    # Verify Question Screen
    page.wait_for_selector('#quiz-question-screen', state='visible')
    page.wait_for_selector('#quiz-options-grid button')
    page.screenshot(path='verification/quiz_step_2_question.png')

    # Answer all questions to get to result screen
    # 10 questions. We'll answer the first option for all.
    for i in range(10):
        # Wait for options to be clickable
        page.wait_for_selector('.quiz-option-btn', state='visible')
        # Click the first option
        page.locator('.quiz-option-btn').first.click()
        # Wait for transition (loadQuestion calls are almost instant but safe to wait a bit)
        page.wait_for_timeout(200)

    # Verify Result Screen
    page.wait_for_selector('#quiz-result-screen', state='visible')
    page.wait_for_timeout(500) # Wait for score animation
    page.screenshot(path='verification/quiz_step_3_result.png')

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_quiz(page)
            print("Quiz verification complete.")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path='verification/error.png')
        finally:
            browser.close()
