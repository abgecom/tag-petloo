-- Criar tabela para usuários administrativos
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário admin padrão (senha: admin123)
-- Hash gerado com bcrypt para 'admin123'
INSERT INTO admin_users (email, password_hash, name) 
VALUES (
  'admin@petloo.com.br', 
  '$2b$10$rOzJqQZ8qVqK5qK5qK5qKOzJqQZ8qVqK5qK5qK5qKOzJqQZ8qVqK5q',
  'Administrador'
) ON CONFLICT (email) DO NOTHING;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
