import os
import requests
import unittest
import uuid
from datetime import datetime

class TestUltraMoneyLoans(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.url = os.environ.get("VITE_INSFORGE_URL", "https://sxwv82iw.us-east.insforge.app")
        cls.anon_key = os.environ.get("VITE_INSFORGE_ANON_KEY", "ik_12002a3fd3274a14e562bcce4a015fee")
        cls.headers = {
            "apikey": cls.anon_key,
            "Authorization": f"Bearer {cls.anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        cls.client_id = str(uuid.uuid4())
        cls.loan_id = str(uuid.uuid4())
        
    def test_1_create_client(self):
        payload = {
            "id": self.client_id,
            "name": "Test Client " + self.client_id[:4],
            "sex": "Masculino",
            "occupation": "Developer",
            "phone": "8095551234",
            "cedula": "11122233344",
            "address": "Calle Test",
            "status": "Activo"
        }
        response = requests.post(f"{self.url}/rest/v1/clients", headers=self.headers, json=payload)
        self.assertIn(response.status_code, [201, 200], f"Failed to create client: {response.text}")
        
    def test_2_create_loan(self):
        payload = {
            "id": self.loan_id,
            "clientid": self.client_id,
            "clientname": "Test Client " + self.client_id[:4],
            "amount": 5000,
            "interestrate": 10,
            "durationweeks": 4,
            "startdate": datetime.now().strftime("%Y-%m-%d"),
            "nextpaymentdate": datetime.now().strftime("%Y-%m-%d"),
            "installmentamount": 1375,
            "totalpaid": 0,
            "remainingamount": 5500,
            "status": "Activo",
            "paymentfrequency": "Semanal"
        }
        response = requests.post(f"{self.url}/rest/v1/loans", headers=self.headers, json=payload)
        self.assertIn(response.status_code, [201, 200], f"Failed to create loan: {response.text}")

    def test_3_delete_loan_and_client(self):
        # Cleanup
        r1 = requests.delete(f"{self.url}/rest/v1/loans?id=eq.{self.loan_id}", headers=self.headers)
        self.assertIn(r1.status_code, [204, 200])
        r2 = requests.delete(f"{self.url}/rest/v1/clients?id=eq.{self.client_id}", headers=self.headers)
        self.assertIn(r2.status_code, [204, 200])

if __name__ == '__main__':
    unittest.main()
