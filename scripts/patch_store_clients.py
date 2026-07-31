import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add mapClient function after mapLoan
map_client_code = """
  // Helper: map DB lowercase columns to camelCase for Client objects
  const mapClient = (c: any) => ({
    ...c,
    phoneHome: c.phonehome ?? c.phoneHome,
    creditScore: c.creditscore ?? c.creditScore,
    joinedDate: c.joineddate ?? c.joinedDate,
    clientPin: c.clientpin ?? c.clientPin
  });
"""
content = content.replace(
    "const mapLoan = (l: any) => ({",
    map_client_code + "\n  const mapLoan = (l: any) => ({"
)

# 2. Update setClients calls to mapClient
content = content.replace(
    "if (clientsRes.data) setClients(clientsRes.data as unknown as Client[]);",
    "if (clientsRes.data) setClients(clientsRes.data.map(mapClient) as unknown as Client[]);"
)
content = content.replace(
    "insforge.realtime.on('clients_insert', (p: any) => setClients(prev => [p as unknown as Client, ...prev]));",
    "insforge.realtime.on('clients_insert', (p: any) => setClients(prev => [mapClient(p) as unknown as Client, ...prev]));"
)
content = content.replace(
    "insforge.realtime.on('clients_update', (p: any) => setClients(prev => prev.map(c => c.id === p.id ? p as unknown as Client : c)));",
    "insforge.realtime.on('clients_update', (p: any) => setClients(prev => prev.map(c => c.id === p.id ? mapClient(p) as unknown as Client : c)));"
)

# 3. Fix addClient
content = content.replace(
    """      phoneHome: client.phoneHome,
      address: client.address,
      occupation: client.occupation,
      sex: client.sex,
      income: client.income,
      creditScore: client.creditScore,
      joinedDate: client.joinedDate,
      status: client.status,
      clientPin: client.clientPin""",
    """      phonehome: client.phoneHome,
      address: client.address,
      occupation: client.occupation,
      sex: client.sex,
      income: client.income,
      creditscore: client.creditScore,
      joineddate: client.joinedDate,
      status: client.status,
      clientpin: client.clientPin"""
)

# 4. Fix updateClient
content = content.replace(
    """      phone: updatedClient.phone, phoneHome: updatedClient.phoneHome, address: updatedClient.address,
      occupation: updatedClient.occupation, sex: updatedClient.sex, income: updatedClient.income,
      status: updatedClient.status, clientPin: updatedClient.clientPin""",
    """      phone: updatedClient.phone, phonehome: updatedClient.phoneHome, address: updatedClient.address,
      occupation: updatedClient.occupation, sex: updatedClient.sex, income: updatedClient.income,
      status: updatedClient.status, clientpin: updatedClient.clientPin"""
)

# 5. Fix generateClientPin
content = content.replace(
    "insforge.database.from('clients').update({ clientPin: pin }).eq('id', clientId);",
    "insforge.database.from('clients').update({ clientpin: pin }).eq('id', clientId);"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("StoreContext.tsx patched successfully for Client DB keys!")
