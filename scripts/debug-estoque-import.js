const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://grupotempreco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydXBvdGVtcHJlY28iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDU5NzE5MCwiZXhwIjoyMDUwMTczMTkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEstoqueImport() {
  console.log('🔍 Iniciando diagnóstico de importação de estoque...\n');

  try {
    // 1. Verificar unidades disponíveis
    console.log('📋 1. Verificando unidades disponíveis no banco...');
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo, nome');

    if (unidadesError) {
      console.error('❌ Erro ao buscar unidades:', unidadesError);
      return;
    }

    console.log('✅ Unidades encontradas:', unidades);
    console.log('');

    // 2. Verificar dados atuais na tabela estoque_2
    console.log('📋 2. Verificando dados atuais na tabela estoque_2...');
    const { data: estoqueAtual, error: estoqueError } = await supabase
      .from('estoque_2')
      .select('*')
      .limit(10);

    if (estoqueError) {
      console.error('❌ Erro ao buscar estoque:', estoqueError);
      return;
    }

    console.log(`✅ Registros atuais na tabela estoque_2: ${estoqueAtual.length}`);
    console.log('📊 Primeiros 5 registros:', estoqueAtual.slice(0, 5));
    console.log('');

    // 3. Contar total de registros
    const { count: totalRegistros } = await supabase
      .from('estoque_2')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de registros na tabela estoque_2: ${totalRegistros}`);
    console.log('');

    // 4. Verificar por unidade
    console.log('📋 3. Verificando registros por unidade...');
    const { data: registrosPorUnidade } = await supabase
      .from('estoque_2')
      .select('unidade_id, count')
      .group('unidade_id');

    console.log('📊 Registros por unidade:', registrosPorUnidade);
    console.log('');

    // 5. Verificar produtos únicos
    console.log('📋 4. Verificando produtos únicos...');
    const { data: produtosUnicos } = await supabase
      .from('estoque_2')
      .select('produto_nome')
      .limit(10);

    console.log('📊 Primeiros 10 produtos únicos:', produtosUnicos?.map(p => p.produto_nome));
    console.log('');

    // 6. Verificar se há problemas de constraint
    console.log('📋 5. Verificando possíveis problemas de constraint...');
    
    // Tentar inserir um registro de teste
    const testeInsert = {
      unidade_id: unidades[0]?.id || 1,
      produto_nome: 'PRODUTO TESTE DEBUG',
      fabricante: 'TESTE',
      quantidade: 1,
      valor_estoque: 10.00,
      dias_estoque: 30,
      data_atualizacao: new Date().toISOString(),
      data_estocagem: new Date().toISOString(),
      ano_mes: '2025-01',
      necessidade: 'NORMAL',
      estoque_confirmado: 1,
      comprar: 0,
      curva_qtd: 'C',
      media_venda_mensal: 0,
      estoque_final_dias: 30,
      classificacao_principal: 'MÉDIO',
      preco_venda_medio: 10.00,
      ultima_venda_dias: 0,
      transferencia_confirmada: 0,
      comprar_dias: 0,
      necessidade_dias: 0,
      ultima_compra_dias: 0,
      apelido_unidade: '',
      fornecedor_ultima_compra: '',
      media_venda_diaria: 0,
      qtd_demanda: 0,
      estoque_minimo: 0,
      origem_estoque_minimo: 'SISTEMA',
      custo: 0,
      custo_medio: 0,
      curva_valor: 'C',
      custo_x_necessidade: 0,
      custo_x_estoque: 0,
      ruptura_venda: 0,
      necessidade_qtd: 0,
      percentual_suprida_qtd: 0,
      compra_confirmada: 0,
      encomenda: 0
    };

    const { error: insertError } = await supabase
      .from('estoque_2')
      .insert(testeInsert);

    if (insertError) {
      console.log('⚠️ Problema detectado na inserção:', insertError.message);
    } else {
      console.log('✅ Inserção de teste funcionou corretamente');
      
      // Remover o registro de teste
      await supabase
        .from('estoque_2')
        .delete()
        .eq('produto_nome', 'PRODUTO TESTE DEBUG');
    }

    console.log('');

    // 7. Verificar estrutura da tabela
    console.log('📋 6. Verificando estrutura da tabela...');
    const { data: estrutura } = await supabase
      .rpc('get_table_info', { table_name: 'estoque_2' })
      .catch(() => null);

    if (estrutura) {
      console.log('📊 Estrutura da tabela:', estrutura);
    } else {
      console.log('ℹ️ Não foi possível verificar a estrutura da tabela via RPC');
    }

    console.log('');

    // 8. Verificar logs de erro recentes
    console.log('📋 7. Verificando possíveis erros recentes...');
    console.log('ℹ️ Verifique os logs do console do navegador durante a importação');
    console.log('ℹ️ Verifique se há erros de constraint ou validação');
    console.log('');

    // 9. Recomendações
    console.log('📋 8. Recomendações para resolver o problema:');
    console.log('1. Verifique se a planilha Excel tem mais de 17 linhas de dados');
    console.log('2. Verifique se os códigos de unidade na planilha correspondem aos do banco');
    console.log('3. Verifique se há produtos duplicados na planilha');
    console.log('4. Verifique se há linhas vazias ou com dados inválidos');
    console.log('5. Verifique se o mapeamento de colunas está correto');
    console.log('6. Verifique se há problemas de encoding ou caracteres especiais');
    console.log('');

    console.log('✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
debugEstoqueImport().then(() => {
  console.log('🏁 Script de diagnóstico finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 