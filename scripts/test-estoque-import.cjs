const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Configuração do Supabase
const supabaseUrl = 'https://grupotempreco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydXBvdGVtcHJlY28iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDU5NzE5MCwiZXhwIjoyMDUwMTczMTkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular o parse de dados de estoque
function parseEstoqueData(data) {
  const parsedData = [];
  let currentUnitCode = '';

  console.log('📦 Iniciando parse de dados de estoque...');
  console.log('📋 Total de linhas:', data.length);

  // Encontrar a linha de cabeçalhos reais - MAIS FLEXÍVEL
  let headerRowIndex = -1;
  let headerRow = null;

  // Procurar pela linha que contém os cabeçalhos - MAIS FLEXÍVEL
  for (let i = 0; i < Math.min(50, data.length); i++) {
    const row = data[i];
    const rowValues = Object.values(row).map(v => v?.toString().toLowerCase() || '');
    const rowString = rowValues.join(' ');

    // Verificar se esta linha contém cabeçalhos de estoque - MAIS FLEXÍVEL
    const hasEstoqueHeaders = [
      'un. neg.', 'produto', 'estoque', 'curva', 'preço', 'ação',
      'media', 'classific', 'ult.', 'venda', 'compra', 'final', 'dias',
      'tipo necessidade', 'conf. comprar', 'média venda mensal', 'estoque (dias)',
      'classificação principal', 'preço venda médio', 'estoque final (dias)',
      'últ. venda (dias)', 'transf. conf.', 'comprar (dias)', 'necessidade (dias)',
      'últ. compra (dias)', 'apelido un. neg.', 'fornecedor últ. compra',
      'média venda diária', 'fabricante', 'qtd. demanda', 'est. mín',
      'origem est. mín.', 'dia estocagem', 'custo', 'custo médio', 'curva valor',
      'custo x necessidade', 'custo x estoque', 'ruptura venda', 'necessidade qtd',
      'percentual suprida qtd', 'compra confirmada', 'encomenda',
      // Adicionar mais variações de cabeçalhos
      'unidade', 'negócio', 'item', 'quantidade', 'valor', 'preco',
      'fabricante', 'fornecedor', 'classificacao', 'classificação'
    ].some(header => rowString.includes(header));

    if (hasEstoqueHeaders) {
      headerRowIndex = i;
      headerRow = row;
      console.log(`📋 Cabeçalhos encontrados na linha ${i + 1}`);
      break;
    }
  }

  // SE NÃO ENCONTROU CABEÇALHOS, USAR PRIMEIRA LINHA COMO REFERÊNCIA
  if (headerRowIndex === -1) {
    console.log('⚠️ Nenhuma linha de cabeçalho encontrada, usando primeira linha como referência');
    headerRowIndex = 0;
    headerRow = data[0];
  }

  console.log('📋 Linha de cabeçalho encontrada:', headerRow);

  // Mapear colunas baseado nos cabeçalhos encontrados - MAIS FLEXÍVEL
  const columnMapping = {};
  Object.keys(headerRow).forEach(key => {
    const headerValue = headerRow[key]?.toString().toLowerCase() || '';
    
    // Mapeamento mais flexível
    if (headerValue.includes('un.') || headerValue.includes('unidade') || headerValue.includes('negócio')) {
      columnMapping['Un. Neg.'] = key;
    } else if (headerValue.includes('produto') || headerValue.includes('item') || headerValue.includes('nome')) {
      columnMapping['Produto'] = key;
    } else if (headerValue.includes('estoque') || headerValue.includes('quantidade') || headerValue.includes('qtd')) {
      columnMapping['Estoque'] = key;
    } else if (headerValue.includes('curva') || headerValue.includes('classific')) {
      columnMapping['Curva'] = key;
    } else if (headerValue.includes('preço') || headerValue.includes('preco') || headerValue.includes('valor')) {
      columnMapping['Preço'] = key;
    } else if (headerValue.includes('fabricante') || headerValue.includes('fornecedor')) {
      columnMapping['Fabricante'] = key;
    }
  });

  // Se não encontrou a coluna Un. Neg., tentar encontrar na primeira coluna
  if (!columnMapping['Un. Neg.']) {
    const firstColumnKey = Object.keys(headerRow)[0];
    if (firstColumnKey) {
      columnMapping['Un. Neg.'] = firstColumnKey;
    }
  }

  // Se não encontrou a coluna Produto, tentar encontrar na segunda coluna
  if (!columnMapping['Produto']) {
    const secondColumnKey = Object.keys(headerRow)[1];
    if (secondColumnKey) {
      columnMapping['Produto'] = secondColumnKey;
    }
  }

  console.log('🔍 Mapeamento final de colunas:', columnMapping);

  // Processar linhas de dados - MENOS RESTRITIVO
  let linhasProcessadas = 0;
  let linhasPuladas = 0;
  let linhasComErro = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];

    // Pular linhas completamente vazias
    const rowValues = Object.values(row);
    const hasAnyData = rowValues.some(value => 
      value && value.toString().trim() !== '' && 
      value.toString().toLowerCase() !== 'null' &&
      value.toString().toLowerCase() !== 'undefined'
    );

    if (!hasAnyData) {
      linhasPuladas++;
      continue;
    }

    // Pular linhas que contêm apenas cabeçalhos do sistema - MAIS ESPECÍFICO
    const hasSystemHeader = rowValues.some(value =>
      value && (
        value.toString().includes('Unidade de Negócio:') ||
        value.toString().includes('Usuário:') ||
        value.toString().includes('Impressão:') ||
        value.toString().includes('a7 pharma') ||
        value.toString().includes('página') ||
        value.toString().includes('desenvolvimento de software') ||
        value.toString().includes('total') ||
        value.toString().includes('soma')
      )
    );

    if (hasSystemHeader) {
      linhasPuladas++;
      continue;
    }

    // Verificar se é uma linha de cabeçalho de unidade
    const unitCodeMatch = rowValues.find(value =>
      value && value.toString().includes('Cód. Un. Neg.:')
    );

    if (unitCodeMatch) {
      const match = unitCodeMatch.toString().match(/Cód\. Un\. Neg\.:\s*(\d+)/);
      if (match) {
        currentUnitCode = match[1];
      }
      continue;
    }

    // Mapear dados usando o mapeamento de colunas
    const estoqueItem = {};

    try {
      Object.entries(columnMapping).forEach(([field, columnKey]) => {
        const value = row[columnKey];

        switch (field) {
          case 'Un. Neg.':
            const unitValue = value?.toString();
            if (unitValue && unitValue.trim() !== '' && unitValue !== 'Un. Neg.' && unitValue !== 'Unidade de Negócio') {
              estoqueItem['Un. Neg.'] = unitValue.trim();
            } else if (currentUnitCode) {
              estoqueItem['Un. Neg.'] = currentUnitCode;
            }
            break;
          case 'Produto':
            estoqueItem['Produto'] = value?.toString();
            break;
          case 'Estoque':
            estoqueItem['Estoque'] = parseFloat(value) || 0;
            break;
          case 'Curva':
            estoqueItem['Curva'] = value?.toString();
            break;
          case 'Preço':
            estoqueItem['Preço'] = parseFloat(value) || 0;
            break;
          case 'Fabricante':
            estoqueItem['Fabricante'] = value?.toString();
            break;
        }
      });

      // Se não encontrou unidade na coluna específica, procurar em outras colunas
      if (!estoqueItem['Un. Neg.'] || estoqueItem['Un. Neg.'] === '') {
        for (const columnKey of Object.keys(row)) {
          const cellValue = row[columnKey];
          const cellStr = cellValue?.toString() || '';

          const unitMatch = cellStr.match(/^(\d{1,2})$/);
          if (unitMatch && !estoqueItem['Un. Neg.']) {
            estoqueItem['Un. Neg.'] = unitMatch[1];
            break;
          }
        }
      }

      // Verificar se temos dados válidos - MAIS FLEXÍVEL
      if (estoqueItem['Produto'] && estoqueItem['Produto'].toString().trim() !== '') {
        // Se não temos código de unidade, usar o atual ou um padrão
        if (!estoqueItem['Un. Neg.'] && currentUnitCode) {
          estoqueItem['Un. Neg.'] = currentUnitCode;
        } else if (!estoqueItem['Un. Neg.']) {
          estoqueItem['Un. Neg.'] = '1'; // Unidade padrão
        }

        // Garantir que estoque seja um número válido
        if (estoqueItem['Estoque'] === undefined || estoqueItem['Estoque'] === null) {
          estoqueItem['Estoque'] = 0;
        }

        parsedData.push(estoqueItem);
        linhasProcessadas++;
        
        if (linhasProcessadas <= 5) {
          console.log(`✅ Registro processado: ${estoqueItem['Produto']} - Unidade: ${estoqueItem['Un. Neg.']} - Estoque: ${estoqueItem['Estoque']}`);
        }
      } else {
        linhasPuladas++;
      }
    } catch (error) {
      linhasComErro++;
      console.log(`❌ Erro ao processar linha ${i + 1}:`, error);
    }
  }

  console.log(`📦 Resumo do processamento:`);
  console.log(`  ✅ Linhas processadas: ${linhasProcessadas}`);
  console.log(`  ⚠️ Linhas puladas: ${linhasPuladas}`);
  console.log(`  ❌ Linhas com erro: ${linhasComErro}`);
  console.log(`  📊 Total de registros de estoque processados: ${parsedData.length}`);
  
  return parsedData;
}

