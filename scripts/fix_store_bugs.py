import re

path = r'c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the Promise.all array
content = content.replace(
    "insforge.database.from('client_notes').select('*').order('created_at', { ascending: false }),",
    "insforge.database.from('client_notes').select('*').order('created_at', { ascending: false }),\n          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false }),"
)

# 2. Add the missing functions
funcs = """
  const addLoanProduct = async (product: Omit<LoanProduct, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
        const { data, error } = await insforge.database.from('loan_products').insert({
            name: product.name,
            description: product.description,
            min_amount: product.minAmount,
            max_amount: product.maxAmount,
            interest_rate: product.interestRate,
            interest_type: product.interestType,
            frequency: product.frequency,
            default_installments: product.defaultInstallments,
            requires_collateral: product.requiresCollateral,
            collateral_type: product.collateralType,
            disbursement_fee: product.disbursementFee,
            late_fee: product.lateFee,
            grace_period_days: product.gracePeriodDays,
            allow_early_payoff: product.allowEarlyPayoff,
            auto_calculate_interest: product.autoCalculateInterest,
            is_active: product.isActive,
            lender_id: currentUser.id
        }).select().single();
        if (error) throw error;
        const newProduct = {
            id: data.id,
            name: data.name, description: data.description, minAmount: data.min_amount, maxAmount: data.max_amount,
            interestRate: data.interest_rate, interestType: data.interest_type, frequency: data.frequency,
            defaultInstallments: data.default_installments, requiresCollateral: data.requires_collateral,
            collateralType: data.collateral_type, disbursementFee: data.disbursement_fee, lateFee: data.late_fee,
            gracePeriodDays: data.grace_period_days, allowEarlyPayoff: data.allow_early_payoff,
            autoCalculateInterest: data.auto_calculate_interest, isActive: data.is_active, createdAt: data.created_at
        };
        setLoanProducts(prev => [newProduct as LoanProduct, ...prev]);
        toast.success('Producto de préstamo creado.');
    } catch (e: any) {
        toast.error('Error al crear producto: ' + e.message);
    }
  };

  const updateLoanProduct = async (id: string, updates: Partial<LoanProduct>) => {
      try {
          const dbUpdates: any = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.minAmount !== undefined) dbUpdates.min_amount = updates.minAmount;
          if (updates.maxAmount !== undefined) dbUpdates.max_amount = updates.maxAmount;
          if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
          if (updates.interestType !== undefined) dbUpdates.interest_type = updates.interestType;
          if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
          if (updates.defaultInstallments !== undefined) dbUpdates.default_installments = updates.defaultInstallments;
          if (updates.requiresCollateral !== undefined) dbUpdates.requires_collateral = updates.requiresCollateral;
          if (updates.collateralType !== undefined) dbUpdates.collateral_type = updates.collateralType;
          if (updates.disbursementFee !== undefined) dbUpdates.disbursement_fee = updates.disbursementFee;
          if (updates.lateFee !== undefined) dbUpdates.late_fee = updates.lateFee;
          if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays;
          if (updates.allowEarlyPayoff !== undefined) dbUpdates.allow_early_payoff = updates.allowEarlyPayoff;
          if (updates.autoCalculateInterest !== undefined) dbUpdates.auto_calculate_interest = updates.autoCalculateInterest;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

          const { error } = await insforge.database.from('loan_products').update(dbUpdates).eq('id', id);
          if (error) throw error;
          setLoanProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
          toast.success('Producto actualizado.');
      } catch (e: any) {
          toast.error('Error al actualizar producto: ' + e.message);
      }
  };

  const deleteLoanProduct = async (id: string) => {
      try {
          const { error } = await insforge.database.from('loan_products').delete().eq('id', id);
          if (error) throw error;
          setLoanProducts(prev => prev.filter(p => p.id !== id));
          toast.success('Producto eliminado.');
      } catch (e: any) {
          toast.error('Error al eliminar producto: ' + e.message);
      }
  };

"""
# Find a place to insert them, e.g. before `return (` at the end of the file.
content = content.replace("  return (\n    <StoreContext.Provider value={{", funcs + "  return (\n    <StoreContext.Provider value={{")


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StoreContext.tsx patched for bugs!")
