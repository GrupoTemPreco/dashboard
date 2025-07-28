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

// Dados de exemplo para estoque com valores corrigidos (sem casas decimais)
const estoqueData = [
  { unidade_id: 2, produto_nome: 'BATOM KISS ME DAPOP 03', fabricante: 'DAPOP', quantidade: 8, valor_estoque: 2407, dias_estoque: 45, categoria: 'perfumaria' },
  { unidade_id: 2, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 9, valor_estoque: 2319, dias_estoque: 55, categoria: 'etico' },
  { unidade_id: 3, produto_nome: 'ARIPIPRAZOL 15MG C/30 COM', fabricante: 'EMS', quantidade: 3, valor_estoque: 2199, dias_estoque: 40, categoria: 'etico' },
  { unidade_id: 3, produto_nome: 'APLICACAO DE INJETAVEIS', fabricante: 'GENERICO', quantidade: 8, valor_estoque: 2073, dias_estoque: 46, categoria: 'oficinais' },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA M', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 2004, dias_estoque: 38, categoria: 'bonificado' },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA XG', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1919, dias_estoque: 35, categoria: 'bonificado' },
  { unidade_id: 6, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 8, valor_estoque: 1837, dias_estoque: 41, categoria: 'bonificado' },
  { unidade_id: 6, produto_nome: 'FR BABYSEC MEGA G', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1700, dias_estoque: 39, categoria: 'bonificado' },
  { unidade_id: 7, produto_nome: 'CLORIDRATO DE METFORMINA', fabricante: 'EMS', quantidade: 9, valor_estoque: 1600, dias_estoque: 38, categoria: 'etico' },
  { unidade_id: 7, produto_nome: 'REPELENTE OFF LOCAO FAMILY', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1500, dias_estoque: 37, categoria: 'perfumaria' },
  { unidade_id: 8, produto_nome: 'DIPIRONA 500MG C/10 CP PRA', fabricante: 'EMS', quantidade: 3, valor_estoque: 1400, dias_estoque: 38, categoria: 'etico' },
  { unidade_id: 8, produto_nome: 'BRINCO STUDEX CLASSIC', fabricante: 'STUDEX', quantidade: 9, valor_estoque: 1300, dias_estoque: 37, categoria: 'perfumaria' },
  { unidade_id: 2, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 1200, dias_estoque: 36, categoria: 'etico' },
  { unidade_id: 3, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 6, valor_estoque: 1100, dias_estoque: 37, categoria: 'bonificado' },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA G', fabricante: 'JOHNSON', quantidade: 6, valor_estoque: 1000, dias_estoque: 37, categoria: 'bonificado' },
  { unidade_id: 6, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 900, dias_estoque: 37, categoria: 'etico' },
  { unidade_id: 7, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 800, dias_estoque: 37, categoria: 'etico' }
];

async function generateSampleData() {
  console.log('🚀 Iniciando geração de dados de exemplo...');

  try {
    // Inserir dados de estoque
    console.log('📊 Inserindo dados de estoque...');
    const { data: estoqueInserido, error: estoqueError } = await supabase
      .from('estoque_2')
      .insert(estoqueData)
      .select();

    if (estoqueError) {
      console.error('❌ Erro ao inserir estoque:', estoqueError);
      return;
    }

    console.log(`✅ ${estoqueInserido.length} registros de estoque inseridos`);

    console.log('🎉 Dados de exemplo gerados com sucesso!');

    // Mostrar alguns dados inseridos
    console.log('\n📋 Exemplo de dados inseridos:');
    console.log('Estoque:', estoqueInserido.slice(0, 3));

  } catch (error) {
    console.error('❌ Erro durante a geração de dados:', error);
  }
}

// Executar o script
generateSampleData(); 