-- Criar tabela colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  ano_mes VARCHAR(7) NOT NULL, -- formato YYYY-MM
  unidade_negocio INTEGER NOT NULL REFERENCES unidades(id),
  itens_vendidos DECIMAL(10,2) DEFAULT 0,
  valor_venda DECIMAL(12,2) DEFAULT 0,
  percentual_total DECIMAL(5,2) DEFAULT 0,
  valor_desconto DECIMAL(12,2) DEFAULT 0,
  percentual_desconto DECIMAL(5,2) DEFAULT 0,
  valor_custo DECIMAL(12,2) DEFAULT 0,
  percentual_custo DECIMAL(5,2) DEFAULT 0,
  valor_lucro DECIMAL(12,2) DEFAULT 0,
  percentual_lucro DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_colaborador_periodo UNIQUE(user_id, ano_mes, unidade_negocio)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ano_mes ON colaboradores(ano_mes);
CREATE INDEX IF NOT EXISTS idx_colaboradores_unidade_negocio ON colaboradores(unidade_negocio);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_periodo ON colaboradores(user_id, ano_mes);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON colaboradores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela
COMMENT ON TABLE colaboradores IS 'Tabela para armazenar dados de vendas por colaborador';
COMMENT ON COLUMN colaboradores.user_id IS 'ID único do colaborador';
COMMENT ON COLUMN colaboradores.user_name IS 'Nome completo do colaborador';
COMMENT ON COLUMN colaboradores.ano_mes IS 'Período no formato YYYY-MM';
COMMENT ON COLUMN colaboradores.unidade_negocio IS 'ID da unidade de negócio';
COMMENT ON COLUMN colaboradores.itens_vendidos IS 'Quantidade de itens vendidos';
COMMENT ON COLUMN colaboradores.valor_venda IS 'Valor total das vendas';
COMMENT ON COLUMN colaboradores.percentual_total IS 'Percentual do total de vendas';
COMMENT ON COLUMN colaboradores.valor_desconto IS 'Valor total de descontos';
COMMENT ON COLUMN colaboradores.percentual_desconto IS 'Percentual de desconto';
COMMENT ON COLUMN colaboradores.valor_custo IS 'Valor total de custos';
COMMENT ON COLUMN colaboradores.percentual_custo IS 'Percentual de custo';
COMMENT ON COLUMN colaboradores.valor_lucro IS 'Valor total de lucro';
COMMENT ON COLUMN colaboradores.percentual_lucro IS 'Percentual de lucro'; 