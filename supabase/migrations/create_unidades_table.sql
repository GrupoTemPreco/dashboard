-- Criar tabela unidades
CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  telefone VARCHAR(20),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir unidades padrão
INSERT INTO unidades (codigo, nome, endereco, telefone, email) VALUES
  ('02', 'Unidade Centro', 'Rua do Centro, 123', '(11) 1234-5678', 'centro@empresa.com'),
  ('03', 'Unidade Norte', 'Av. Norte, 456', '(11) 2345-6789', 'norte@empresa.com'),
  ('04', 'Unidade Sul', 'Rua Sul, 789', '(11) 3456-7890', 'sul@empresa.com'),
  ('06', 'Unidade Leste', 'Av. Leste, 321', '(11) 4567-8901', 'leste@empresa.com'),
  ('07', 'Unidade Oeste', 'Rua Oeste, 654', '(11) 5678-9012', 'oeste@empresa.com'),
  ('08', 'Unidade Central', 'Av. Central, 987', '(11) 6789-0123', 'central@empresa.com')
ON CONFLICT (codigo) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_unidades_codigo ON unidades(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_nome ON unidades(nome);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_unidades_updated_at 
    BEFORE UPDATE ON unidades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE unidades IS 'Tabela para armazenar informações das unidades de negócio';
COMMENT ON COLUMN unidades.codigo IS 'Código único da unidade';
COMMENT ON COLUMN unidades.nome IS 'Nome da unidade'; 