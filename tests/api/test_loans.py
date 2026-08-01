import pytest
import random
import uuid

# Generate permutations for loans
loan_variations = []
for amount in [5000, 10000, 50000]:
    for interest in [5, 10, 15]:
        for duration in [4, 12, 24]:
            for frequency in ["Diario", "Semanal", "Quincenal", "Mensual"]:
                for loan_type in ["Amortizado", "San", "Rédito"]:
                    for collateral in ["Sin Garantía", "Vehículo", "Inmueble"]:
                        loan_variations.append({
                            "amount": amount,
                            "interestrate": interest,
                            "durationweeks": duration,
                            "frequency": frequency,
                            "loantype": loan_type,
                            "collateraltype": collateral,
                            "status": "Activo",
                            "startdate": "2026-08-01",
                            "installmentamount": amount / duration,
                            "remainingbalance": amount,
                            "totaltopay": amount * (1 + interest / 100),
                            "latefeepercentage": 10,
                            "gracedays": 3
                        })

@pytest.fixture
def test_client_id(api_client):
    """Creates a temporary client to associate with loans."""
    resp = api_client.post(
        f"{api_client.base_url}/rest/v1/clients", 
        json={
            "lender_id": api_client.user_id,
            "name": "Loan Test",
            "lastname": "Client",
            "cedula": "000-0000000-0",
            "documenttype": "Cedula",
            "address": "X"
        }
    )
    return resp.json()[0]["id"]

@pytest.mark.parametrize("loan_data", loan_variations)
def test_create_loan(api_client, test_client_id, loan_data):
    """Test creating a loan with many variations (324 tests)."""
    payload = {
        "lender_id": api_client.user_id,
        "clientid": test_client_id,
        "clientname": "Loan Test Client",
        **loan_data
    }
    
    resp = api_client.post(f"{api_client.base_url}/rest/v1/loans", json=payload)
    assert resp.status_code in (201, 200), f"Failed to create loan: {resp.text}"

@pytest.mark.parametrize("loan_data", loan_variations[:50]) # Take subset for requests to save time
def test_create_loan_request(api_client, test_client_id, loan_data):
    """Test creating a loan request with many variations (50 tests)."""
    payload = {
        "lender_id": api_client.user_id,
        "client_id": test_client_id,
        "client_name": "Loan Test Client",
        "amount": loan_data["amount"],
        "interest_rate": loan_data["interestrate"],
        "duration_weeks": loan_data["durationweeks"],
        "frequency": loan_data["frequency"],
        "loan_type": loan_data["loantype"],
        "status": "Pendiente"
    }
    
    resp = api_client.post(f"{api_client.base_url}/rest/v1/loan_requests", json=payload)
    assert resp.status_code in (201, 200), f"Failed to create loan request: {resp.text}"
