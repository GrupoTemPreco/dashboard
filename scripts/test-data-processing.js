// Script para testar processamento de dados
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataProcessing() {
  console.log('🔍 Testando processamento de dados...');

  try {
    // 1. Verificar unidades disponíveis
    console.log('\n📋 Verificando unidades...');
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo, nome');

    if (unidadesError) {
      console.error('❌ Erro ao buscar unidades:', unidadesError);
      return;
    }

    console.log('✅ Unidades encontradas:', unidades?.length);
    unidades?.forEach(u => {
      console.log(`  - ID: ${u.id}, Código: ${u.codigo}, Nome: ${u.nome}`);
    });

    // 2. Verificar dados de estoque
    console.log('\n📦 Verificando dados de estoque...');
    const { data: estoque, error: estoqueError } = await supabase
      .from('estoque_2')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);

    if (estoqueError) {
      console.error('❌ Erro ao buscar estoque:', estoqueError);
      return;
    }

    console.log('✅ Registros de estoque encontrados:', estoque?.length);
    console.log('📊 Últimos 5 registros:');
    estoque?.slice(0, 5).forEach(item => {
      console.log(`  - ID: ${item.id}, Produto: ${item.produto_nome}, Unidade: ${item.unidade_id}, Qtd: ${item.quantidade}`);
    });

    // 3. Verificar dados de colaboradores
    console.log('\n👥 Verificando dados de colaboradores...');
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);

    if (colaboradoresError) {
      console.error('❌ Erro ao buscar colaboradores:', colaboradoresError);
      return;
    }

    console.log('✅ Registros de colaboradores encontrados:', colaboradores?.length);
    console.log('📊 Últimos 5 registros:');
    colaboradores?.slice(0, 5).forEach(item => {
      console.log(`  - ID: ${item.id}, Usuário: ${item.user_name}, Unidade: ${item.unidade_negocio}, Venda: ${item.valor_venda}`);
    });

    // 4. Verificar dados de faturamento
    console.log('\n💰 Verificando dados de faturamento...');
    const { data: faturamento, error: faturamentoError } = await supabase
      .from('faturamento')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);

    if (faturamentoError) {
      console.error('❌ Erro ao buscar faturamento:', faturamentoError);
      return;
    }

    console.log('✅ Registros de faturamento encontrados:', faturamento?.length);
    console.log('📊 Últimos 5 registros:');
    faturamento?.slice(0, 5).forEach(item => {
      console.log(`  - ID: ${item.id}, Unidade: ${item.unidade_negocio}, Período: ${item.ano_mes}, Venda: ${item.valor_venda}`);
    });

    // 5. Contagem total de registros
    console.log('\n📊 Resumo geral:');
    console.log(`  - Unidades: ${unidades?.length || 0}`);
    console.log(`  - Estoque: ${estoque?.length || 0} (últimos 10)`);
    console.log(`  - Colaboradores: ${colaboradores?.length || 0} (últimos 10)`);
    console.log(`  - Faturamento: ${faturamento?.length || 0} (últimos 10)`);

    // 6. Verificar se há dados duplicados
    console.log('\n🔍 Verificando duplicatas...');
    
    // Verificar duplicatas em estoque
    const { data: estoqueDuplicatas, error: estoqueDupError } = await supabase
      .from('estoque_2')
      .select('unidade_id, produto_nome, COUNT(*)')
      .group('unidade_id, produto_nome')
      .having('COUNT(*) > 1');

    if (!estoqueDupError && estoqueDuplicatas?.length > 0) {
      console.log('⚠️ Duplicatas encontradas em estoque:', estoqueDuplicatas.length);
    } else {
      console.log('✅ Nenhuma duplicata encontrada em estoque');
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testDataProcessing(); 