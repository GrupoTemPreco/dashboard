import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyucgtpjskewrqmvhmyf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS...');
  
  try {
    // Teste 1: Verificar se conseguimos acessar as tabelas
    console.log('\n📋 Teste 1: Acesso às tabelas');
    
    const tables = ['unidades', 'estoque_2', 'faturamento', 'colaboradores'];
    
    for (const table of tables) {
      console.log(`\n🔍 Testando tabela: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro ao acessar ${table}:`, error);
      } else {
        console.log(`✅ ${table} - Dados retornados:`, data?.length || 0);
        if (data && data.length > 0) {
          console.log(`📊 Primeiro registro de ${table}:`, Object.keys(data[0]));
        }
      }
    }
    
    // Teste 2: Verificar contagem de registros
    console.log('\n📊 Teste 2: Contagem de registros');
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erro na contagem de ${table}:`, error);
      } else {
        console.log(`📈 ${table} - Total de registros:`, count);
      }
    }
    
    // Teste 3: Verificar se há dados específicos
    console.log('\n🔍 Teste 3: Verificação de dados específicos');
    
    // Teste estoque_2 com dados específicos
    const { data: estoqueData, error: estoqueError } = await supabase
      .from('estoque_2')
      .select('id, produto_nome, unidade_id, quantidade')
      .limit(3);
    
    if (estoqueError) {
      console.error('❌ Erro ao buscar dados específicos do estoque:', estoqueError);
    } else {
      console.log('📦 Dados específicos do estoque:', estoqueData?.length || 0);
      if (estoqueData && estoqueData.length > 0) {
        console.log('📋 Primeiros registros:', estoqueData);
      }
    }
    
    console.log('\n✅ Verificação de políticas RLS concluída');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRLSPolicies(); 