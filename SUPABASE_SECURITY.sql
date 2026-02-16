
-- ======================================================
-- REPARO DEFINITIVO DE RLS - NEXERO
-- ======================================================

-- 1. LIMPEZA TOTAL DE POLÍTICAS EXISTENTES (Evita conflitos de nomes)
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. GARANTIR ESTRUTURA DE COLUNAS
-- Adicionamos a coluna e garantimos que ela tenha o valor do usuário atual por padrão
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- 3. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS "AUTORIZADO TOTAL"
-- Permite todas as operações se o user_id bater com o ID do usuário logado

-- Produtos
CREATE POLICY "products_owner_all" ON products FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Clientes
CREATE POLICY "clients_owner_all" ON clients FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Pedidos
CREATE POLICY "orders_owner_all" ON orders FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Transações
CREATE POLICY "transactions_owner_all" ON transactions FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Itens de Pedido (Acesso via Pedido Pai)
CREATE POLICY "order_items_owner_all" ON order_items FOR ALL TO authenticated 
USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Sequências de Pedido
CREATE TABLE IF NOT EXISTS order_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    current_value integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sequences_owner_all" ON order_sequences FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
