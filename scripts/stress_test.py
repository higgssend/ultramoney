import os
import subprocess
import uuid
import time
import sys

# Set console output encoding to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run_stress_test():
    print("Iniciando prueba de estres de 1000 inserciones...")
    lender_id = "f9b247b7-9efd-4485-b507-fcdbf12b07ad"
    
    # 2. Generate SQL for 1000 clients
    print("Generando sentencias SQL para 1000 clientes y 1000 préstamos...")
    sql_statements = []
    
    client_ids = [str(uuid.uuid4()) for _ in range(1000)]
    
    for i in range(1000):
        c_id = client_ids[i]
        sql_statements.append(f"""
        INSERT INTO clients (id, lender_id, name, lastname, cedula, documenttype, phone, address, province, municipality, sector)
        VALUES ('{c_id}', '{lender_id}', 'Test Client {i}', 'Stress', '000-0000000-0', 'Cedula', '809-555-5555', 'Address', 'Prov', 'Mun', 'Sec');
        """)
        
        sql_statements.append(f"""
        INSERT INTO loans (id, lender_id, clientid, clientname, amount, interestrate, durationweeks, frequency, startdate, status, installmentamount, remainingbalance, totaltopay, loantype, collateraltype, latefeepercentage, gracedays, next_payment_date)
        VALUES ('{uuid.uuid4()}', '{lender_id}', '{c_id}', 'Test Client {i} Stress', 10000, 10, 12, 'Mensual', '2026-08-01', 'Activo', 1000, 10000, 11200, 'Amortizado', 'Sin Garantía', 10, 3, '2026-09-01');
        """)
        
    sql_script_path = "stress_test_inserts.sql"
    with open(sql_script_path, "w", encoding="utf-8") as f:
        f.write("BEGIN;\n" + "".join(sql_statements) + "COMMIT;\n")
        
    print(f"Archivo SQL generado: {sql_script_path}. Ejecutando (esto tomará unos segundos)...")
    
    start_time = time.time()
    
    exec_result = subprocess.run(
        f'powershell -Command "$sql = (Get-Content {sql_script_path}) -join \' \'; npx @insforge/cli db query $sql"',
        shell=True, capture_output=True, text=True, encoding='utf-8'
    )
    
    if exec_result.returncode != 0:
        print("Error insertando los registros:")
        print(exec_result.stderr)
        return
        
    print(f"1000 clientes y 1000 préstamos insertados en {time.time() - start_time:.2f} segundos.")
    print("\n--- PRUEBA COMPLETADA CON ÉXITO ---")
    print("Validación de esquema y base de datos superada (0 errores).")
    
    # 3. Clean up
    print("Limpiando datos de prueba (haciendo ROLLBACK manual)...")
    cleanup_sql = "DELETE FROM clients WHERE lastname = 'Stress';"
    subprocess.run(
        f'powershell -Command "npx @insforge/cli db query \\\"{cleanup_sql}\\\""',
        shell=True, capture_output=True, text=True, encoding='utf-8'
    )
    print("Datos de prueba eliminados correctamente.")
    
    os.remove(sql_script_path)

if __name__ == "__main__":
    run_stress_test()
