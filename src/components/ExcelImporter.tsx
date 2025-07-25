import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSupabase } from '../hooks/useSupabase';

interface ExcelData {
  'Ano-mês'?: string;
  'Itens'?: number;
  'Venda'?: number;
  '% Tot.'?: number;
  'Desconto'?: number;
  '% Desconto'?: number;
  'Custo'?: number;
  '% Custo'?: number;
  'Lucro'?: number;
  '% Lucro'?: number;
  'Cód. Un. Neg.'?: string;
}

interface ColaboradorData {
  'user_id'?: string;
  'user_name'?: string;
  'ano_mes'?: string;
  'unidade_negocio'?: string;
  'itens'?: number;
  'venda'?: number;
  'percentual_total'?: number;
  'desconto'?: number;
  'percentual_desconto'?: number;
  'custo'?: number;
  'percentual_custo'?: number;
  'lucro'?: number;
  'percentual_lucro'?: number;
}

interface EstoqueData {
  'Un. Neg.'?: string;
  'Produto'?: string;
  'Estoque'?: number;
  'Curva'?: string;
  'Media'?: number;
  'Estoque Classific'?: number;
  'Preço'?: number;
  'Estoque Final'?: number;
  'Ult. Venda'?: string;
  'Ult. Compra'?: string;
  'Media Venda'?: number;
  'Dia Estocad'?: number;
  '% Sunrida'?: number;
  // Novos campos para estoque_2
  'Necessidade'?: string;
  'Estoque Confirmado'?: number;
  'Comprar'?: number;
  'Curva Qtd'?: string;
  'Media Venda Mensal'?: number;
  'Estoque Final Dias'?: number;
  'Classificacao Principal'?: string;
  'Preco Venda Medio'?: number;
  'Ultima Venda Dias'?: number;
  'Transferencia Confirmada'?: number;
  'Comprar Dias'?: number;
  'Necessidade Dias'?: number;
  'Ultima Compra Dias'?: number;
  'Apelido Unidade'?: string;
  'Fornecedor Ultima Compra'?: string;
  'Media Venda Diaria'?: number;
  'Qtd Demanda'?: number;
  'Estoque Minimo'?: number;
  'Origem Estoque Minimo'?: string;
  'Custo'?: number;
  'Custo Medio'?: number;
  'Curva Valor'?: string;
  'Custo x Necessidade'?: number;
  'Custo x Estoque'?: number;
  'Ruptura Venda'?: number;
  'Necessidade Qtd'?: number;
  'Percentual Suprida Qtd'?: number;
  'Compra Confirmada'?: number;
  'Encomenda'?: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: any[];
}

interface ExcelImporterProps {
  onImportComplete?: () => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { supabase } = useSupabase();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar se é um arquivo Excel válido (.xlsx, .xls)
      const fileName = selectedFile.name.toLowerCase();
      const isValidExcelFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ||
        selectedFile.type.includes('spreadsheet') ||
        selectedFile.type.includes('excel');

