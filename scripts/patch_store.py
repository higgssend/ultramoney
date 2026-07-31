import re

path = r'c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import LoanProduct
content = content.replace("ApiKey } from '../types';", "ApiKey, LoanProduct } from '../types';")

# 2. Add to Context Type
content = content.replace("  loans: Loan[];", "  loans: Loan[];\n  loanProducts: LoanProduct[];")
content = content.replace("  createLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;", "  createLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;\n  addLoanProduct: (product: Omit<LoanProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;\n  updateLoanProduct: (id: string, updates: Partial<LoanProduct>) => Promise<void>;\n  deleteLoanProduct: (id: string) => Promise<void>;")

# 3. Add to state
content = content.replace("  const [loans, setLoans] = useState<Loan[]>([]);", "  const [loans, setLoans] = useState<Loan[]>([]);\n  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);")

# 4. Clear on logout
content = content.replace("setLoanRequests([]);", "setLoanRequests([]); setLoanProducts([]);")

# 5. Fetch from DB
content = content.replace("notesRes, docsRes", "notesRes, docsRes, loanProductsRes")
content = content.replace("insforge.database.from('client_documents').select('*').order('upload_date', { ascending: false })", "insforge.database.from('client_documents').select('*').order('upload_date', { ascending: false }),\n          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false })")

mapping_code = """
        if (docsRes.data) setClientDocuments(docsRes.data.map((d: any) => ({...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date})) as unknown as ClientDocument[]);
        if (loanProductsRes.data) {
          setLoanProducts(loanProductsRes.data.map((p: any) => ({
            ...p,
            minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate,
            interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments,
            requiresCollateral: p.requires_collateral, collateralType: p.collateral_type,
            disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage,
            graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed,
            autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active,
            createdAt: p.created_at, updatedAt: p.updated_at
          })) as unknown as LoanProduct[]);
        }
"""
content = content.replace("        if (docsRes.data) setClientDocuments(docsRes.data.map((d: any) => ({...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date})) as unknown as ClientDocument[]);", mapping_code)

# 6. Realtime
realtime_code = """
        insforge.realtime.on('client_documents_insert', (d: any) => setClientDocuments(prev => [{...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date} as unknown as ClientDocument, ...prev]));

        insforge.realtime.on('loan_products_insert', (p: any) => setLoanProducts(prev => [{...p, minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate, interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments, requiresCollateral: p.requires_collateral, collateralType: p.collateral_type, disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage, graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed, autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active, createdAt: p.created_at, updatedAt: p.updated_at} as unknown as LoanProduct, ...prev]));
        insforge.realtime.on('loan_products_update', (p: any) => setLoanProducts(prev => prev.map(prod => prod.id === p.id ? {...p, minAmount: p.min_amount, maxAmount: p.max_amount, interestRate: p.interest_rate, interestType: p.interest_type, termMonths: p.term_months, defaultInstallments: p.default_installments, requiresCollateral: p.requires_collateral, collateralType: p.collateral_type, disbursementFee: p.disbursement_fee, lateFeePercentage: p.late_fee_percentage, graceDays: p.grace_days, prepaymentAllowed: p.prepayment_allowed, autoCalculateInterest: p.auto_calculate_interest, isActive: p.is_active, createdAt: p.created_at, updatedAt: p.updated_at} as unknown as LoanProduct : prod)));
        insforge.realtime.on('loan_products_delete', (p: any) => setLoanProducts(prev => prev.filter(prod => prod.id !== p.id)));
"""
content = content.replace("        insforge.realtime.on('client_documents_insert', (d: any) => setClientDocuments(prev => [{...d, clientId: d.client_id, fileUrl: d.file_url, fileType: d.file_type, uploadDate: d.upload_date} as unknown as ClientDocument, ...prev]));", realtime_code)

# 7. Actions Implementation
actions_code = """
  const deleteClientDocument = async (id: string) => {
    if (!currentUser) return;
    await insforge.database.from('client_documents').delete().eq('id', id);
  };

  const addLoanProduct = async (product: Omit<LoanProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    await insforge.database.from('loan_products').insert({
      lender_id: currentUser.id,
      name: product.name, description: product.description,
      min_amount: product.minAmount, max_amount: product.maxAmount,
      interest_rate: product.interestRate, interest_type: product.interestType,
      frequency: product.frequency, term_months: product.termMonths,
      default_installments: product.defaultInstallments, requires_collateral: product.requiresCollateral,
      collateral_type: product.collateralType, disbursement_fee: product.disbursementFee,
      late_fee_percentage: product.lateFeePercentage, grace_days: product.graceDays,
      prepayment_allowed: product.prepaymentAllowed, auto_calculate_interest: product.autoCalculateInterest,
      is_active: product.isActive
    });
    addAuditLog('Producto de Préstamo', `Producto ${product.name} creado.`);
  };

  const updateLoanProduct = async (id: string, updates: Partial<LoanProduct>) => {
    if (!currentUser) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.minAmount !== undefined) dbUpdates.min_amount = updates.minAmount;
    if (updates.maxAmount !== undefined) dbUpdates.max_amount = updates.maxAmount;
    if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
    if (updates.interestType !== undefined) dbUpdates.interest_type = updates.interestType;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.termMonths !== undefined) dbUpdates.term_months = updates.termMonths;
    if (updates.defaultInstallments !== undefined) dbUpdates.default_installments = updates.defaultInstallments;
    if (updates.requiresCollateral !== undefined) dbUpdates.requires_collateral = updates.requiresCollateral;
    if (updates.collateralType !== undefined) dbUpdates.collateral_type = updates.collateralType;
    if (updates.disbursementFee !== undefined) dbUpdates.disbursement_fee = updates.disbursementFee;
    if (updates.lateFeePercentage !== undefined) dbUpdates.late_fee_percentage = updates.lateFeePercentage;
    if (updates.graceDays !== undefined) dbUpdates.grace_days = updates.graceDays;
    if (updates.prepaymentAllowed !== undefined) dbUpdates.prepayment_allowed = updates.prepaymentAllowed;
    if (updates.autoCalculateInterest !== undefined) dbUpdates.auto_calculate_interest = updates.autoCalculateInterest;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    await insforge.database.from('loan_products').update(dbUpdates).eq('id', id);
    addAuditLog('Producto de Préstamo', `Producto actualizado.`);
  };

  const deleteLoanProduct = async (id: string) => {
    if (!currentUser) return;
    await insforge.database.from('loan_products').delete().eq('id', id);
    addAuditLog('Producto de Préstamo', `Producto eliminado.`);
  };
"""
content = content.replace("  const deleteClientDocument = async (id: string) => {\n    if (!currentUser) return;\n    await insforge.database.from('client_documents').delete().eq('id', id);\n  };", actions_code)

# 8. Add to provider
content = content.replace("      clients, loans, loanRequests, transactions, bankAccounts,", "      clients, loans, loanProducts, loanRequests, transactions, bankAccounts,")
content = content.replace("      login, logout, loginEmployee, logoutSystem, registerUser, updateUser, updateCompanySettings, addRole, deleteRole,", "      login, logout, loginEmployee, logoutSystem, registerUser, updateUser, updateCompanySettings, addRole, deleteRole,\n      addLoanProduct, updateLoanProduct, deleteLoanProduct,")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StoreContext.tsx patched successfully!")
