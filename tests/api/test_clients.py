import pytest
import uuid
import random

# Generate 200 random valid and edge-case client profiles
client_profiles = []
for i in range(200):
    client_profiles.append({
        "name": f"Name {i}",
        "lastname": f"LastName {i}",
        "cedula": f"{random.randint(100,999)}-{random.randint(1000000,9999999)}-{random.randint(0,9)}",
        "documenttype": random.choice(["Cedula", "Pasaporte", "Licencia"]),
        "phone": "809-000-0000",
        "address": f"Address {i}",
        "province": "Provincia",
        "municipality": "Municipio",
        "sector": "Sector",
        "companyname": "" if i % 2 == 0 else f"Company {i}",
        "jobposition": "" if i % 2 == 0 else f"Job {i}",
        "referenceaddress": "Ref" * (i % 5)
    })

@pytest.mark.parametrize("client_data", client_profiles)
def test_create_client(api_client, client_data):
    """Test creating a client with many variations (200 tests)."""
    payload = {
        "lender_id": api_client.user_id,
        **client_data
    }
    
    resp = api_client.post(f"{api_client.base_url}/rest/v1/clients", json=payload)
    assert resp.status_code in (201, 200), f"Failed to create client: {resp.text}"
    
    data = resp.json()
    assert isinstance(data, list) and len(data) == 1
    created_client = data[0]
    
    assert created_client["name"] == client_data["name"]
    assert created_client["cedula"] == client_data["cedula"]
    assert created_client["documenttype"] == client_data["documenttype"]
