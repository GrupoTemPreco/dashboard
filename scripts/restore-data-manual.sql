-- Script para restaurar dados no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.faturamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;

-- 2. Inserir unidades
INSERT INTO public.unidades (id, nome, codigo) VALUES
(1, 'FARMACIA MONTE CASTELO J.G', '02'),
(2, 'DROGARIA MAIS EM CONTA FARIA', '03'),
(3, 'DROGARIA MAIS EM CONTA DA FIGUEIRA', '04'),
(4, 'FARMACIA MONTE CASTELO V.B', '06'),
(5, 'FARMACIA MONTE CASTELO V.M', '07'),
(6, 'DROGARIA ULTRA XBROTHERS - PRIMAVERA', '08'),
(7, 'DROGARIA ULTRA XBROTHERS - VASCO', '09'),
(8, 'DROGARIA ULTRA XBROTHERS - PENHA', '10')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir dados de faturamento (exemplo para janeiro 2025)
INSERT INTO public.faturamento (ano_mes, unidade_negocio, itens_vendidos, valor_venda, percentual_total, valor_desconto, percentual_desconto, valor_custo, percentual_custo, valor_lucro, percentual_lucro) VALUES
('2025-01', 1, 8500, 425000, 15.5, 25000, 8.5, 255000, 60.0, 145000, 34.1),
('2025-01', 2, 7200, 360000, 13.1, 22000, 7.2, 216000, 60.0, 122000, 33.9),
('2025-01', 3, 6800, 340000, 12.4, 20000, 6.8, 204000, 60.0, 116000, 34.1),
('2025-01', 4, 7500, 375000, 13.7, 23000, 7.8, 225000, 60.0, 127000, 33.9),
('2025-01', 5, 8200, 410000, 14.9, 25000, 8.1, 246000, 60.0, 139000, 33.9),
('2025-01', 6, 7800, 390000, 14.2, 24000, 7.9, 234000, 60.0, 132000, 33.8),
('2025-01', 7, 7100, 355000, 12.9, 22000, 7.4, 213000, 60.0, 120000, 33.8),
('2025-01', 8, 7600, 380000, 13.8, 23000, 7.6, 228000, 60.0, 129000, 33.9)
ON CONFLICT (unidade_negocio, ano_mes) DO NOTHING;

-- 4. Inserir dados de estoque (exemplo)
INSERT INTO public.estoque_2 (unidade_id, produto_nome, fabricante, quantidade, valor_estoque, dias_estoque, ultima_venda_dias, ultima_compra_dias, ano_mes, data_atualizacao, data_estocagem) VALUES
(1, 'Paracetamol 500mg', 'EMS', 500, 15.50, 45, 3, 15, '2025-01', NOW(), NOW()),
(1, 'Dipirona 500mg', 'Neo Química', 300, 12.80, 30, 2, 10, '2025-01', NOW(), NOW()),
(1, 'Ibuprofeno 600mg', 'Aché', 400, 18.90, 60, 5, 20, '2025-01', NOW(), NOW()),
(2, 'Omeprazol 20mg', 'Medley', 200, 25.40, 90, 8, 25, '2025-01', NOW(), NOW()),
(2, 'Losartana 50mg', 'Eurofarma', 150, 32.60, 120, 12, 30, '2025-01', NOW(), NOW()),
(3, 'Metformina 500mg', 'Cristália', 250, 28.90, 75, 6, 18, '2025-01', NOW(), NOW()),
(4, 'AAS 100mg', 'Bayer', 600, 8.50, 25, 1, 7, '2025-01', NOW(), NOW()),
(5, 'Vitamina C 500mg', 'Pfizer', 350, 22.30, 50, 4, 12, '2025-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 5. Inserir dados de colaboradores (exemplo)
INSERT INTO public.colaboradores (user_id, user_name, ano_mes, unidade_negocio, itens_vendidos, valor_venda, percentual_total, valor_desconto, percentual_desconto, valor_custo, percentual_custo, valor_lucro, percentual_lucro) VALUES
('user_1_1', 'João Silva', '2025-01', 1, 1200, 60000, 14.1, 4000, 8.5, 36000, 60.0, 20000, 33.3),
('user_1_2', 'Maria Santos', '2025-01', 1, 1100, 55000, 12.9, 3500, 7.8, 33000, 60.0, 18500, 33.6),
('user_2_1', 'Pedro Oliveira', '2025-01', 2, 1000, 50000, 13.9, 3200, 7.5, 30000, 60.0, 16800, 33.6),
('user_2_2', 'Ana Costa', '2025-01', 2, 950, 47500, 13.2, 3000, 7.2, 28500, 60.0, 16000, 33.7),
('user_3_1', 'Carlos Ferreira', '2025-01', 3, 900, 45000, 13.2, 2800, 7.0, 27000, 60.0, 15200, 33.8),
('user_3_2', 'Lucia Pereira', '2025-01', 3, 850, 42500, 12.5, 2600, 6.8, 25500, 60.0, 14400, 33.9),
('user_4_1', 'Roberto Lima', '2025-01', 4, 1100, 55000, 14.7, 3500, 7.8, 33000, 60.0, 18500, 33.6),
('user_4_2', 'Fernanda Alves', '2025-01', 4, 1050, 52500, 14.0, 3300, 7.5, 31500, 60.0, 17700, 33.7)
ON CONFLICT DO NOTHING;

-- 6. Habilitar RLS novamente
ALTER TABLE public.faturamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS
CREATE POLICY "Enable read access for all users" ON public.faturamento FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.faturamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.faturamento FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.estoque_2 FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.estoque_2 FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.estoque_2 FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.unidades FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.unidades FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.unidades FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.colaboradores FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.colaboradores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.colaboradores FOR UPDATE USING (true);

-- 8. Verificar dados inseridos
SELECT 'faturamento' as tabela, COUNT(*) as total FROM public.faturamento
UNION ALL
SELECT 'estoque_2' as tabela, COUNT(*) as total FROM public.estoque_2
UNION ALL
SELECT 'unidades' as tabela, COUNT(*) as total FROM public.unidades
UNION ALL
SELECT 'colaboradores' as tabela, COUNT(*) as total FROM public.colaboradores; 