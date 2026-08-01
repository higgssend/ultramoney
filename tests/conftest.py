import os
import uuid
import pytest
import requests

INSFORGE_URL = os.environ.get("VITE_INSFORGE_URL", "https://sxwv82iw.us-east.insforge.app")
ANON_KEY = os.environ.get("VITE_INSFORGE_ANON_KEY", "ik_12002a3fd3274a14e562bcce4a015fee")

@pytest.fixture(scope="session")
def api_client():
    """
    Creates a temporary user for API testing and yields an authenticated requests.Session.
    Cleans up all user data after tests.
    """
    test_email = f"test_{uuid.uuid4().hex[:8]}@ultramoney.test"
    test_password = "TestPassword123!"
    
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    auth_resp = requests.post(
        f"{INSFORGE_URL}/auth/v1/signup",
        headers=headers,
        json={"email": test_email, "password": test_password}
    )
    
    auth_data = auth_resp.json()
    token = auth_data.get("access_token")
    user_id = auth_data.get("user", {}).get("id")
    
    if not token or not user_id:
        pytest.fail(f"Failed to create test user: {auth_data}")
        
    session = requests.Session()
    session.headers.update({
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    })
    
    # Expose user details on the session object for convenience in tests
    session.user_id = user_id
    session.base_url = INSFORGE_URL
    session.test_email = test_email
    session.test_password = test_password
    
    yield session
    
    # Cleanup: Delete data associated with this user
    requests.delete(f"{INSFORGE_URL}/rest/v1/clients?lender_id=eq.{user_id}", headers=session.headers)
    requests.delete(f"{INSFORGE_URL}/rest/v1/loans?lender_id=eq.{user_id}", headers=session.headers)

@pytest.fixture(scope="session")
def frontend_url():
    """URL where the frontend is running (default to local dev server)."""
    return os.environ.get("FRONTEND_URL", "http://localhost:5173")
