const XLSX = require('xlsx');

// Simular dados de estoque baseados nos logs
const mockEstoqueData = [
  {
    'Un. Neg.': '12',
    'Produto': 'nevralgex c/10 cp cimed',
    'Estoque': 277,
    'Curva': 'a',
    'Preço': 77.001,
    'Fabricante': 'cimed'
  },
  {
    'Un. Neg.': '12',
    'Produto': 'dipirona 500mg c/10 cp vitamedic',
    'Estoque': 276,
    'Curva': 'a',
    'Preço': 62.001,
    'Fabricante': 'vitamedic'
  },
  {
    'Un. Neg.': '12',
    'Produto': 'sildenafila 50mg c/04 cp (neo quimica)',
    'Estoque': 261,
    'Curva': 'a',
    'Preço': 16.5,
    'Fabricante': 'neo quimica'
  },
  {
    'Un. Neg.': '03',
    'Produto': 'soro fisiologico 500ml sorimax',
    'Estoque': 201,
    'Curva': 'a',
    'Preço': 438.999,
    'Fabricante': 'sorimax'
  },
  {
    'Un. Neg.': '12',
    'Produto': 'lixa de unha fina parda diversas',
    'Estoque': 179,
    'Curva': 'a',
    'Preço': 30.501,
    'Fabricante': 'diversas'
  }
];

// Função para simular a detecção de tipo de planilha
function detectSheetType(data) {
  const allValues = data.flatMap(row => Object.values(row));
  const allValuesString = allValues.join(' ').toLowerCase();

  console.log('🔍 DEBUG - Conteúdo da planilha:', allValuesString.substring(0, 500) + '...');

  // Verificar se é planilha de estoque baseado no conteúdo (PRIORIDADE ALTA)
  const estoqueIndicators = [
    'produto', 'estoque', 'curva', 'preço', 'ação',
    'media venda', 'estoque classific', 'dias', 'ult. venda', 'ult. compra',
    'estoque final', 'dia estocad', 'sugrida', 'necessidade', 'estoque conf.',
    'comprar', 'curva qtd', 'média venda mensal', 'estoque (dias)', 'classificação principal',
    'preço venda médio', 'estoque final (dias)', 'últ. venda (dias)', 'transf. conf.',
    'comprar (dias)', 'necessidade (dias)', 'últ. compra (dias)', 'apelido un. neg.',
    'fornecedor últ. compra', 'média venda diária', 'fabricante', 'qtd. demanda',
    'est. mín', 'origem est. mín.', 'dia estocagem', 'custo médio',
    'curva valor', 'custo x necessidade', 'custo x estoque', 'ruptura venda',
    'necessidade qtd', 'percentual suprida qtd', 'compra confirmada', 'encomenda',
    'falta:', 'ruptura', 'encomenda', 'tipo necessidade', 'conf. comprar',
    'média venda mensal', 'estoque (dias)', 'classificação principal', 'preço venda médio',
    'estoque final (dias)', 'últ. venda (dias)', 'transf. conf.', 'comprar (dias)',
    'necessidade (dias)', 'últ. compra (dias)', 'apelido un. neg.', 'fornecedor últ. compra',
    'média venda diária', 'fabricante', 'qtd. demanda', 'est. mín', 'origem est. mín.',
    'dia estocagem', 'custo', 'custo médio', 'curva valor', 'custo x necessidade',
    'custo x estoque', 'ruptura venda', 'necessidade qtd', 'percentual suprida qtd',
    'compra confirmada', 'encomenda', 'nevralgex', 'dipirona', 'sildenafila', 'soro fisiologico',
    'lixa de unha', 'excesso', 'falta', 'demanda', 'drogaria', 'ultra xbrothers'
  ];

  const hasEstoqueContent = estoqueIndicators.some(indicator =>
    allValuesString.includes(indicator)
  );

  // Verificar se é planilha de colaboradores baseado no conteúdo (PRIORIDADE MÉDIA)
  const colaboradoresIndicators = [
    'usuário:', 'colaborador', 'user:', 'análise de venda por item', 'período',
    'total usuário', 'análise de venda por item', 'análise de venda',
    'abraao lincoln', 'batist', 'usuário: abraao'
  ];

  const hasColaboradoresContent = colaboradoresIndicators.some(indicator =>
    allValuesString.includes(indicator)
  );

  // PRIORIZAR ESTOQUE se houver indicadores específicos de estoque
  if (hasEstoqueContent) {
    console.log('📦 Planilha detectada como ESTOQUE');
    console.log('🔍 Indicadores encontrados:', estoqueIndicators.filter(indicator => allValuesString.includes(indicator)));
    return 'estoque';
  }
  // Se não tem indicadores específicos de estoque, verificar colaboradores
  else if (hasColaboradoresContent) {
    console.log('👥 Planilha detectada como COLABORADORES');
    console.log('🔍 Indicadores encontrados:', colaboradoresIndicators.filter(indicator => allValuesString.includes(indicator)));
    return 'colaboradores';
  }

  return 'unknown';
}

// Testar a detecção
console.log('🧪 Testando detecção de tipo de planilha...');
const detectedType = detectSheetType(mockEstoqueData);
console.log(`✅ Tipo detectado: ${detectedType}`);

// Simular dados com "usuário:" para testar a priorização
const mockDataWithUser = [
  {
    'Un. Neg.': '12',
    'Produto': 'nevralgex c/10 cp cimed',
    'Estoque': 277,
    'Curva': 'a',
    'Preço': 77.001,
    'Fabricante': 'cimed',
    'Usuário:': '2424 - nayara faria'
  }
];

console.log('\n🧪 Testando detecção com dados que contêm "usuário:"...');
const detectedTypeWithUser = detectSheetType(mockDataWithUser);
console.log(`✅ Tipo detectado: ${detectedTypeWithUser}`);

console.log('\n✅ Teste concluído!'); 