-- Script para añadir soporte Multimoneda a UltraMoney

-- 1. Añadir moneda a los préstamos
ALTER TABLE public.loans ADD COLUMN currency VARCHAR(3) DEFAULT 'DOP' NOT NULL;

-- 2. Añadir moneda a las solicitudes de préstamo
ALTER TABLE public.loan_requests ADD COLUMN currency VARCHAR(3) DEFAULT 'DOP' NOT NULL;

-- 3. Añadir moneda a las transacciones
ALTER TABLE public.transactions ADD COLUMN currency VARCHAR(3) DEFAULT 'DOP' NOT NULL;

-- 4. Añadir moneda a los turnos de caja
ALTER TABLE public.cash_shifts ADD COLUMN currency VARCHAR(3) DEFAULT 'DOP' NOT NULL;
