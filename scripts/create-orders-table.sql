-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  customer_id VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_cpf VARCHAR(14),
  customer_address TEXT,
  customer_cep VARCHAR(9),
  customer_city VARCHAR(100),
  customer_state VARCHAR(2),
  order_amount INTEGER NOT NULL, -- valor em centavos
  payment_method VARCHAR(50) NOT NULL, -- 'pix' ou 'credit_card'
  order_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  product_type VARCHAR(100),
  product_color VARCHAR(50),
  product_quantity INTEGER DEFAULT 1,
  product_sku VARCHAR(100),
  pet_name VARCHAR(255),
  pix_code TEXT, -- código PIX quando aplicável
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
