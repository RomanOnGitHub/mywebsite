from playwright.sync_api import sync_playwright, expect

def verify_graph():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the graph page (English)
        page.goto("http://localhost:4321/en/graph/")

        # Wait for the graph container to be visible
        expect(page.locator("#graph-container")).to_be_visible()

        # Wait for the canvas to be rendered inside the container
        # force-graph adds a canvas element
        page.wait_for_selector("#graph-container canvas", timeout=10000)

        # Wait a bit for the graph to stabilize
        page.wait_for_timeout(3000)

        # Take a screenshot
        page.screenshot(path="verification/graph_verification.png")

        print("Graph verification screenshot taken.")
        browser.close()

if __name__ == "__main__":
    verify_graph()
