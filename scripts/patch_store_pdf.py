import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add PdfJob type
if "interface PdfJob" not in content:
    content = content.replace(
        "export interface StoreContextType {",
        "export interface PdfJob {\n  id: string;\n  type: 'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo';\n  client: Client;\n  loan?: Loan;\n  transaction?: Transaction;\n}\n\nexport interface StoreContextType {"
    )

    # Add pdfQueue to context type
    content = content.replace(
        "globalCurrency: 'DOP' | 'USD';",
        "globalCurrency: 'DOP' | 'USD';\n  pdfQueue: PdfJob[];\n  enqueuePdf: (job: Omit<PdfJob, 'id'>) => void;\n  removePdfJob: (id: string) => void;"
    )

    # Add state to provider
    content = content.replace(
        "const [globalCurrency, setGlobalCurrency] = useState<'DOP' | 'USD'>('DOP');",
        "const [globalCurrency, setGlobalCurrency] = useState<'DOP' | 'USD'>('DOP');\n  const [pdfQueue, setPdfQueue] = useState<PdfJob[]>([]);\n\n  const enqueuePdf = (job: Omit<PdfJob, 'id'>) => {\n    setPdfQueue(prev => [...prev, { ...job, id: Math.random().toString(36).substr(2, 9) }]);\n  };\n\n  const removePdfJob = (id: string) => {\n    setPdfQueue(prev => prev.filter(j => j.id !== id));\n  };"
    )

    # Export them
    content = content.replace(
        "globalCurrency, setGlobalCurrency,",
        "globalCurrency, setGlobalCurrency,\n      pdfQueue, enqueuePdf, removePdfJob,"
    )

    # In createLoan, after success:
    content = content.replace(
        "addToast(`Préstamo desembolsado correctamente`, 'success');",
        "addToast(`Préstamo desembolsado correctamente`, 'success');\n    enqueuePdf({ type: 'contrato', client, loan: newLoan });\n    enqueuePdf({ type: 'pagare', client, loan: newLoan });"
    )

    # In registerPayment, after success:
    content = content.replace(
        "addToast('Pago procesado correctamente', 'success');",
        "addToast('Pago procesado correctamente', 'success');\n    const theClient = clients.find(c => c.id === loan.clientId);\n    if (theClient) enqueuePdf({ type: 'recibo', client: theClient, loan, transaction: paymentData });"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("StoreContext patched for PdfQueue!")
