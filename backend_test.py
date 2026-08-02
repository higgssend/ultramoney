import os
import requests
import unittest

class TestUltraMoneyBackend(unittest.TestCase):
    def test_clients_endpoint(self):
        # We assume the URL is injected or we fetch it from env
        url = os.environ.get("VITE_INSFORGE_URL", "https://sxwv82iw.us-east.insforge.app")
        anon_key = os.environ.get("VITE_INSFORGE_ANON_KEY", "ik_12002a3fd3274a14e562bcce4a015fee")
        
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }
        
        response = requests.get(f"{url}/rest/v1/clients?select=*", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}")
        
        data = response.json()
        self.assertIsInstance(data, list, "Expected a list of clients")

if __name__ == '__main__':
    unittest.main()
