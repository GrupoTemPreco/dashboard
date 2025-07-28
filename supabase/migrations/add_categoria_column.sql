-- Adicionar coluna categoria às tabelas
-- Tabela faturamento
ALTER TABLE faturamento ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'bonificado';

-- Tabela estoque_2
ALTER TABLE estoque_2 ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'bonificado';

-- Tabela colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'bonificado';

-- Criar índices para melhor performance nas consultas por categoria
CREATE INDEX IF NOT EXISTS idx_faturamento_categoria ON faturamento(categoria);
CREATE INDEX IF NOT EXISTS idx_estoque_2_categoria ON estoque_2(categoria);
CREATE INDEX IF NOT EXISTS idx_colaboradores_categoria ON colaboradores(categoria);

-- Atualizar dados existentes com categorias baseadas em regras de negócio
-- Por enquanto, vamos definir todos como 'bonificado' por padrão
-- Você pode ajustar essas regras conforme necessário

-- Comentários
COMMENT ON COLUMN faturamento.categoria IS 'Categoria do produto: bonificado, etico, perfumaria, oficinais';
COMMENT ON COLUMN estoque_2.categoria IS 'Categoria do produto: bonificado, etico, perfumaria, oficinais';
COMMENT ON COLUMN colaboradores.categoria IS 'Categoria do produto: bonificado, etico, perfumaria, oficinais'; 