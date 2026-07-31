import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Payments.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update WhatsApp Message format in PaymentSuccessModal
old_message = "const message = `*${company.name}*\\nRecibo: ${data.transactionId}\\nCliente: ${data.clientName}\\n\\nLink web para descargar su recibo:\\n${receiptWebLink}`;"
new_message = """const message = `🏢 *${company.name}*
📄 *Recibo de Pago*: ${data.transactionId}
👤 *Cliente*: ${data.clientName}
💰 *Monto Pagado*: RD$ ${data.amount.toLocaleString()}

Link web para descargar o imprimir su recibo:
${receiptWebLink}

Gracias por su pago.`;"""

content = content.replace(old_message, new_message)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Payments.tsx patched successfully!")
