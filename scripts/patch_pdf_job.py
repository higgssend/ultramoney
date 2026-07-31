import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\types.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "export interface PdfJob" not in content:
    pdf_job = """
export interface PdfJob {
    id: string;
    type: 'contrato' | 'pagare' | 'recibo';
    client: Client;
    loan?: Loan;
    transaction?: Transaction;
}
"""
    content += "\n" + pdf_job
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added PdfJob to types.ts")
else:
    print("PdfJob already exists")