async function testEstoqueImport() {
  console.log('🧪 Iniciando teste de importação de estoque...\n');

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
    const { count: totalRegistros } = await supabase
      .from('estoque_2')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de registros na tabela estoque_2: ${totalRegistros}`);
    console.log('');

    // 3. Criar dados de teste
    console.log('📋 3. Criando dados de teste...');
    const dadosTeste = [
      { 'Un. Neg.': '1', 'Produto': 'PRODUTO TESTE 1', 'Estoque': 10, 'Curva': 'A', 'Preço': 100.50, 'Fabricante': 'TESTE' },
      { 'Un. Neg.': '2', 'Produto': 'PRODUTO TESTE 2', 'Estoque': 20, 'Curva': 'B', 'Preço': 200.75, 'Fabricante': 'TESTE' },
      { 'Un. Neg.': '3', 'Produto': 'PRODUTO TESTE 3', 'Estoque': 30, 'Curva': 'C', 'Preço': 300.25, 'Fabricante': 'TESTE' },
      { 'Un. Neg.': '1', 'Produto': 'PRODUTO TESTE 4', 'Estoque': 40, 'Curva': 'A', 'Preço': 400.00, 'Fabricante': 'TESTE' },
      { 'Un. Neg.': '2', 'Produto': 'PRODUTO TESTE 5', 'Estoque': 50, 'Curva': 'B', 'Preço': 500.50, 'Fabricante': 'TESTE' }
    ];

    // 4. Testar parse dos dados
    console.log('📋 4. Testando parse dos dados...');
    const dadosParseados = parseEstoqueData(dadosTeste);
    console.log('✅ Dados parseados:', dadosParseados);
    console.log('');

    // 5. Testar inserção no banco
    console.log('📋 5. Testando inserção no banco...');
    
    const estoqueToInsert = dadosParseados.map(item => ({
      unidade_id: parseInt(item['Un. Neg.']),
      produto_nome: item['Produto'],
      fabricante: item['Fabricante'] || 'N/A',
      quantidade: item['Estoque'] || 0,
      valor_estoque: item['Preço'] || 0,
      dias_estoque: 30,
      data_atualizacao: new Date().toISOString(),
      data_estocagem: new Date().toISOString(),
      ano_mes: '2025-01',
      necessidade: 'NORMAL',
      estoque_confirmado: item['Estoque'] || 0,
      comprar: 0,
      curva_qtd: item['Curva'] || 'C',
      media_venda_mensal: 0,
      estoque_final_dias: 30,
      classificacao_principal: 'MÉDIO',
      preco_venda_medio: item['Preço'] || 0,
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
      curva_valor: item['Curva'] || 'C',
      custo_x_necessidade: 0,
      custo_x_estoque: 0,
      ruptura_venda: 0,
      necessidade_qtd: 0,
      percentual_suprida_qtd: 0,
      compra_confirmada: 0,
      encomenda: 0
    }));

    const { error: insertError } = await supabase
      .from('estoque_2')
      .upsert(estoqueToInsert, {
        onConflict: 'unidade_id,produto_nome',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.log('⚠️ Erro na inserção de teste:', insertError.message);
    } else {
      console.log('✅ Inserção de teste funcionou corretamente');
      
      // Remover os registros de teste
      await supabase
        .from('estoque_2')
        .delete()
        .in('produto_nome', ['PRODUTO TESTE 1', 'PRODUTO TESTE 2', 'PRODUTO TESTE 3', 'PRODUTO TESTE 4', 'PRODUTO TESTE 5']);
    }

    console.log('');

    // 6. Recomendações
    console.log('📋 6. Recomendações para resolver o problema:');
    console.log('1. Verifique se a planilha Excel tem mais de 17 linhas de dados');
    console.log('2. Verifique se os códigos de unidade na planilha correspondem aos do banco');
    console.log('3. Verifique se há produtos duplicados na planilha');
    console.log('4. Verifique se há linhas vazias ou com dados inválidos');
    console.log('5. Verifique se o mapeamento de colunas está correto');
    console.log('6. Verifique se há problemas de encoding ou caracteres especiais');
    console.log('7. Verifique os logs do console do navegador durante a importação');
    console.log('');

    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testEstoqueImport().then(() => {
  console.log('🏁 Script de teste finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 