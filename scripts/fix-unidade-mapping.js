// Script para corrigir mapeamento de unidades
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUnidadeMapping() {
  console.log('🔧 Corrigindo mapeamento de unidades...');

  try {
    // 1. Verificar unidades existentes
    console.log('\n📋 Verificando unidades no banco...');
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo, nome');

    if (unidadesError) {
      console.error('❌ Erro ao buscar unidades:', unidadesError);
      return;
    }

    console.log('✅ Unidades encontradas:', unidades?.length);
    const unidadesMap = new Map();
    
    unidades?.forEach(u => {
      unidadesMap.set(u.codigo, u.id);
      // Adicionar versões com e sem zero à esquerda
      if (u.codigo.length === 1) {
        unidadesMap.set(`0${u.codigo}`, u.id); // "2" -> "02"
      } else if (u.codigo.length === 2 && u.codigo.startsWith('0')) {
        unidadesMap.set(u.codigo.substring(1), u.id); // "02" -> "2"
      }
      console.log(`  - ID: ${u.id}, Código: ${u.codigo}, Nome: ${u.nome}`);
    });

    console.log('📊 Mapeamento expandido:', Array.from(unidadesMap.entries()));

    // 2. Verificar dados de estoque com problemas de mapeamento
    console.log('\n📦 Verificando dados de estoque...');
    const { data: estoque, error: estoqueError } = await supabase
      .from('estoque_2')
      .select('id, unidade_id, produto_nome, quantidade');

    if (estoqueError) {
      console.error('❌ Erro ao buscar estoque:', estoqueError);
      return;
    }

    console.log('✅ Registros de estoque encontrados:', estoque?.length);

    // 3. Verificar se há registros com unidade_id inválido
    const unidadesValidas = new Set(unidades?.map(u => u.id) || []);
    const registrosComProblema = estoque?.filter(item => !unidadesValidas.has(item.unidade_id)) || [];

    console.log(`⚠️ Registros com unidade_id inválido: ${registrosComProblema.length}`);

    if (registrosComProblema.length > 0) {
      console.log('📋 Registros com problema:');
      registrosComProblema.slice(0, 10).forEach(item => {
        console.log(`  - ID: ${item.id}, Produto: ${item.produto_nome}, Unidade ID: ${item.unidade_id}`);
      });
    }

    // 4. Verificar dados de colaboradores
    console.log('\n👥 Verificando dados de colaboradores...');
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('id, unidade_negocio, user_name, valor_venda');

    if (colaboradoresError) {
      console.error('❌ Erro ao buscar colaboradores:', colaboradoresError);
      return;
    }

    console.log('✅ Registros de colaboradores encontrados:', colaboradores?.length);

    // Verificar colaboradores com unidade_negocio inválido
    const colaboradoresComProblema = colaboradores?.filter(item => !unidadesValidas.has(item.unidade_negocio)) || [];

    console.log(`⚠️ Colaboradores com unidade_negocio inválido: ${colaboradoresComProblema.length}`);

    if (colaboradoresComProblema.length > 0) {
      console.log('📋 Colaboradores com problema:');
      colaboradoresComProblema.slice(0, 10).forEach(item => {
        console.log(`  - ID: ${item.id}, Usuário: ${item.user_name}, Unidade: ${item.unidade_negocio}`);
      });
    }

    // 5. Verificar dados de faturamento
    console.log('\n💰 Verificando dados de faturamento...');
    const { data: faturamento, error: faturamentoError } = await supabase
      .from('faturamento')
      .select('id, unidade_negocio, ano_mes, valor_venda');

    if (faturamentoError) {
      console.error('❌ Erro ao buscar faturamento:', faturamentoError);
      return;
    }

    console.log('✅ Registros de faturamento encontrados:', faturamento?.length);

    // Verificar faturamento com unidade_negocio inválido
    const faturamentoComProblema = faturamento?.filter(item => !unidadesValidas.has(item.unidade_negocio)) || [];

    console.log(`⚠️ Faturamento com unidade_negocio inválido: ${faturamentoComProblema.length}`);

    if (faturamentoComProblema.length > 0) {
      console.log('📋 Faturamento com problema:');
      faturamentoComProblema.slice(0, 10).forEach(item => {
        console.log(`  - ID: ${item.id}, Período: ${item.ano_mes}, Unidade: ${item.unidade_negocio}, Venda: ${item.valor_venda}`);
      });
    }

    // 6. Resumo final
    console.log('\n📊 Resumo dos problemas encontrados:');
    console.log(`  - Estoque com unidade inválida: ${registrosComProblema.length}`);
    console.log(`  - Colaboradores com unidade inválida: ${colaboradoresComProblema.length}`);
    console.log(`  - Faturamento com unidade inválida: ${faturamentoComProblema.length}`);

    const totalProblemas = registrosComProblema.length + colaboradoresComProblema.length + faturamentoComProblema.length;
    
    if (totalProblemas === 0) {
      console.log('✅ Nenhum problema de mapeamento encontrado!');
    } else {
      console.log(`⚠️ Total de registros com problemas: ${totalProblemas}`);
      console.log('💡 Recomendação: Verificar se os códigos de unidade na planilha correspondem aos códigos cadastrados no banco.');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar a verificação
fixUnidadeMapping(); 