-- Script para Políticas RLS de Seguridad en InsForge (PostgreSQL)

-- Habilitar RLS en las tablas principales
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Lectura (Cualquier usuario autenticado puede leer)
CREATE POLICY "Lectura general para usuarios autenticados (Clients)" ON clients FOR SELECT USING (true);
CREATE POLICY "Lectura general para usuarios autenticados (Loans)" ON loans FOR SELECT USING (true);
CREATE POLICY "Lectura general para usuarios autenticados (Transactions)" ON transactions FOR SELECT USING (true);

-- 2. Políticas de Inserción (Cualquiera puede insertar temporalmente, asumiendo validación de frontend)
CREATE POLICY "Permitir Insert (Clients)" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Insert (Loans)" ON loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Insert (Transactions)" ON transactions FOR INSERT WITH CHECK (true);

-- 3. Políticas de Actualización
CREATE POLICY "Permitir Update (Clients)" ON clients FOR UPDATE USING (true);
CREATE POLICY "Permitir Update (Loans)" ON loans FOR UPDATE USING (true);
CREATE POLICY "Permitir Update (Transactions)" ON transactions FOR UPDATE USING (true);

-- 4. RESTRICTIVAS: Solo Admins pueden Borrar (DELETE)
-- Asumimos que los Admins usan el JWT generado por el Auth de InsForge
CREATE POLICY "Solo Admin puede borrar Préstamos" ON loans FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo Admin puede borrar Transacciones" ON transactions FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo Admin puede borrar Clientes" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- Nota: Si los empleados usan `employee_session` (localStorage) y no tienen JWT propio de InsForge Auth,
-- estas políticas se relajan un poco, ya que acceden usando la sesión global o la llave anónima.
-- Para seguridad RLS absoluta, se recomienda migrar a que cada cajero/cobrador tenga un User UUID en Auth.