      if (isValidExcelFile) {
        setFile(selectedFile);
        setResult(null);
      } else {
        setResult({
          success: false,
          message: 'Por favor, selecione um arquivo Excel válido (.xlsx ou .xls).'
        });
      }
    }
  };

  // Função para detectar o tipo de planilha baseado nas colunas
  const detectSheetType = (data: any[]): 'faturamento' | 'estoque' | 'colaboradores' | 'unknown' => {
    if (data.length === 0) return 'unknown';

    // Analisar o conteúdo das células, não apenas os nomes das colunas
    const allValues = data.flatMap(row => Object.values(row));
    const allValuesString = allValues.join(' ').toLowerCase();

    console.log('🔍 DEBUG - Conteúdo da planilha:', allValuesString.substring(0, 500) + '...');
    console.log('🔍 DEBUG - Primeiras 5 linhas:', data.slice(0, 5));

    // Verificar se é planilha de estoque baseado no conteúdo
    const estoqueIndicators = [
      'un. neg.', 'produto', 'estoque', 'curva', 'preço', 'ação',
      'media venda', 'estoque classific', 'dias', 'ult. venda', 'ult. compra',
      'estoque final', 'dia estocad', 'sugrida', 'necessidade', 'estoque conf.',
      'comprar', 'curva qtd', 'média venda mensal', 'estoque (dias)', 'classificação principal',
      'preço venda médio', 'estoque final (dias)', 'últ. venda (dias)', 'transf. conf.',
      'comprar (dias)', 'necessidade (dias)', 'últ. compra (dias)', 'apelido un. neg.',
      'fornecedor últ. compra', 'média venda diária', 'fabricante', 'qtd. demanda',
      'est. mín', 'origem est. mín.', 'dia estocagem', 'custo', 'custo médio',
      'curva valor', 'custo x necessidade', 'custo x estoque', 'ruptura venda',
      'necessidade qtd', 'percentual suprida qtd', 'compra confirmada', 'encomenda'
    ];

    const hasEstoqueContent = estoqueIndicators.some(indicator =>
      allValuesString.includes(indicator)
    );

    // Verificar se é planilha de faturamento baseado no conteúdo
    const faturamentoIndicators = [
      'ano-mês', 'itens', 'venda', 'cód. un. neg.', 'desconto', 'custo', 'lucro',
      'percentual', 'tot.', 'valor'
    ];

    const hasFaturamentoContent = faturamentoIndicators.some(indicator =>
      allValuesString.includes(indicator)
    );

    // Verificar se é planilha de colaboradores baseado no conteúdo
    const colaboradoresIndicators = [
      'usuário:', 'colaborador', 'análise de venda por item', 'período',
      'total usuário', 'cód. un. neg.', 'itens', 'venda', 'desconto', 'custo', 'lucro',
      'análise de venda por item', 'análise de venda'
    ];

    const hasColaboradoresContent = colaboradoresIndicators.some(indicator =>
      allValuesString.includes(indicator)
    );

    // Priorizar estoque se houver indicadores claros de estoque
    if (hasEstoqueContent) {
      console.log('📦 Planilha detectada como ESTOQUE');
      console.log('🔍 Indicadores encontrados:', estoqueIndicators.filter(indicator => allValuesString.includes(indicator)));
      return 'estoque';
    } else if (hasColaboradoresContent) {
      console.log('👥 Planilha detectada como COLABORADORES');
      console.log('🔍 Indicadores encontrados:', colaboradoresIndicators.filter(indicator => allValuesString.includes(indicator)));
      return 'colaboradores';
    } else if (hasFaturamentoContent) {
      return 'faturamento';
    }

    // Se não detectou nenhum tipo específico, verificar se é colaboradores por padrão
    // baseado no nome da aba ou conteúdo específico
    if (allValuesString.includes('análise') || allValuesString.includes('venda') || allValuesString.includes('item')) {
      console.log('👥 Planilha detectada como COLABORADORES (fallback)');
      console.log('🔍 Conteúdo da planilha contém indicadores de colaboradores');
      return 'colaboradores';
    }

    return 'unknown';
  };

  // Função para parsear dados de colaboradores
  const parseColaboradoresData = (data: any[], sheetName?: string): ColaboradorData[] => {
    const parsedData: ColaboradorData[] = [];
    let currentUser = '';
    let currentUserId = '';
    let currentAnoMes = '';
    let currentUnidade = '';

    console.log('👥 Iniciando parse de dados de colaboradores...');
    console.log('📋 Total de linhas:', data.length);
    console.log('📋 Nome da aba:', sheetName);

    // Tentar extrair informações do nome da aba ou das primeiras linhas
    if (sheetName) {
      // Procurar por padrão de usuário no nome da aba
      const userMatch = sheetName.match(/(\d+)\s*-\s*([a-zA-ZÀ-ÿ\s]+)/i);
      if (userMatch) {
        currentUserId = userMatch[1].trim();
        currentUser = userMatch[2].trim();
        console.log(`👤 Usuário extraído do nome da aba: ${currentUser} (ID: ${currentUserId})`);
      }
    }

    // Definir período padrão se não encontrado
    if (!currentAnoMes) {
      currentAnoMes = '2025-07'; // Período padrão baseado na data de impressão
      console.log(`📅 Usando período padrão: ${currentAnoMes}`);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowValues = Object.values(row).map(v => v?.toString() || '');
      const rowString = rowValues.join(' ').toLowerCase();

      // Pular linhas de cabeçalho de impressão
      if (rowString.includes('unidade de negócio:') ||
        rowString.includes('impressão:') ||
        rowString.includes('usuário:') ||
        rowString.includes('colaborador:')) {
        console.log(`📋 Pulando linha ${i + 1} - cabeçalho de impressão:`, rowString.substring(0, 100));
        continue;
      }

      // Detectar se é uma linha de ano-mês
      if (rowString.includes('ano-mês:') || rowString.includes('período:')) {
        const anoMesMatch = rowString.match(/ano-mês:\s*(\d{4}-\d{2})/i);
        if (anoMesMatch) {
          currentAnoMes = anoMesMatch[1];
          console.log(`📅 Encontrado período: ${currentAnoMes}`);
          continue;
        }
      }

      // Detectar padrão de data (dd/mm/yyyy)
      const dateMatch = rowString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch && !currentAnoMes) {
        // const day = dateMatch[1];
        const month = dateMatch[2];
        const year = dateMatch[3];
        currentAnoMes = `${year}-${month}`;
        console.log(`📅 Encontrado período (da data): ${currentAnoMes}`);
        continue;
      }

      // Detectar se é uma linha de cabeçalho de tabela
      if (rowString.includes('cód. un. neg.') && rowString.includes('itens') && rowString.includes('venda')) {
        console.log(`📋 Pulando linha ${i + 1} - cabeçalho de tabela`);
        continue; // Pular linha de cabeçalho
      }

      // Detectar se é uma linha de dados válida (tem código de unidade)
      // Procurar por códigos de unidade (1-2 dígitos) em qualquer coluna
      const unidadeMatch = rowValues.find(value =>
        value && /^\d{1,2}$/.test(value.toString().trim())
      );

      if (unidadeMatch && currentUser && currentAnoMes) {
        currentUnidade = unidadeMatch.toString().trim();
        console.log(`🏢 Processando unidade ${currentUnidade} para ${currentUser} em ${currentAnoMes}`);
        console.log(`🔍 Row values:`, rowValues);

        // Procurar pelos valores nas colunas seguintes
        const rowKeys = Object.keys(row);
        const dataIndex = rowKeys.findIndex(key => row[key] === unidadeMatch);

        console.log(`🔍 Row keys:`, rowKeys);
        console.log(`🔍 Data index:`, dataIndex);

        if (dataIndex !== -1 && rowKeys.length >= dataIndex + 9) {
          const colaboradorItem: ColaboradorData = {
            user_id: currentUserId,
            user_name: currentUser,
            ano_mes: currentAnoMes,
            unidade_negocio: currentUnidade,
            itens: parseNumber(row[rowKeys[dataIndex + 1]]),
            venda: parseNumber(row[rowKeys[dataIndex + 2]]),
            percentual_total: parseNumber(row[rowKeys[dataIndex + 3]]),
            desconto: parseNumber(row[rowKeys[dataIndex + 4]]),
            percentual_desconto: parseNumber(row[rowKeys[dataIndex + 5]]),
            custo: parseNumber(row[rowKeys[dataIndex + 6]]),
            percentual_custo: parseNumber(row[rowKeys[dataIndex + 7]]),
            lucro: parseNumber(row[rowKeys[dataIndex + 8]]),
            percentual_lucro: parseNumber(row[rowKeys[dataIndex + 9]])
          };

          console.log(`✅ Dados processados para ${currentUser} - Unidade ${currentUnidade}:`, {
            itens: colaboradorItem.itens,
            venda: colaboradorItem.venda,
            lucro: colaboradorItem.lucro
          });

          parsedData.push(colaboradorItem);
        } else {
          console.log(`⚠️ Linha ${i + 1} - dados insuficientes para ${currentUser} - Unidade ${currentUnidade}`);
          console.log(`🔍 Row keys:`, rowKeys);
          console.log(`🔍 Data index:`, dataIndex);
        }
      }

      // Detectar se é uma linha de "Total Usuário"
      if (rowString.includes('total usuário') || rowString.includes('total')) {
        console.log(`📊 Processando TOTAL para ${currentUser} em ${currentAnoMes}`);
        // Processar linha de total do usuário
        const rowKeys = Object.keys(row);
        if (rowKeys.length >= 9) {
          const totalItem: ColaboradorData = {
            user_id: currentUserId,
            user_name: currentUser,
            ano_mes: currentAnoMes,
            unidade_negocio: 'TOTAL',
            itens: parseNumber(row[rowKeys[1]]),
            venda: parseNumber(row[rowKeys[2]]),
            percentual_total: parseNumber(row[rowKeys[3]]),
            desconto: parseNumber(row[rowKeys[4]]),
            percentual_desconto: parseNumber(row[rowKeys[5]]),
            custo: parseNumber(row[rowKeys[6]]),
            percentual_custo: parseNumber(row[rowKeys[7]]),
            lucro: parseNumber(row[rowKeys[8]]),
            percentual_lucro: parseNumber(row[rowKeys[9]])
          };

          console.log(`✅ TOTAL processado para ${currentUser}:`, {
            itens: totalItem.itens,
            venda: totalItem.venda,
            lucro: totalItem.lucro
          });

          parsedData.push(totalItem);
        } else {
          console.log(`⚠️ Linha ${i + 1} - dados insuficientes para TOTAL de ${currentUser}`);
        }
      }
    }

    console.log(`👥 Total de registros de colaboradores processados: ${parsedData.length}`);
    console.log('📊 Resumo por usuário:');
    const resumoPorUsuario = parsedData.reduce((acc, item) => {
      const userName = item.user_name || 'Usuário Desconhecido';
      if (!acc[userName]) {
        acc[userName] = { registros: 0, totalVenda: 0 };
      }
      acc[userName].registros++;
      acc[userName].totalVenda += item.venda || 0;
      return acc;
    }, {} as Record<string, { registros: number; totalVenda: number }>);

    Object.entries(resumoPorUsuario).forEach(([usuario, dados]) => {
      console.log(`  👤 ${usuario}: ${dados.registros} registros, R$ ${dados.totalVenda.toLocaleString('pt-BR')}`);
    });

    return parsedData;
  };

  // Função para parsear dados de estoque
  const parseEstoqueData = (data: any[]): EstoqueData[] => {
    const parsedData: EstoqueData[] = [];
    let currentUnitCode = '';

    console.log('📦 Iniciando parse de dados de estoque...');
    console.log('📋 Total de linhas:', data.length);

    // Encontrar a linha de cabeçalhos reais
    let headerRowIndex = -1;
    let headerRow: any = null;

    // Procurar pela linha que contém os cabeçalhos
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const rowValues = Object.values(row).map(v => v?.toString().toLowerCase() || '');
      const rowString = rowValues.join(' ');

      console.log(`🔍 Verificando linha ${i + 1}:`, rowString.substring(0, 200));

      // Verificar se esta linha contém cabeçalhos de estoque
      const hasEstoqueHeaders = [
        'un. neg.', 'produto', 'estoque', 'curva', 'preço', 'ação',
        'media', 'classific', 'ult.', 'venda', 'compra', 'final', 'dias'
      ].some(header => rowString.includes(header));

      if (hasEstoqueHeaders) {
        headerRowIndex = i;
        headerRow = row;
        console.log(`📋 Cabeçalhos encontrados na linha ${i + 1}`);
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log('⚠️ Nenhuma linha de cabeçalho encontrada');
      return [];
    }

    console.log('📋 Linha de cabeçalho encontrada:', headerRow);

    // Mapear colunas baseado nos cabeçalhos encontrados
    const columnMapping: { [key: string]: string } = {};
    Object.keys(headerRow).forEach(key => {
      const headerValue = headerRow[key]?.toString().toLowerCase() || '';
      console.log(`🔍 Mapeando coluna ${key}: "${headerValue}"`);

      if (headerValue.includes('un. neg.') && !headerValue.includes('apelido')) {
        columnMapping['Un. Neg.'] = key;
        console.log(`✅ Mapeado 'Un. Neg.' para coluna ${key}`);
      } else if (headerValue.includes('apelido') && headerValue.includes('un. neg.')) {
        columnMapping['Apelido Unidade'] = key;
        console.log(`✅ Mapeado 'Apelido Unidade' para coluna ${key}`);
      } else if (headerValue.includes('produto')) {
        columnMapping['Produto'] = key;
        console.log(`✅ Mapeado 'Produto' para coluna ${key}`);
      } else if (headerValue.includes('estoque') && !headerValue.includes('final') && !headerValue.includes('classific')) {
        columnMapping['Estoque'] = key;
        console.log(`✅ Mapeado 'Estoque' para coluna ${key}`);
      } else if (headerValue.includes('curva')) {
        columnMapping['Curva'] = key;
        console.log(`✅ Mapeado 'Curva' para coluna ${key}`);
      } else if (headerValue.includes('media') && headerValue.includes('venda')) {
        columnMapping['Media Venda'] = key;
        console.log(`✅ Mapeado 'Media Venda' para coluna ${key}`);
      } else if (headerValue.includes('media') && !headerValue.includes('venda')) {
        columnMapping['Media'] = key;
        console.log(`✅ Mapeado 'Media' para coluna ${key}`);
      } else if (headerValue.includes('classific') || headerValue.includes('dias')) {
        columnMapping['Estoque Classific'] = key;
        console.log(`✅ Mapeado 'Estoque Classific' para coluna ${key}`);
      } else if (headerValue.includes('preço') || headerValue.includes('ação')) {
        columnMapping['Preço'] = key;
        console.log(`✅ Mapeado 'Preço' para coluna ${key}`);
      } else if (headerValue.includes('estoque') && headerValue.includes('final')) {
        columnMapping['Estoque Final'] = key;
        console.log(`✅ Mapeado 'Estoque Final' para coluna ${key}`);
      } else if (headerValue.includes('ult.') && headerValue.includes('venda')) {
        columnMapping['Ult. Venda'] = key;
        console.log(`✅ Mapeado 'Ult. Venda' para coluna ${key}`);
      } else if (headerValue.includes('ult.') && headerValue.includes('compra')) {
        columnMapping['Ult. Compra'] = key;
        console.log(`✅ Mapeado 'Ult. Compra' para coluna ${key}`);
      } else if (headerValue.includes('dia') && headerValue.includes('estocad')) {
        columnMapping['Dia Estocad'] = key;
        console.log(`✅ Mapeado 'Dia Estocad' para coluna ${key}`);
      } else if (headerValue.includes('%') || headerValue.includes('sugrida')) {
        columnMapping['% Sunrida'] = key;
        console.log(`✅ Mapeado '% Sunrida' para coluna ${key}`);
      }

      // Novos campos para estoque_2
      else if (headerValue.includes('necessidade')) {
        columnMapping['Necessidade'] = key;
      } else if (headerValue.includes('estoque') && headerValue.includes('confirmado')) {
        columnMapping['Estoque Confirmado'] = key;
      } else if (headerValue.includes('comprar')) {
        columnMapping['Comprar'] = key;
      } else if (headerValue.includes('curva') && headerValue.includes('qtd')) {
        columnMapping['Curva Qtd'] = key;
      } else if (headerValue.includes('media') && headerValue.includes('venda') && headerValue.includes('mensal')) {
        columnMapping['Media Venda Mensal'] = key;
      } else if (headerValue.includes('estoque') && headerValue.includes('final') && headerValue.includes('dias')) {
        columnMapping['Estoque Final Dias'] = key;
      } else if (headerValue.includes('classificacao') && headerValue.includes('principal')) {
        columnMapping['Classificacao Principal'] = key;
      } else if (headerValue.includes('preco') && headerValue.includes('venda') && headerValue.includes('medio')) {
        columnMapping['Preco Venda Medio'] = key;
      } else if (headerValue.includes('ultima') && headerValue.includes('venda') && headerValue.includes('dias')) {
        columnMapping['Ultima Venda Dias'] = key;
      } else if (headerValue.includes('transferencia') && headerValue.includes('confirmada')) {
        columnMapping['Transferencia Confirmada'] = key;
      } else if (headerValue.includes('comprar') && headerValue.includes('dias')) {
        columnMapping['Comprar Dias'] = key;
      } else if (headerValue.includes('necessidade') && headerValue.includes('dias')) {
        columnMapping['Necessidade Dias'] = key;
      } else if (headerValue.includes('ultima') && headerValue.includes('compra') && headerValue.includes('dias')) {
        columnMapping['Ultima Compra Dias'] = key;
      } else if (headerValue.includes('apelido') && headerValue.includes('unidade')) {
        columnMapping['Apelido Unidade'] = key;
      } else if (headerValue.includes('fornecedor') && headerValue.includes('ultima') && headerValue.includes('compra')) {
        columnMapping['Fornecedor Ultima Compra'] = key;
      } else if (headerValue.includes('media') && headerValue.includes('venda') && headerValue.includes('diaria')) {
        columnMapping['Media Venda Diaria'] = key;
      } else if (headerValue.includes('qtd') && headerValue.includes('demanda')) {
        columnMapping['Qtd Demanda'] = key;
      } else if (headerValue.includes('estoque') && headerValue.includes('minimo')) {
        columnMapping['Estoque Minimo'] = key;
      } else if (headerValue.includes('origem') && headerValue.includes('estoque') && headerValue.includes('minimo')) {
        columnMapping['Origem Estoque Minimo'] = key;
      } else if (headerValue.includes('custo')) {
        columnMapping['Custo'] = key;
      } else if (headerValue.includes('custo') && headerValue.includes('medio')) {
        columnMapping['Custo Medio'] = key;
      } else if (headerValue.includes('curva') && headerValue.includes('valor')) {
        columnMapping['Curva Valor'] = key;
      } else if (headerValue.includes('custo') && headerValue.includes('necessidade')) {
        columnMapping['Custo x Necessidade'] = key;
      } else if (headerValue.includes('custo') && headerValue.includes('estoque')) {
        columnMapping['Custo x Estoque'] = key;
      } else if (headerValue.includes('ruptura') && headerValue.includes('venda')) {
        columnMapping['Ruptura Venda'] = key;
      } else if (headerValue.includes('necessidade') && headerValue.includes('qtd')) {
        columnMapping['Necessidade Qtd'] = key;
      } else if (headerValue.includes('percentual') && headerValue.includes('suprida')) {
        columnMapping['Percentual Suprida Qtd'] = key;
      } else if (headerValue.includes('compra') && headerValue.includes('confirmada')) {
        columnMapping['Compra Confirmada'] = key;
      } else if (headerValue.includes('encomenda')) {
        columnMapping['Encomenda'] = key;
      }
    });

    // Se não encontrou a coluna Un. Neg., tentar encontrar na primeira coluna
    if (!columnMapping['Un. Neg.']) {
      const firstColumnKey = Object.keys(headerRow)[0];
      if (firstColumnKey) {
        columnMapping['Un. Neg.'] = firstColumnKey;
      }
    }

    // Processar linhas de dados (pular linhas de cabeçalho)
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];

      // Pular linhas vazias ou que contêm apenas cabeçalhos do sistema
      const rowValues = Object.values(row);
      const hasSystemHeader = rowValues.some(value =>
        value && value.toString().includes('Unidade de Negócio:') ||
        value && value.toString().includes('Usuário:') ||
        value && value.toString().includes('Impressão:')
      );

      if (hasSystemHeader) {
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
      const estoqueItem: EstoqueData = {};

      Object.entries(columnMapping).forEach(([field, columnKey]) => {
        const value = row[columnKey];

        switch (field) {
          case 'Un. Neg.':
            // Usar o valor real da célula, não o cabeçalho
            const unitValue = value?.toString();
            console.log(`🔍 Valor lido da coluna 'Un. Neg.': "${unitValue}"`);

            if (unitValue && unitValue !== 'Un. Neg.' && unitValue !== 'Unidade de Negócio' && unitValue.trim() !== '') {
              estoqueItem['Un. Neg.'] = unitValue.trim();
              console.log(`✅ Unidade definida: "${unitValue.trim()}"`);
            } else if (currentUnitCode) {
              estoqueItem['Un. Neg.'] = currentUnitCode;
              console.log(`🔄 Usando unidade atual: "${currentUnitCode}"`);
            }
            break;
          case 'Produto':
            estoqueItem['Produto'] = value?.toString();
            break;
          case 'Estoque':
            estoqueItem['Estoque'] = parseNumber(value);
            break;
          case 'Curva':
            estoqueItem['Curva'] = value?.toString();
            break;
          case 'Media':
            estoqueItem['Media'] = parseNumber(value);
            break;
          case 'Estoque Classific':
            estoqueItem['Estoque Classific'] = parseNumber(value);
            break;
          case 'Preço':
            estoqueItem['Preço'] = parseNumber(value);
            break;
          case 'Estoque Final':
            estoqueItem['Estoque Final'] = parseNumber(value);
            break;
          case 'Ult. Venda':
            estoqueItem['Ult. Venda'] = value?.toString();
            break;
          case 'Ult. Compra':
            estoqueItem['Ult. Compra'] = value?.toString();
            break;
          case 'Media Venda':
            estoqueItem['Media Venda'] = parseNumber(value);
            break;
          case 'Dia Estocad':
            estoqueItem['Dia Estocad'] = parseNumber(value);
            break;
          case '% Sunrida':
            estoqueItem['% Sunrida'] = parseNumber(value);
            break;
          // Novos campos para estoque_2
          case 'Necessidade':
            estoqueItem['Necessidade'] = value?.toString();
            break;
          case 'Estoque Confirmado':
            estoqueItem['Estoque Confirmado'] = parseNumber(value);
            break;
          case 'Comprar':
            estoqueItem['Comprar'] = parseNumber(value);
            break;
          case 'Curva Qtd':
            estoqueItem['Curva Qtd'] = value?.toString();
            break;
          case 'Media Venda Mensal':
            estoqueItem['Media Venda Mensal'] = parseNumber(value);
            break;
          case 'Estoque Final Dias':
            estoqueItem['Estoque Final Dias'] = parseNumber(value);
            break;
          case 'Classificacao Principal':
            estoqueItem['Classificacao Principal'] = value?.toString();
            break;
          case 'Preco Venda Medio':
            estoqueItem['Preco Venda Medio'] = parseNumber(value);
            break;
          case 'Ultima Venda Dias':
            estoqueItem['Ultima Venda Dias'] = parseNumber(value);
            break;
          case 'Transferencia Confirmada':
            estoqueItem['Transferencia Confirmada'] = parseNumber(value);
            break;
          case 'Comprar Dias':
            estoqueItem['Comprar Dias'] = parseNumber(value);
            break;
          case 'Necessidade Dias':
            estoqueItem['Necessidade Dias'] = parseNumber(value);
            break;
          case 'Ultima Compra Dias':
            estoqueItem['Ultima Compra Dias'] = parseNumber(value);
            break;
          case 'Apelido Unidade':
            estoqueItem['Apelido Unidade'] = value?.toString();
            break;
          case 'Fornecedor Ultima Compra':
            estoqueItem['Fornecedor Ultima Compra'] = value?.toString();
            break;
          case 'Media Venda Diaria':
            estoqueItem['Media Venda Diaria'] = parseNumber(value);
            break;
          case 'Qtd Demanda':
            estoqueItem['Qtd Demanda'] = parseNumber(value);
            break;
          case 'Estoque Minimo':
            estoqueItem['Estoque Minimo'] = parseNumber(value);
            break;
          case 'Origem Estoque Minimo':
            estoqueItem['Origem Estoque Minimo'] = value?.toString();
            break;
          case 'Custo':
            estoqueItem['Custo'] = parseNumber(value);
            break;
          case 'Custo Medio':
            estoqueItem['Custo Medio'] = parseNumber(value);
            break;
          case 'Curva Valor':
            estoqueItem['Curva Valor'] = value?.toString();
            break;
          case 'Custo x Necessidade':
            estoqueItem['Custo x Necessidade'] = parseNumber(value);
            break;
          case 'Custo x Estoque':
            estoqueItem['Custo x Estoque'] = parseNumber(value);
            break;
          case 'Ruptura Venda':
            estoqueItem['Ruptura Venda'] = parseNumber(value);
            break;
          case 'Necessidade Qtd':
            estoqueItem['Necessidade Qtd'] = parseNumber(value);
            break;
          case 'Percentual Suprida Qtd':
            estoqueItem['Percentual Suprida Qtd'] = parseNumber(value);
            break;
          case 'Compra Confirmada':
            estoqueItem['Compra Confirmada'] = parseNumber(value);
            break;
          case 'Encomenda':
            estoqueItem['Encomenda'] = parseNumber(value);
            break;
        }
      });

      // Se não encontrou unidade na coluna específica, procurar em outras colunas
      // Mas apenas se não temos uma unidade válida já definida
      if (!estoqueItem['Un. Neg.'] || estoqueItem['Un. Neg.'] === '') {
        // Procurar por códigos de unidade em outras colunas
        // Mas apenas nas primeiras colunas (onde normalmente fica o código da unidade)
        const firstColumns = Object.keys(row).slice(0, 3); // Primeiras 3 colunas

        for (const columnKey of firstColumns) {
          const cellValue = row[columnKey];
          const cellStr = cellValue?.toString() || '';

          // Procurar por padrões de código de unidade (números de 1-2 dígitos)
          const unitMatch = cellStr.match(/^(\d{1,2})$/);
          if (unitMatch && !estoqueItem['Un. Neg.']) {
            estoqueItem['Un. Neg.'] = unitMatch[1];
            break; // Parar na primeira unidade encontrada
          }
        }
      }

      // Se ainda não encontrou, tentar extrair código do nome da unidade
      if (!estoqueItem['Un. Neg.'] || estoqueItem['Un. Neg.'] === '') {
        // Procurar por códigos em qualquer coluna que contenha texto
        for (const columnKey of Object.keys(row)) {
          const cellValue = row[columnKey];
          const cellStr = cellValue?.toString() || '';

          // Procurar por padrões como "Cód. Un. Neg.: 02" ou "02 - NOME"
          const codeMatch = cellStr.match(/(?:cód\.?\s*un\.?\s*neg\.?:\s*)?(\d{1,2})/i);
          if (codeMatch && !estoqueItem['Un. Neg.']) {
            estoqueItem['Un. Neg.'] = codeMatch[1];
            break;
          }
        }
      }

      // Verificar se temos dados válidos
      if (estoqueItem['Produto'] && estoqueItem['Estoque'] !== undefined) {
        // Se não temos código de unidade, usar o atual
        if (!estoqueItem['Un. Neg.'] && currentUnitCode) {
          estoqueItem['Un. Neg.'] = currentUnitCode;
        }

        parsedData.push(estoqueItem);
        console.log(`✅ Registro processado: ${estoqueItem['Produto']} - Unidade: ${estoqueItem['Un. Neg.']} - Estoque: ${estoqueItem['Estoque']}`);
      } else {
        console.log(`⚠️ Linha ${i + 1} ignorada - dados insuficientes:`, estoqueItem);
      }
    }

    console.log(`📦 Total de registros de estoque processados: ${parsedData.length}`);
    return parsedData;
  };

  // Função para tratar números corretamente (formato brasileiro)
  const parseNumber = (value: any): number => {
    if (!value) return 0;
    const str = value.toString().trim();

    // Se já é um número, retornar diretamente
    if (typeof value === 'number') return value;

    // Remover espaços e caracteres especiais
    let cleanStr = str.replace(/\s/g, '');

    // Verificar se tem vírgula (formato brasileiro)
    if (cleanStr.includes(',')) {
      // Formato brasileiro: 127546,30 -> 127546.30
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanStr.includes('.')) {
      // Verificar se é formato americano ou brasileiro
      const parts = cleanStr.split('.');
      if (parts.length > 2) {
        // Formato brasileiro com pontos de milhares: 127.546.30 -> 127546.30
        cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      }
    }

    const result = parseFloat(cleanStr);
    return isNaN(result) ? 0 : result;
  };

  // Função para parsear dados de uma aba específica
  const parseExcelDataFromSheet = (data: any[], initialUnitCode: string = ''): { data: ExcelData[], currentUnitCode: string } => {
    const parsedData: ExcelData[] = [];
    let currentUnitCode = initialUnitCode;
    const processedKeys = new Set(); // Para evitar processar a mesma combinação múltiplas vezes

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Verificar se é uma linha de cabeçalho de unidade
      // Pode estar em qualquer coluna, então vamos verificar todas
      const unitCodeMatch = Object.values(row).find(value =>
        value && value.toString().includes('Cód. Un. Neg.:')
      );

      if (unitCodeMatch) {
        const match = unitCodeMatch.toString().match(/Cód\. Un\. Neg\.:\s*(\d+)/);
        if (match) {
          currentUnitCode = match[1];
        }
        continue;
      }

      // Verificar se é uma linha de dados válida (tem ano-mês)
      // Mapear colunas __EMPTY para os nomes corretos
      let anoMes = row['__EMPTY'] || row['Ano-mês'];

      // Se não encontrou, verificar se a primeira chave é uma data (Page 2)
      if (!anoMes) {
        const firstKey = Object.keys(row)[0];
        if (firstKey && firstKey.toString().match(/^\d{4}-\d{2}$/)) {
          // Na Page 2, usar o VALOR da primeira coluna como data
          anoMes = row[firstKey];
        }
      }

      // Se não encontrou na coluna padrão, procurar em outras colunas
      if (!anoMes) {
        // Procurar por colunas que contêm datas no formato YYYY-MM
        const dateColumns = Object.keys(row).filter(key =>
          key && key.toString().match(/^\d{4}-\d{2}$/)
        );
        if (dateColumns.length > 0) {
          // Na Page 2, TODAS as linhas são dados reais
          // O VALOR da primeira coluna é a data real de cada linha
          anoMes = row[dateColumns[0]];
        } else {
          // Se não encontrou colunas com data, verificar se a primeira chave é uma data
          const firstKey = Object.keys(row)[0];
          if (firstKey && firstKey.toString().match(/^\d{4}-\d{2}$/)) {
            // A primeira chave é uma data, usar ela diretamente
            anoMes = firstKey;
          }
        }
      }

      // Se encontrou uma data mas não tem unidade válida, usar a última unidade da Page 1
      if (anoMes && !currentUnitCode && initialUnitCode) {
        currentUnitCode = initialUnitCode;
      }

      // Pular linhas que contêm "(Soma)" ou "Total"
      if (anoMes && (anoMes.toString().includes('(Soma)') || anoMes.toString().includes('Total'))) {
        continue;
      }

      if (anoMes && (
        anoMes.toString().match(/^\d{4}-\d{2}$/) ||
        anoMes.toString().match(/^\d{2}\/\d{2}\/\d{4}$/) ||
        anoMes.toString().match(/^\d{4}\/\d{2}$/)
      )) {
        // Verificar se temos uma unidade válida
        if (!currentUnitCode) {
          continue;
        }

        // Verificar se já processamos esta combinação de data e unidade
        const key = `${currentUnitCode}-${anoMes}`;
        if (processedKeys.has(key)) {
          continue; // Pular se já processamos esta combinação
        }
        processedKeys.add(key);

        // Normalizar formato da data
        let dataNormalizada = anoMes.toString();
        if (dataNormalizada.includes('/')) {
          const [mes, ano] = dataNormalizada.split('/');
          dataNormalizada = `${ano}-${mes.padStart(2, '0')}`;
        }

        // Função para tratar percentuais corretamente
        const parsePercent = (value: any): number => {
          const n = parseNumber(value);

          // Se o valor for maior que 100, provavelmente está sem ponto decimal
          // Ex: 136 deve virar 1.36, 3341 deve virar 33.41
          if (n > 100) {
            return n / 100;
          }
          return n;
        };

        // Usar diretamente os valores das chaves como estão no Excel
        const rowKeys = Object.keys(row);
        let faturamentoItem: ExcelData = {};

        // Na Page 2, TODAS as linhas são dados reais
        const isPage2Data = rowKeys.length > 0 && rowKeys[0].match(/^\d{4}-\d{2}$/);
        // Para Page 2, usar o VALOR da primeira coluna como data (não a chave)
        const dataReal = isPage2Data ? row[rowKeys[0]] : (rowKeys.length > 0 ? row[rowKeys[0]] : null);

        // Se temos pelo menos 9 valores (data + 8 colunas de dados)
        if (rowKeys.length >= 9) {

          // Para TODAS as linhas, usar os valores das colunas
          faturamentoItem = {
            'Itens': parseNumber(row[rowKeys[1]]),      // 2ª coluna
            'Venda': parseNumber(row[rowKeys[2]]),      // 3ª coluna
            '% Tot.': parsePercent(row[rowKeys[3]]),    // 4ª coluna
            'Desconto': parseNumber(row[rowKeys[4]]),   // 5ª coluna
            '% Desconto': parsePercent(row[rowKeys[5]]), // 6ª coluna
            'Custo': parseNumber(row[rowKeys[6]]),      // 7ª coluna
            '% Custo': parsePercent(row[rowKeys[7]]),   // 8ª coluna
            'Lucro': parseNumber(row[rowKeys[8]]),      // 9ª coluna
            '% Lucro': parsePercent(row[rowKeys[9]])    // 10ª coluna
          };
        }

        // Adicionar campos obrigatórios
        // Usar a data real encontrada no valor da primeira coluna
        faturamentoItem['Ano-mês'] = dataReal || dataNormalizada;
        faturamentoItem['Cód. Un. Neg.'] = currentUnitCode;

        parsedData.push(faturamentoItem);
      }
    }

    return { data: parsedData, currentUnitCode };
  };

  // Função original para compatibilidade
  // const parseExcelData = (data: any[]): ExcelData[] => {
  //   const result = parseExcelDataFromSheet(data, '');
  //   return result.data;
  // };

  const importToDatabase = async (parsedData: ExcelData[] | EstoqueData[] | ColaboradorData[], sheetType: 'faturamento' | 'estoque' | 'colaboradores') => {
    try {
      setImporting(true);

      if (!supabase) {
        throw new Error('Supabase não está inicializado');
      }

      if (sheetType === 'estoque') {
        await importEstoqueData(parsedData as EstoqueData[]);
      } else if (sheetType === 'faturamento') {
        await importFaturamentoData(parsedData as ExcelData[]);
      } else if (sheetType === 'colaboradores') {
        await importColaboradoresData(parsedData as ColaboradorData[]);
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      setResult({
        success: false,
        message: `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setImporting(false);
    }
  };

  const importEstoqueData = async (estoqueData: EstoqueData[]) => {
    // Buscar unidades existentes
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo, nome');

    if (unidadesError) {
      throw new Error(`Erro ao buscar unidades: ${unidadesError.message}`);
    }

    console.log('🏢 Unidades disponíveis no banco:', unidades);

    // Mapear códigos numéricos para os IDs das unidades no banco
    const unidadesMap = new Map(unidades?.map((u: any) => [u.codigo, u.id]) || []);

    console.log('🏢 Mapeamento de unidades por código:', Array.from(unidadesMap.entries()));

    // Inserir dados de estoque
    const estoqueToInsert = [];
    const unidadesEncontradas = new Set();
    const unidadesNaoEncontradas = new Set();

    for (const item of estoqueData) {
      const unidadeCode = item['Un. Neg.'] || '';
      console.log(`🔍 Processando unidade: "${unidadeCode}"`);

      // Buscar diretamente pelo código da unidade
      const unidadeId = unidadesMap.get(unidadeCode);
      console.log(`🔍 Buscando unidade "${unidadeCode}" no mapa:`, Array.from(unidadesMap.entries()));

      if (unidadeId) {
        unidadesEncontradas.add(unidadeCode);
        console.log(`✅ Unidade encontrada: ${unidadeCode} -> ID: ${unidadeId}`);
      } else {
        unidadesNaoEncontradas.add(unidadeCode);
        console.log(`⚠️ Unidade não encontrada: ${unidadeCode}`);
        console.log(`🔍 Mapa de unidades disponível:`, Array.from(unidadesMap.entries()));
        continue;
      }

      if (!item['Produto']) {
        continue;
      }

      // Gerar data de estocagem e ano_mes baseado na data atual
      const hoje = new Date();
      const dataEstocagem = hoje.toISOString().split('T')[0];
      const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

      const estoqueItem = {
        unidade_id: unidadeId,
        produto_nome: item['Produto'],
        fabricante: item['Curva'] || 'N/A',
        quantidade: item['Estoque'] || 0,
        valor_estoque: item['Preço'] || 0, // Preço unitário apenas
        dias_estoque: item['Estoque Classific'] || 0,
        data_atualizacao: dataEstocagem,
        data_estocagem: dataEstocagem,
        ano_mes: anoMes,
        necessidade: item['Necessidade'] || 'NORMAL',
        estoque_confirmado: item['Estoque Confirmado'] || item['Estoque'] || 0,
        comprar: item['Comprar'] || 0,
        curva_qtd: item['Curva Qtd'] || item['Curva'] || 'C',
        media_venda_mensal: item['Media Venda Mensal'] || item['Media Venda'] || 0,
        estoque_final_dias: item['Estoque Final Dias'] || item['Estoque Final'] || 0,
        classificacao_principal: item['Classificacao Principal'] || 'MÉDIO',
        preco_venda_medio: item['Preco Venda Medio'] || item['Preço'] || 0,
        ultima_venda_dias: item['Ultima Venda Dias'] || 0,
        transferencia_confirmada: item['Transferencia Confirmada'] || 0,
        comprar_dias: item['Comprar Dias'] || 0,
        necessidade_dias: item['Necessidade Dias'] || 0,
        ultima_compra_dias: item['Ultima Compra Dias'] || 0,
        apelido_unidade: item['Apelido Unidade'] || '',
        fornecedor_ultima_compra: item['Fornecedor Ultima Compra'] || '',
        media_venda_diaria: item['Media Venda Diaria'] || 0,
        qtd_demanda: item['Qtd Demanda'] || 0,
        estoque_minimo: item['Estoque Minimo'] || 0,
        origem_estoque_minimo: item['Origem Estoque Minimo'] || 'SISTEMA',
        custo: item['Custo'] || 0,
        custo_medio: item['Custo Medio'] || item['Custo'] || 0,
        curva_valor: item['Curva Valor'] || item['Curva'] || 'C',
        custo_x_necessidade: item['Custo x Necessidade'] || 0,
        custo_x_estoque: item['Custo x Estoque'] || 0,
        ruptura_venda: item['Ruptura Venda'] || 0,
        necessidade_qtd: item['Necessidade Qtd'] || 0,
        percentual_suprida_qtd: item['Percentual Suprida Qtd'] || item['% Sunrida'] || 0,
        compra_confirmada: item['Compra Confirmada'] || 0,
        encomenda: item['Encomenda'] || 0
      };

      estoqueToInsert.push(estoqueItem);
    }

    console.log('📊 Resumo das unidades:', {
      encontradas: Array.from(unidadesEncontradas),
      naoEncontradas: Array.from(unidadesNaoEncontradas),
      totalEncontradas: unidadesEncontradas.size,
      totalNaoEncontradas: unidadesNaoEncontradas.size,
      unidadesDisponiveis: unidades?.map((u: any) => ({ id: u.id, codigo: u.codigo, nome: u.nome }))
    });

    // Remover duplicatas antes da inserção
    console.log('🔍 Verificando duplicatas de estoque...');
    const seenKeys = new Set();
    const uniqueEstoqueData = estoqueToInsert.filter((item: any) => {
      const key = `${item.unidade_id}-${item.produto_nome}`;
      if (seenKeys.has(key)) {
        console.log(`⚠️ Removendo duplicata de estoque: ${key}`);
        return false;
      } else {
        seenKeys.add(key);
        return true;
      }
    });

    console.log(`📦 Dados únicos de estoque após remoção de duplicatas: ${uniqueEstoqueData.length}`);

    // Inserir dados no banco (estoque_2)
    if (uniqueEstoqueData.length > 0) {
      // Primeiro, tentar inserir com upsert
      let { error } = await supabase
        .from('estoque_2')
        .upsert(uniqueEstoqueData, {
          onConflict: 'unidade_id,produto_nome',
          ignoreDuplicates: false
        });

      // Se falhar por causa da constraint, tentar inserção simples
      if (error && error.message.includes('constraint')) {
        console.log('⚠️ Constraint não encontrada, tentando inserção simples...');

        // Remover duplicatas antes da inserção
        const estoqueToInsert = [];
        const seenKeys = new Set();

        for (const item of uniqueEstoqueData) {
          const key = `${item.unidade_id}-${item.produto_nome}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            estoqueToInsert.push(item);
          }
        }

        // Inserir sem upsert
        const { error: insertError } = await supabase
          .from('estoque_2')
          .insert(estoqueToInsert);

        if (insertError) {
          throw insertError;
        }

        console.log(`✅ ${estoqueToInsert.length} registros inseridos sem upsert`);
      } else if (error) {
        throw error;
      }
    }

    setResult({
      success: true,
      message: `🎉 Importação de estoque concluída com sucesso! ${uniqueEstoqueData.length} registros únicos de estoque foram inseridos/atualizados na tabela estoque_2.`,
      data: uniqueEstoqueData
    });

    // Chamar callback de sucesso se fornecido
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const importFaturamentoData = async (faturamentoData: ExcelData[]) => {
    // Agrupar dados por unidade de negócio
    const dataByUnit = faturamentoData.reduce((acc, row) => {
      const unitCode = row['Cód. Un. Neg.'];
      if (!unitCode) return acc;

      if (!acc[unitCode]) {
        acc[unitCode] = [];
      }
      acc[unitCode].push(row);
      return acc;
    }, {} as { [key: string]: ExcelData[] });

    // Buscar unidades existentes
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo');

    if (unidadesError) {
      throw new Error(`Erro ao buscar unidades: ${unidadesError.message}`);
    }

    // Mapear códigos numéricos para os IDs das unidades no banco
    const unidadesMap = new Map(unidades?.map((u: any) => [u.codigo, u.id]) || []);

    // Inserir dados de faturamento
    const faturamentoDataToInsert = [];
    for (const [unitCode, rows] of Object.entries(dataByUnit)) {
      const unidadeId = unidadesMap.get(unitCode);

      if (!unidadeId) {
        continue;
      }

      for (const row of rows) {
        if (!row['Ano-mês']) {
          continue;
        }

        // Função para garantir que o valor seja um número válido
        const ensureNumber = (value: any): number => {
          if (value === null || value === undefined) return 0;
          const num = typeof value === 'number' ? value : parseFloat(value);
          return isNaN(num) ? 0 : num;
        };

        const faturamentoItem = {
          unidade_negocio: unidadeId,
          ano_mes: row['Ano-mês'],
          itens_vendidos: ensureNumber(row['Itens']),
          valor_venda: ensureNumber(row['Venda']),
          percentual_total: ensureNumber(row['% Tot.']),
          valor_desconto: ensureNumber(row['Desconto']),
          percentual_desconto: ensureNumber(row['% Desconto']),
          valor_custo: ensureNumber(row['Custo']),
          percentual_custo: ensureNumber(row['% Custo']),
          valor_lucro: ensureNumber(row['Lucro']),
          percentual_lucro: ensureNumber(row['% Lucro'])
        };

        faturamentoDataToInsert.push(faturamentoItem);
      }
    }

    // Remover duplicatas antes da inserção
    console.log('🔍 Verificando duplicatas de faturamento...');
    const seenKeys = new Set();
    const uniqueFaturamentoData = faturamentoDataToInsert.filter((item: any) => {
      const key = `${item.unidade_negocio}-${item.ano_mes}`;
      if (seenKeys.has(key)) {
        console.log(`⚠️ Removendo duplicata de faturamento: ${key}`);
        return false;
      } else {
        seenKeys.add(key);
        return true;
      }
    });

    console.log(`📊 Dados únicos de faturamento após remoção de duplicatas: ${uniqueFaturamentoData.length}`);

    // Inserir dados no banco
    if (uniqueFaturamentoData.length > 0) {
      const { error } = await supabase
        .from('faturamento')
        .upsert(uniqueFaturamentoData, {
          onConflict: 'unidade_negocio,ano_mes',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }
    }

    setResult({
      success: true,
      message: `🎉 Importação de faturamento concluída com sucesso! ${uniqueFaturamentoData.length} registros únicos de faturamento foram inseridos/atualizados no banco de dados.`,
      data: uniqueFaturamentoData
    });

    // Chamar callback de sucesso se fornecido
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const importColaboradoresData = async (colaboradoresData: ColaboradorData[]) => {
    console.log('👥 Iniciando importação de dados de colaboradores...');
    console.log(`📊 Total de registros para processar: ${colaboradoresData.length}`);

    // Buscar unidades existentes
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidades')
      .select('id, codigo');

    if (unidadesError) {
      throw new Error(`Erro ao buscar unidades: ${unidadesError.message}`);
    }

    console.log('🏢 Unidades disponíveis no banco:', unidades?.map(u => ({ id: u.id, codigo: u.codigo })));

    // Mapear códigos numéricos para os IDs das unidades no banco
    const unidadesMap = new Map(unidades?.map((u: any) => [u.codigo, u.id]) || []);

    // Inserir dados de colaboradores
    const colaboradoresToInsert = [];
    const unidadesEncontradas = new Set();
    const unidadesNaoEncontradas = new Set();
    const usuariosProcessados = new Set();

    for (const item of colaboradoresData) {
      const unidadeCode = item['unidade_negocio'] || '';
      let unidadeId = unidadesMap.get(unidadeCode);

      if (!unidadeId) {
        unidadesNaoEncontradas.add(unidadeCode);
        console.log(`⚠️ Unidade não encontrada para colaborador: ${unidadeCode}`);
        continue;
      }

      unidadesEncontradas.add(unidadeCode);

      if (!item['user_id']) {
        console.log(`⚠️ Dados incompletos para colaborador: ${item.user_name}`);
        continue;
      }

      const colaboradorItem = {
        user_id: item['user_id'],
        user_name: item['user_name'],
        ano_mes: item['ano_mes'],
        unidade_negocio: unidadeId,
        itens_vendidos: item['itens'],
        valor_venda: item['venda'],
        percentual_total: item['percentual_total'],
        valor_desconto: item['desconto'],
        percentual_desconto: item['percentual_desconto'],
        valor_custo: item['custo'],
        percentual_custo: item['percentual_custo'],
        valor_lucro: item['lucro'],
        percentual_lucro: item['percentual_lucro']
      };

      colaboradoresToInsert.push(colaboradorItem);
      usuariosProcessados.add(item['user_name'] || 'Desconhecido');

      console.log(`✅ Processado: ${item['user_name']} - ${item['ano_mes']} - Unidade ${unidadeCode} - Venda: R$ ${(item['venda'] || 0).toLocaleString('pt-BR')}`);
    }

    console.log('📊 Resumo do processamento:', {
      totalRegistros: colaboradoresData.length,
      registrosProcessados: colaboradoresToInsert.length,
      usuariosUnicos: Array.from(usuariosProcessados),
      unidadesEncontradas: Array.from(unidadesEncontradas),
      unidadesNaoEncontradas: Array.from(unidadesNaoEncontradas)
    });

    // Remover duplicatas antes da inserção
    console.log('🔍 Verificando duplicatas de colaboradores...');
    const seenKeys = new Set();
    const uniqueColaboradoresData = colaboradoresToInsert.filter((item: any) => {
      const key = `${item.user_id}-${item.ano_mes}-${item.unidade_negocio}`;
      if (seenKeys.has(key)) {
        console.log(`⚠️ Removendo duplicata de colaboradores: ${key}`);
        return false;
      } else {
        seenKeys.add(key);
        return true;
      }
    });

    console.log(`📦 Dados únicos de colaboradores após remoção de duplicatas: ${uniqueColaboradoresData.length}`);

    // Inserir dados no banco
    if (uniqueColaboradoresData.length > 0) {
      console.log('💾 Inserindo dados na tabela colaboradores...');
      const { error } = await supabase
        .from('colaboradores')
        .upsert(uniqueColaboradoresData, {
          onConflict: 'user_id,ano_mes,unidade_negocio',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('❌ Erro ao inserir colaboradores:', error);
        throw error;
      }

      console.log('✅ Dados de colaboradores inseridos com sucesso!');
    }

    setResult({
      success: true,
      message: `🎉 Importação de colaboradores concluída com sucesso! ${uniqueColaboradoresData.length} registros únicos de colaboradores foram inseridos/atualizados no banco de dados.`,
      data: uniqueColaboradoresData
    });

    // Chamar callback de sucesso se fornecido
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      console.log('📁 Arquivo selecionado:', file.name, file.type);

      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log('📖 Lendo arquivo...');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        console.log('📊 Planilhas encontradas:', workbook.SheetNames);

        // Processar cada aba separadamente
        let allFaturamentoData: ExcelData[] = [];
        let allEstoqueData: EstoqueData[] = [];
        let allColaboradoresData: ColaboradorData[] = [];
        let currentUnitCode = ''; // Manter entre abas

        workbook.SheetNames.forEach((sheetName, _sheetIndex) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log(`📋 Processando aba: ${sheetName}`);

          // Detectar tipo da planilha
          const sheetType = detectSheetType(jsonData);

          if (sheetType === 'estoque') {
            const estoqueData = parseEstoqueData(jsonData);
            allEstoqueData = allEstoqueData.concat(estoqueData);
            console.log(`📦 ${sheetName}: ${estoqueData.length} registros de estoque processados`);
          } else if (sheetType === 'faturamento') {
            // Parsear dados desta aba mantendo o currentUnitCode
            const parsedDataFromSheet = parseExcelDataFromSheet(jsonData, currentUnitCode);
            console.log(`📊 ${sheetName}: ${parsedDataFromSheet.data.length} registros de faturamento processados`);
            allFaturamentoData = allFaturamentoData.concat(parsedDataFromSheet.data);
            currentUnitCode = parsedDataFromSheet.currentUnitCode; // Atualizar para próxima aba
          } else if (sheetType === 'colaboradores') {
            const colaboradoresData = parseColaboradoresData(jsonData, sheetName);
            allColaboradoresData = allColaboradoresData.concat(colaboradoresData);
            console.log(`📊 ${sheetName}: ${colaboradoresData.length} registros de colaboradores processados`);
          } else {
            console.log(`⚠️ ${sheetName}: Tipo não reconhecido, pulando...`);
          }
        });

        // Importar dados baseado no tipo encontrado
        if (allEstoqueData.length > 0) {
          console.log(`📦 Importando ${allEstoqueData.length} registros de estoque...`);
          await importToDatabase(allEstoqueData, 'estoque');
        } else if (allFaturamentoData.length > 0) {
          console.log(`📊 Importando ${allFaturamentoData.length} registros de faturamento...`);
          await importToDatabase(allFaturamentoData, 'faturamento');
        } else if (allColaboradoresData.length > 0) {
          console.log(`👥 Importando ${allColaboradoresData.length} registros de colaboradores...`);
          await importToDatabase(allColaboradoresData, 'colaboradores');
        } else {
          setResult({
            success: false,
            message: 'Nenhum dado válido encontrado na planilha.'
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('💥 Erro ao ler arquivo:', error);
      setResult({
        success: false,
        message: `Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <FileSpreadsheet className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Importar Planilha Excel</h2>
          <p className="text-gray-600">
            Faça upload de uma planilha Excel com dados de vendas ou estoque para importar para o dashboard.
          </p>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Selecionar Arquivo Excel
          </label>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>

        {/* Import Button */}
        {file && (
          <div className="text-center mb-6">
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="inline h-4 w-4 mr-2" />
                  Importar Dados
                </>
              )}
            </button>
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div className={`rounded-md p-4 ${result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Instruções:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Formatos aceitos: .xlsx e .xls</li>
            <li>• <strong>Planilha de Faturamento:</strong> Deve ter colunas: Ano-mês, Itens, Venda, % Tot., Desconto, %, Custo, %, Lucro, %, Cód. Un. Neg.</li>
            <li>• <strong>Planilha de Estoque:</strong> Deve ter colunas: Un. Neg., Produto, Estoque, Curva, Media, Estoque Classific, Preço, etc.</li>
            <li>• <strong>Planilha de Colaboradores:</strong> Deve ter seções por usuário com dados de vendas por período e unidade</li>
            <li>• <strong>Novo:</strong> Dados de estoque são importados para a tabela estoque_2 com todos os campos da planilha original</li>
            <li>• <strong>Novo:</strong> Dados de colaboradores são importados para a tabela colaboradores</li>
            <li>• O sistema detecta automaticamente o tipo de planilha</li>
            <li>• O código da unidade deve corresponder aos códigos cadastrados no sistema</li>
            <li>• Dados duplicados serão atualizados automaticamente</li>
            <li>• Campos não encontrados na planilha receberão valores padrão</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExcelImporter; 