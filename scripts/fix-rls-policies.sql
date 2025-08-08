-- Script para corrigir políticas RLS do Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar status atual das políticas RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('faturamento', 'estoque_2', 'unidades', 'colaboradores');

-- 2. Desabilitar RLS temporariamente para permitir acesso
ALTER TABLE public.faturamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se há políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('faturamento', 'estoque_2', 'unidades', 'colaboradores');

-- 4. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.faturamento;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.faturamento;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.faturamento;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.estoque_2;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.estoque_2;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.estoque_2;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.unidades;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.unidades;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.unidades;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.colaboradores;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.colaboradores;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.colaboradores;

-- 5. Criar novas políticas RLS adequadas
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

-- 6. Verificar se as tabelas têm dados
SELECT 'faturamento' as tabela, COUNT(*) as total FROM public.faturamento
UNION ALL
SELECT 'estoque_2' as tabela, COUNT(*) as total FROM public.estoque_2
UNION ALL
SELECT 'unidades' as tabela, COUNT(*) as total FROM public.unidades
UNION ALL
SELECT 'colaboradores' as tabela, COUNT(*) as total FROM public.colaboradores;

-- 7. Teste de acesso direto
SELECT 'Teste unidades' as teste, COUNT(*) as total FROM public.unidades
UNION ALL
SELECT 'Teste estoque_2' as teste, COUNT(*) as total FROM public.estoque_2
UNION ALL
SELECT 'Teste faturamento' as teste, COUNT(*) as total FROM public.faturamento; 