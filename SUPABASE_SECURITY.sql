
-- ==========================================
-- SCRIPT DE SEGURANÇA E POLÍTICAS RLS
-- VendaFlow Pro - Enterprise Security
-- ==========================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- Sem isso, qualquer pessoa com a Anon Key pode ler todos os dados de todos os usuários.
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA CLIENTES
CREATE POLICY "Usuários gerenciam seus próprios clientes" ON clients
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. POLÍTICAS PARA PRODUTOS
CREATE POLICY "Usuários gerenciam seus próprios produtos" ON products
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. POLÍTICAS PARA PEDIDOS (ORDERS)
CREATE POLICY "Usuários gerenciam seus próprios pedidos" ON orders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. POLÍTICAS PARA ITENS DO PEDIDO (ORDER_ITEMS)
-- Como order_items não tem user_id, verificamos se o pedido pai pertence ao usuário
CREATE POLICY "Usuários gerenciam itens de seus próprios pedidos" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 6. POLÍTICAS PARA TRANSAÇÕES FINANCEIRAS
CREATE POLICY "Usuários gerenciam suas próprias transações" ON transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. REFORÇO DE INTEGRIDADE: Impede que um usuário tente inserir dados com ID de outro
-- (Garantido pelas cláusulas WITH CHECK acima)
