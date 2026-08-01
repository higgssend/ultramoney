CREATE OR REPLACE FUNCTION process_late_fees()
RETURNS void AS $$
DECLARE
    loan_record RECORD;
    penalty_amount NUMERIC;
    inst_amount NUMERIC;
BEGIN
    FOR loan_record IN 
        SELECT id, "lender_id", "remainingBalance", "installmentAmount", "lateFeePercentage", "graceDays", "next_payment_date"
        FROM loans
        WHERE status = 'Activo'
          AND "next_payment_date" + (COALESCE("graceDays", 3) || ' days')::INTERVAL < NOW()
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM transactions 
            WHERE "referenceId" = loan_record.id 
              AND type = 'Cargo' 
              AND description = 'Cargo automático por mora'
              AND date >= (CURRENT_DATE - INTERVAL '7 days')
        ) THEN
            
            inst_amount := loan_record."installmentAmount";
            IF inst_amount IS NULL OR inst_amount = 0 THEN
                inst_amount := loan_record."remainingBalance" * 0.10;
            END IF;
            
            penalty_amount := inst_amount * (COALESCE(loan_record."lateFeePercentage", 10) / 100.0);
            
            INSERT INTO transactions (lender_id, date, amount, type, description, "referenceId", "paymentType")
            VALUES (
                loan_record.lender_id, 
                CURRENT_DATE, 
                penalty_amount, 
                'Cargo', 
                'Cargo automático por mora', 
                loan_record.id, 
                'Mora'
            );
            
            UPDATE loans 
            SET "remainingBalance" = "remainingBalance" + penalty_amount,
                "totalToPay" = "totalToPay" + penalty_amount,
                status = 'Atrasado'
            WHERE id = loan_record.id;
            
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
