const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de exemplo para estoque_2 com classificações para testar filtros
const estoque2Data = [
  // Bonificado
  { unidade_id: 2, produto_nome: 'EDISTRIDE 10MG C/30 COMP', fabricante: 'MERCK', quantidade: 15, valor_estoque: 2407, dias_estoque: 45, ano_mes: '2025-01', classificacao_principal: 'bonificado' },
  { unidade_id: 2, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 1200, dias_estoque: 36, ano_mes: '2025-01', classificacao_principal: 'bonificado oneroso' },
  { unidade_id: 3, produto_nome: 'ARIPIPRAZOL 15MG C/30 COM', fabricante: 'EMS', quantidade: 3, valor_estoque: 1100, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'antibiotico' },
  { unidade_id: 4, produto_nome: 'CLORIDRATO DE METFORMINA', fabricante: 'EMS', quantidade: 13, valor_estoque: 1700, dias_estoque: 39, ano_mes: '2025-01', classificacao_principal: 'generico' },
  
  // Medicamentos
  { unidade_id: 6, produto_nome: 'CISTEIL 600MG C/30 COMP', fabricante: 'EMS', quantidade: 6, valor_estoque: 900, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'antibiotico' },
  { unidade_id: 7, produto_nome: 'PARACETAMOL 750MG C/20 COMP', fabricante: 'GENERICO', quantidade: 12, valor_estoque: 800, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'anticoncepcional' },
  { unidade_id: 8, produto_nome: 'DIPIRONA 500MG C/10 CP PRA', fabricante: 'EMS', quantidade: 14, valor_estoque: 1500, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'cartelados' },
  
  // Perfumaria
  { unidade_id: 2, produto_nome: 'FR BABYSEC MEGA M', fabricante: 'JOHNSON', quantidade: 12, valor_estoque: 2319, dias_estoque: 55, ano_mes: '2025-01', classificacao_principal: 'perfumaria' },
  { unidade_id: 3, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 8, valor_estoque: 2199, dias_estoque: 40, ano_mes: '2025-01', classificacao_principal: 'cosmeticos' },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA G', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 2004, dias_estoque: 38, ano_mes: '2025-01', classificacao_principal: 'beleza' },
  { unidade_id: 6, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 11, valor_estoque: 1919, dias_estoque: 35, ano_mes: '2025-01', classificacao_principal: 'cuidado' },
  { unidade_id: 7, produto_nome: 'REPELENTE OFF LOCAO FAMILY', fabricante: 'JOHNSON', quantidade: 6, valor_estoque: 1600, dias_estoque: 38, ano_mes: '2025-01', classificacao_principal: 'perfumaria' },
  { unidade_id: 8, produto_nome: 'BATOM KISS ME DAPOP 03', fabricante: 'DAPOP', quantidade: 16, valor_estoque: 1300, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'cosmeticos' },
  
  // Oficinais
  { unidade_id: 2, produto_nome: 'COMPOSTO VITAMINICO', fabricante: 'GENERICO', quantidade: 7, valor_estoque: 1837, dias_estoque: 41, ano_mes: '2025-01', classificacao_principal: 'oficinais' },
  { unidade_id: 3, produto_nome: 'APLICACAO DE INJETAVEIS', fabricante: 'GENERICO', quantidade: 8, valor_estoque: 1000, dias_estoque: 37, ano_mes: '2025-01', classificacao_principal: 'oficial' },
  { unidade_id: 4, produto_nome: 'BRINCO STUDEX CLASSIC', fabricante: 'STUDEX', quantidade: 5, valor_estoque: 1400, dias_estoque: 38, ano_mes: '2025-01', classificacao_principal: 'oficinais linha eletro' },
  { unidade_id: 6, produto_nome: 'PRODUTO NATURAL TESTE', fabricante: 'NATURAL', quantidade: 10, valor_estoque: 800, dias_estoque: 35, ano_mes: '2025-01', classificacao_principal: 'produtos naturais' }
];

async function insertEstoqueCategorizedData() {
    console.log('🚀 Iniciando inserção de dados de estoque_2 com classificações...');

    try {
        // Primeiro, verificar se a tabela estoque_2 existe
        console.log('🔍 Verificando estrutura da tabela estoque_2...');
        const { data: tableInfo, error: tableError } = await supabase
            .from('estoque_2')
            .select('*')
            .limit(1);

        if (tableError) {
            console.error('❌ Erro ao verificar tabela estoque_2:', tableError);
            return;
        }

        console.log('✅ Tabela estoque_2 encontrada');

        // Limpar dados existentes (opcional)
        console.log('🧹 Limpando dados existentes...');
        const { error: deleteError } = await supabase
            .from('estoque_2')
            .delete()
            .neq('id', 0); // Deletar todos os registros

        if (deleteError) {
            console.error('❌ Erro ao limpar dados:', deleteError);
        } else {
            console.log('✅ Dados existentes removidos');
        }

        // Inserir dados de estoque_2 com classificações
        console.log('📊 Inserindo dados de estoque_2 com classificações...');
        const { data: estoqueInserido, error: estoqueError } = await supabase
            .from('estoque_2')
            .insert(estoque2Data)
            .select();

        if (estoqueError) {
            console.error('❌ Erro ao inserir estoque_2:', estoqueError);
            return;
        }

        console.log(`✅ ${estoqueInserido?.length || 0} registros de estoque_2 inseridos`);

        // Verificar dados inseridos
        console.log('🔍 Verificando dados inseridos...');
        const { data: dadosVerificados, error: verificarError } = await supabase
            .from('estoque_2')
            .select('*')
            .order('valor_estoque', { ascending: false });

        if (verificarError) {
            console.error('❌ Erro ao verificar dados:', verificarError);
        } else {
            console.log(`📋 Total de registros na tabela estoque_2: ${dadosVerificados?.length || 0}`);
            console.log('📋 Primeiros 5 registros:', dadosVerificados?.slice(0, 5));
            
            // Verificar classificações
            const classificacoes = [...new Set(dadosVerificados?.map(item => item.classificacao_principal) || [])];
            console.log('📋 Classificações encontradas:', classificacoes);
        }

        console.log('🎉 Inserção de dados de estoque_2 com classificações concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a inserção de dados:', error);
    }
}

// Executar o script
insertEstoqueCategorizedData(); 