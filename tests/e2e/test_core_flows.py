import pytest
from playwright.sync_api import Page, expect
import os

@pytest.fixture(scope="session")
def frontend_url():
    return os.environ.get("FRONTEND_URL", "http://localhost:5173")

def test_login_and_navigate(page: Page, frontend_url, api_client):
    """
    Test a full user journey using Playwright.
    Uses the temporary user created in the `api_client` fixture.
    """
    # 1. Login
    page.goto(frontend_url)
    page.fill('input[type="email"]', api_client.test_email)
    page.fill('input[type="password"]', api_client.test_password)
    page.click('button[type="submit"]')
    
    # Wait for dashboard to load
    expect(page.locator("text=Resumen")).to_be_visible(timeout=10000)
    
    # 2. Go to Clients and Create One
    page.click('a[href="/clients"]')
    expect(page.locator("text=Añadir Cliente")).to_be_visible()
    page.click("text=Añadir Cliente")
    
    # Fill form
    page.fill('input[name="name"]', "E2E Test")
    page.fill('input[name="lastname"]', "Client")
    page.fill('input[name="cedula"]', "000-0000000-0")
    page.fill('input[name="phone"]', "809-555-5555")
    page.click('button:has-text("Guardar")')
    
    # 3. Go to Loans and verify
    page.click('a[href="/loans"]')
    expect(page.locator("text=Préstamos Activos")).to_be_visible()
