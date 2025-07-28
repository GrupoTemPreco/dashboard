-- Criar tabela estoque_2
CREATE TABLE IF NOT EXISTS estoque_2 (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id),
  produto_nome VARCHAR(255) NOT NULL,
  fabricante VARCHAR(100),
  quantidade INTEGER DEFAULT 0,
  valor_estoque DECIMAL(12,2) DEFAULT 0,
  dias_estoque INTEGER DEFAULT 0,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_estocagem TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ano_mes VARCHAR(7) DEFAULT '2025-01', -- formato YYYY-MM para filtro por mês
  necessidade VARCHAR(50) DEFAULT 'NORMAL',
  estoque_confirmado INTEGER DEFAULT 0,
  comprar INTEGER DEFAULT 0,
  curva_qtd VARCHAR(10) DEFAULT 'C',
  media_venda_mensal DECIMAL(10,2) DEFAULT 0,
  estoque_final_dias INTEGER DEFAULT 0,
  classificacao_principal VARCHAR(50) DEFAULT 'MÉDIO',
  preco_venda_medio DECIMAL(12,2) DEFAULT 0,
  ultima_venda_dias INTEGER DEFAULT 0,
  transferencia_confirmada INTEGER DEFAULT 0,
  comprar_dias INTEGER DEFAULT 0,
  necessidade_dias INTEGER DEFAULT 0,
  ultima_compra_dias INTEGER DEFAULT 0,
  apelido_unidade VARCHAR(100),
  fornecedor_ultima_compra VARCHAR(100),
  media_venda_diaria DECIMAL(10,2) DEFAULT 0,
  qtd_demanda INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  origem_estoque_minimo VARCHAR(50) DEFAULT 'SISTEMA',
  custo DECIMAL(12,2) DEFAULT 0,
  custo_medio DECIMAL(12,2) DEFAULT 0,
  curva_valor VARCHAR(10) DEFAULT 'C',
  custo_x_necessidade DECIMAL(12,2) DEFAULT 0,
  custo_x_estoque DECIMAL(12,2) DEFAULT 0,
  ruptura_venda INTEGER DEFAULT 0,
  necessidade_qtd INTEGER DEFAULT 0,
  percentual_suprida_qtd DECIMAL(5,2) DEFAULT 0,
  compra_confirmada INTEGER DEFAULT 0,
  encomenda INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_estoque_2_produto_unidade UNIQUE(unidade_id, produto_nome)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_estoque_2_unidade_id ON estoque_2(unidade_id);
CREATE INDEX IF NOT EXISTS idx_estoque_2_produto_nome ON estoque_2(produto_nome);
CREATE INDEX IF NOT EXISTS idx_estoque_2_ano_mes ON estoque_2(ano_mes);
CREATE INDEX IF NOT EXISTS idx_estoque_2_valor_estoque ON estoque_2(valor_estoque);
CREATE INDEX IF NOT EXISTS idx_estoque_2_quantidade ON estoque_2(quantidade);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_estoque_2_updated_at 
    BEFORE UPDATE ON estoque_2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela
COMMENT ON TABLE estoque_2 IS 'Tabela para armazenar dados de estoque detalhados';
COMMENT ON COLUMN estoque_2.unidade_id IS 'ID da unidade de negócio';
COMMENT ON COLUMN estoque_2.produto_nome IS 'Nome do produto';
COMMENT ON COLUMN estoque_2.fabricante IS 'Fabricante do produto';
COMMENT ON COLUMN estoque_2.quantidade IS 'Quantidade em estoque';
COMMENT ON COLUMN estoque_2.valor_estoque IS 'Valor unitário do produto';
COMMENT ON COLUMN estoque_2.dias_estoque IS 'Dias que o produto está em estoque';
COMMENT ON COLUMN estoque_2.ano_mes IS 'Período no formato YYYY-MM'; 