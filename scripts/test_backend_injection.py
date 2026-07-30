import requests
import json
import random
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://sxwv82iw.us-east.insforge.app"
API_KEY = "ik_12002a3fd3274a14e562bcce4a015fee"
EMAIL = "elevateenterprisebrands@gmail.com"
PASSWORD = "Ww172839456*-@"

# Headers
HEADERS = {
    "apikey": API_KEY,
    "Content-Type": "application/json"
}

def login():
    url = f"{BASE_URL}/auth/v1/token?grant_type=password"
    payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    print("Iniciando sesión...")
    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code == 200:
        data = response.json()
        print("Sesión iniciada exitosamente!")
        return data["access_token"], data["user"]["id"]
    else:
        print("Error en login:", response.text)
        return None, None

def create_client(token, user_id, index):
    url = f"{BASE_URL}/rest/v1/clients"
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    client_data = {
        "lender_id": user_id,
        "name": f"Cliente de Prueba {index}",
        "cedula": f"402-{random.randint(1000000, 9999999)}-{random.randint(1,9)}",
        "email": f"cliente{index}@test.com",
        "phone": f"809-555-{random.randint(1000, 9999)}",
        "address": f"Calle Falsa {index}, Santo Domingo",
        "occupation": "Empleado",
        "income": random.randint(15000, 50000),
        "status": "Activo"
    }
    
    # Supabase uses Prefer: return=representation to get inserted row back
    headers["Prefer"] = "return=representation"
    
    print(f"Creando cliente {index}...")
    response = requests.post(url, headers=headers, json=client_data)
    if response.status_code in [200, 201]:
        return response.json()[0]["id"]
    else:
        print("Error creando cliente:", response.text)
        return None

def create_loan(token, user_id, client_id, client_name):
    url = f"{BASE_URL}/rest/v1/loans"
    headers = {**HEADERS, "Authorization": f"Bearer {token}", "Prefer": "return=representation"}
    
    amount = random.randint(5000, 20000)
    duration_weeks = random.choice([12, 24, 36])
    interest_rate = random.choice([5, 10, 15])
    total_to_pay = amount + (amount * (interest_rate / 100))
    
    loan_data = {
        "lender_id": user_id,
        "clientId": client_id,
        "clientName": client_name,
        "amount": amount,
        "interestRate": interest_rate,
        "durationWeeks": duration_weeks,
        "frequency": "Mensual",
        "startDate": datetime.now().strftime("%Y-%m-%d"),
        "status": "Activo",
        "installmentAmount": total_to_pay / duration_weeks,
        "remainingBalance": total_to_pay,
        "totalToPay": total_to_pay,
        "loanType": "Amortizado",
        "collateralType": "Sin Garantía"
    }
    
    print(f"Creando préstamo para {client_name}...")
    response = requests.post(url, headers=headers, json=loan_data)
    if response.status_code in [200, 201]:
        return response.json()[0]["id"]
    else:
        print("Error creando préstamo:", response.text)
        return None

def main():
    token, user_id = login()
    if not token:
        return
    
    # Crear 3 clientes de prueba
    for i in range(1, 4):
        client_id = create_client(token, user_id, i)
        if client_id:
            # Crear un préstamo para cada cliente
            create_loan(token, user_id, client_id, f"Cliente de Prueba {i}")

if __name__ == "__main__":
    main()
