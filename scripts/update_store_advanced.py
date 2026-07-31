import re

path = r'c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to fix the addLoanProduct and updateLoanProduct implementation.
# In my previous script `fix_store_bugs.py` I wrote:
old_insert = """        const { data, error } = await insforge.database.from('loan_products').insert({
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
        };"""

new_insert = """        const { data, error } = await insforge.database.from('loan_products').insert({
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
            late_fee: product.lateFeePercentage,
            grace_period_days: product.graceDays,
            allow_early_payoff: product.prepaymentAllowed,
            auto_calculate_interest: product.autoCalculateInterest,
            is_active: product.isActive,
            amortization_method: product.amortizationMethod,
            payment_order: product.paymentOrder,
            recalculate_interest_on_early_payoff: product.recalculateInterestOnEarlyPayoff,
            capitalization_frequency: product.capitalizationFrequency,
            lender_id: currentUser.id
        }).select().single();
        if (error) throw error;
        const newProduct = {
            id: data.id,
            name: data.name, description: data.description, minAmount: data.min_amount, maxAmount: data.max_amount,
            interestRate: data.interest_rate, interestType: data.interest_type, frequency: data.frequency,
            defaultInstallments: data.default_installments, requiresCollateral: data.requires_collateral,
            collateralType: data.collateral_type, disbursementFee: data.disbursement_fee, lateFeePercentage: data.late_fee,
            graceDays: data.grace_period_days, prepaymentAllowed: data.allow_early_payoff,
            autoCalculateInterest: data.auto_calculate_interest, isActive: data.is_active, 
            amortizationMethod: data.amortization_method, paymentOrder: data.payment_order, 
            recalculateInterestOnEarlyPayoff: data.recalculate_interest_on_early_payoff,
            capitalizationFrequency: data.capitalization_frequency,
            createdAt: data.created_at
        };"""

content = content.replace(old_insert, new_insert)

old_update = """          if (updates.lateFee !== undefined) dbUpdates.late_fee = updates.lateFee;
          if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays;
          if (updates.allowEarlyPayoff !== undefined) dbUpdates.allow_early_payoff = updates.allowEarlyPayoff;
          if (updates.autoCalculateInterest !== undefined) dbUpdates.auto_calculate_interest = updates.autoCalculateInterest;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;"""

new_update = """          if (updates.lateFeePercentage !== undefined) dbUpdates.late_fee = updates.lateFeePercentage;
          if (updates.graceDays !== undefined) dbUpdates.grace_period_days = updates.graceDays;
          if (updates.prepaymentAllowed !== undefined) dbUpdates.allow_early_payoff = updates.prepaymentAllowed;
          if (updates.autoCalculateInterest !== undefined) dbUpdates.auto_calculate_interest = updates.autoCalculateInterest;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
          if (updates.amortizationMethod !== undefined) dbUpdates.amortization_method = updates.amortizationMethod;
          if (updates.paymentOrder !== undefined) dbUpdates.payment_order = updates.paymentOrder;
          if (updates.recalculateInterestOnEarlyPayoff !== undefined) dbUpdates.recalculate_interest_on_early_payoff = updates.recalculateInterestOnEarlyPayoff;
          if (updates.capitalizationFrequency !== undefined) dbUpdates.capitalization_frequency = updates.capitalizationFrequency;"""
          
content = content.replace(old_update, new_update)

# Now in the main fetch loop, mapLoanProduct:
# Where loanProductsRes is mapped
fetch_old = "if (loanProductsRes.data) setLoanProducts(loanProductsRes.data as unknown as LoanProduct[]);"
fetch_new = """if (loanProductsRes.data) setLoanProducts(loanProductsRes.data.map((data: any) => ({
            id: data.id,
            name: data.name, description: data.description, minAmount: data.min_amount, maxAmount: data.max_amount,
            interestRate: data.interest_rate, interestType: data.interest_type, frequency: data.frequency,
            defaultInstallments: data.default_installments, requiresCollateral: data.requires_collateral,
            collateralType: data.collateral_type, disbursementFee: data.disbursement_fee, lateFeePercentage: data.late_fee,
            graceDays: data.grace_period_days, prepaymentAllowed: data.allow_early_payoff,
            autoCalculateInterest: data.auto_calculate_interest, isActive: data.is_active, 
            amortizationMethod: data.amortization_method, paymentOrder: data.payment_order, 
            recalculateInterestOnEarlyPayoff: data.recalculate_interest_on_early_payoff,
            capitalizationFrequency: data.capitalization_frequency,
            createdAt: data.created_at
        })) as unknown as LoanProduct[]);"""

content = content.replace(fetch_old, fetch_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StoreContext.tsx updated with Advanced Fields!")
