-- Migração para corrigir problemas de segurança do Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente para permitir acesso
ALTER TABLE public.faturamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;

-- 2. Ou criar políticas RLS adequadas (recomendado para produção)
-- Política para tabela faturamento
CREATE POLICY "Enable read access for all users" ON public.faturamento
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.faturamento
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.faturamento
    FOR UPDATE USING (true);

-- Política para tabela estoque_2
CREATE POLICY "Enable read access for all users" ON public.estoque_2
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.estoque_2
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.estoque_2
    FOR UPDATE USING (true);

-- Política para tabela unidades
CREATE POLICY "Enable read access for all users" ON public.unidades
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.unidades
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.unidades
    FOR UPDATE USING (true);

-- Política para tabela colaboradores
CREATE POLICY "Enable read access for all users" ON public.colaboradores
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.colaboradores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.colaboradores
    FOR UPDATE USING (true);

-- 3. Habilitar RLS novamente (se você escolheu criar políticas)
-- ALTER TABLE public.faturamento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.estoque_2 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se as tabelas existem e têm dados
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('faturamento', 'estoque_2', 'unidades', 'colaboradores');

-- 5. Contar registros em cada tabela
SELECT 'faturamento' as tabela, COUNT(*) as total FROM public.faturamento
UNION ALL
SELECT 'estoque_2' as tabela, COUNT(*) as total FROM public.estoque_2
UNION ALL
SELECT 'unidades' as tabela, COUNT(*) as total FROM public.unidades
UNION ALL
SELECT 'colaboradores' as tabela, COUNT(*) as total FROM public.colaboradores; 