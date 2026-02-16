
-- ======================================================
-- REPARO DE SEGURANÇA E ESTRUTURA NEXERO
-- Rode este script no SQL Editor do Supabase
-- ======================================================

-- 1. GARANTIR COLUNAS DE SEGURANÇA
-- Adiciona a coluna user_id se ela não existir em cada tabela
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE products ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clients' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transactions' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE transactions ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
END $$;

-- 2. RESET DE POLÍTICAS (LIMPEZA)
-- Removemos políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Usuários gerenciam seus produtos" ON products;
DROP POLICY IF EXISTS "Usuários gerenciam seus clientes" ON clients;
DROP POLICY IF EXISTS "Usuários gerenciam seus pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários gerenciam itens de seus pedidos" ON order_items;
DROP POLICY IF EXISTS "Usuários gerenciam suas transações" ON transactions;
DROP POLICY IF EXISTS "Usuários gerenciam suas sequências" ON order_sequences;

-- 3. REATIVAÇÃO DO RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;

-- 4. CRIAÇÃO DE NOVAS POLÍTICAS LIMPAS
-- Estas políticas permitem TUDO (SELECT, INSERT, UPDATE, DELETE) desde que o user_id seja do dono

CREATE POLICY "policy_products_all" ON products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policy_clients_all" ON clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policy_orders_all" ON orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policy_transactions_all" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policy_sequences_all" ON order_sequences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Para itens de pedido, liberamos se o pedido pai pertencer ao usuário
CREATE POLICY "policy_order_items_all" ON order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- 5. GARANTIR TABELA DE SEQUÊNCIAS
CREATE TABLE IF NOT EXISTS order_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    current_value integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "policy_sequences_all" ON order_sequences;
CREATE POLICY "policy_sequences_all" ON order_sequences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
