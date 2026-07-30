-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: company_settings
CREATE TABLE IF NOT EXISTS company_settings (
    lender_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    rnc TEXT,
    logoUrl TEXT,
    slogan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cedula TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    phoneHome TEXT,
    address TEXT NOT NULL,
    occupation TEXT,
    sex TEXT,
    income NUMERIC DEFAULT 0,
    creditScore INT DEFAULT 100,
    joinedDate DATE NOT NULL,
    status TEXT DEFAULT 'Activo',
    clientPin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: loans
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    clientName TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interestRate NUMERIC NOT NULL,
    durationWeeks INT NOT NULL,
    frequency TEXT NOT NULL,
    startDate DATE NOT NULL,
    status TEXT DEFAULT 'Activo',
    installmentAmount NUMERIC NOT NULL,
    remainingBalance NUMERIC NOT NULL,
    totalToPay NUMERIC NOT NULL,
    loanType TEXT DEFAULT 'Amortizado',
    collateralType TEXT,
    collateralRef TEXT,
    collateralDescription TEXT,
    collateralData JSONB,
    installments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    referenceId UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    paymentType TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bankName TEXT NOT NULL,
    accountNumber TEXT NOT NULL,
    accountType TEXT NOT NULL,
    holderName TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Lenders can view their own settings" ON company_settings FOR SELECT USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can insert their own settings" ON company_settings FOR INSERT WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lenders can update their own settings" ON company_settings FOR UPDATE USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can view their own clients" ON clients FOR SELECT USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lenders can update their own clients" ON clients FOR UPDATE USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can delete their own clients" ON clients FOR DELETE USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can view their own loans" ON loans FOR SELECT USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can insert their own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lenders can update their own loans" ON loans FOR UPDATE USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can delete their own loans" ON loans FOR DELETE USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lenders can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can view their own bank_accounts" ON bank_accounts FOR SELECT USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can insert their own bank_accounts" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lenders can update their own bank_accounts" ON bank_accounts FOR UPDATE USING (auth.uid() = lender_id);
CREATE POLICY "Lenders can delete their own bank_accounts" ON bank_accounts FOR DELETE USING (auth.uid() = lender_id);
