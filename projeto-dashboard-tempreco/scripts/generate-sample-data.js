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

// Dados de exemplo para estoque
const estoqueData = [
  { unidade_id: 2, produto_nome: 'BATOM KISS ME DAPOP 03', fabricante: 'DAPOP', quantidade: 8, valor_estoque: 3124.88, dias_estoque: 45 },
  { unidade_id: 2, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 9, valor_estoque: 2217.15, dias_estoque: 55 },
  { unidade_id: 3, produto_nome: 'ARIPIPRAZOL 15MG C/30 COM', fabricante: 'EMS', quantidade: 3, valor_estoque: 5377.52, dias_estoque: 40 },
  { unidade_id: 3, produto_nome: 'APLICACAO DE INJETAVEIS', fabricante: 'GENERICO', quantidade: 8, valor_estoque: 1497.00, dias_estoque: 46 },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA M', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1222.01, dias_estoque: 38 },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA XG', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1195.37, dias_estoque: 35 },
  { unidade_id: 6, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 8, valor_estoque: 1242.97, dias_estoque: 41 },
  { unidade_id: 6, produto_nome: 'FR BABYSEC MEGA G', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1075.71, dias_estoque: 39 },
  { unidade_id: 7, produto_nome: 'CLORIDRATO DE METFORMINA', fabricante: 'EMS', quantidade: 9, valor_estoque: 1044.69, dias_estoque: 38 },
  { unidade_id: 7, produto_nome: 'REPELENTE OFF LOCAO FAMILY', fabricante: 'JOHNSON', quantidade: 9, valor_estoque: 1025.70, dias_estoque: 37 },
  { unidade_id: 8, produto_nome: 'DIPIRONA 500MG C/10 CP PRA', fabricante: 'EMS', quantidade: 3, valor_estoque: 2927.12, dias_estoque: 38 },
  { unidade_id: 8, produto_nome: 'BRINCO STUDEX CLASSIC', fabricante: 'STUDEX', quantidade: 9, valor_estoque: 970.19, dias_estoque: 37 },
  { unidade_id: 2, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 2099.42, dias_estoque: 36 },
  { unidade_id: 3, produto_nome: 'FR BABYSEC ULTRA HIPER G', fabricante: 'JOHNSON', quantidade: 6, valor_estoque: 1381.49, dias_estoque: 37 },
  { unidade_id: 4, produto_nome: 'FR BABYSEC MEGA G', fabricante: 'JOHNSON', quantidade: 6, valor_estoque: 1332.49, dias_estoque: 37 },
  { unidade_id: 6, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 1949.95, dias_estoque: 37 },
  { unidade_id: 7, produto_nome: 'GLIFAGE XR 500MG C/30 COMP', fabricante: 'MERCK', quantidade: 4, valor_estoque: 1937.25, dias_estoque: 37 }
];

async function generateSampleData() {
  console.log('🚀 Iniciando geração de dados de exemplo...');

  try {
    // Inserir dados de estoque
    console.log('📊 Inserindo dados de estoque...');
    const { data: estoqueInserido, error: estoqueError } = await supabase
      .from('estoque')
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