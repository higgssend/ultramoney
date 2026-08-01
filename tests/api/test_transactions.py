import pytest
import uuid
import random
from datetime import datetime

# Generate permutations for transactions
tx_variations = []
for type_tx in ["Ingreso", "Gasto"]:
    for amount in [100, 500, 1000, 5000]:
        for method in ["Efectivo", "Transferencia", "Tarjeta"]:
            for i in range(5):  # 5 variations of each
                tx_variations.append({
                    "amount": amount + i * 10,
                    "type": type_tx,
                    "paymenttype": method,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "description": f"Test Tx {i}",
                    "currency": "RD$"
                })

@pytest.fixture
def test_loan_id(api_client):
    """Creates a temporary client and loan to associate with transactions."""
    c_resp = api_client.post(
        f"{api_client.base_url}/rest/v1/clients", 
        json={
            "lender_id": api_client.user_id,
            "name": "Tx Test",
            "lastname": "Client",
            "cedula": "000-0000000-0",
            "documenttype": "Cedula",
            "address": "X"
        }
    )
    c_id = c_resp.json()[0]["id"]
    
    l_resp = api_client.post(
        f"{api_client.base_url}/rest/v1/loans", 
        json={
            "lender_id": api_client.user_id,
            "clientid": c_id,
            "clientname": "Tx Test Client",
            "amount": 10000,
            "interestrate": 10,
            "durationweeks": 12,
            "frequency": "Mensual",
            "loantype": "Amortizado",
            "status": "Activo",
            "installmentamount": 1000,
            "remainingbalance": 10000,
            "totaltopay": 11200
        }
    )
    return l_resp.json()[0]["id"]

@pytest.mark.parametrize("tx_data", tx_variations)
def test_create_transaction(api_client, test_loan_id, tx_data):
    """Test creating a transaction with many variations (120 tests)."""
    payload = {
        "lender_id": api_client.user_id,
        "referenceid": test_loan_id,
        **tx_data
    }
    
    resp = api_client.post(f"{api_client.base_url}/rest/v1/transactions", json=payload)
    assert resp.status_code in (201, 200), f"Failed to create transaction: {resp.text}"
