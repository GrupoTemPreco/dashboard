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
  'Fabricante'?: string;
  // Novos campos para estoque_2
  'Necessidade'?: string;
  'Estoque Confirmado'?: number;
  'Comprar'?: number;
  'Curva Qtd'?: string;
  'Media Venda Mensal'?: number;
  'Estoque Final Dias'?: number;
      'Classificação Principal'?: string;
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
  const detectSheetType = (
    data: any[],
    sheetName?: string,
    fileName?: string
  ): 'faturamento' | 'estoque' | 'colaboradores' | 'unknown' => {
    if (data.length === 0) return 'unknown';

    const normalize = (str: any): string =>
      (str?.toString() || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const sheetNameNormalized = normalize(sheetName || '');
    const fileNameNormalized = normalize(fileName || '');

    // Regra pedida: identificar pelo nome do ARQUIVO com prioridade máxima
    if (fileNameNormalized) {
      if (fileNameNormalized.includes('estoque')) {
        console.log('📄 Nome do arquivo indica ESTOQUE');
        return 'estoque';
      }
      if (fileNameNormalized.includes('colab')) {
        console.log('📄 Nome do arquivo indica COLABORADORES');
        return 'colaboradores';
      }
      if (fileNameNormalized.includes('faturamento') || fileNameNormalized.includes('fatur')) {
        console.log('📄 Nome do arquivo indica FATURAMENTO');
        return 'faturamento';
      }
    }

    // Regra pedida: identificar pelo nome da ABA com prioridade máxima
    if (sheetNameNormalized) {
      if (sheetNameNormalized.includes('estoque')) {
        console.log('🏷️ Nome da aba indica ESTOQUE');
        return 'estoque';
      }
      if (sheetNameNormalized.includes('colab')) {
        console.log('🏷️ Nome da aba indica COLABORADORES');
        return 'colaboradores';
      }
      if (sheetNameNormalized.includes('faturamento') || sheetNameNormalized.includes('fatur')) {
        console.log('🏷️ Nome da aba indica FATURAMENTO');
        return 'faturamento';
      }
    }

    // Analisar o conteúdo das células e cabeçalhos
    const allValues = data.flatMap(row => Object.values(row));
    const allValuesString = allValues.map(v => normalize(v)).join(' ');
    const firstRows = data.slice(0, 10);
    const headerCandidates = firstRows.flatMap(row => Object.keys(row));
    const headersNormalized = headerCandidates.map(h => normalize(h));

    console.log('🔍 DEBUG - Conteúdo normalizado:', allValuesString.substring(0, 500) + '...');
    console.log('🔍 DEBUG - Cabeçalhos normalizados:', headersNormalized.slice(0, 20));

    // Indicadores normalizados
    const estoqueIndicators = [
      'produto', 'estoque', 'curva', 'preco', 'acao',
      'media venda', 'estoque classific', 'dias', 'ult. venda', 'ult. compra',
      'estoque final', 'dia estocad', 'sugrida', 'necessidade', 'estoque conf',
      'comprar', 'curva qtd', 'media venda mensal', 'estoque (dias)', 'classificacao principal',
      'preco venda medio', 'estoque final (dias)', 'ult. venda (dias)', 'transf. conf',
      'comprar (dias)', 'necessidade (dias)', 'ult. compra (dias)', 'apelido un. neg',
      'fornecedor ult. compra', 'media venda diaria', 'fabricante', 'qtd. demanda',
      'est. min', 'origem est. min', 'dia estocagem', 'custo medio',
      'curva valor', 'custo x necessidade', 'custo x estoque', 'ruptura venda',
      'necessidade qtd', 'percentual suprida qtd', 'compra confirmada', 'encomenda'
    ];

    const colaboradoresIndicators = [
      'usuario:', 'colaborador', 'user:', 'analise de venda por item', 'periodo',
      'total usuario', 'total do usuario', 'vendedor:'
    ];

    const faturamentoIndicators = [
      'ano-mes', 'itens', 'venda', 'desconto', 'lucro',
      'percentual', 'tot.', 'valor', 'cod. un. neg', 'cod un neg',
      '% tot.', '% desconto', '% custo', '% lucro'
    ];

    // Scoring por quantidade de indicadores encontrados
    const countMatches = (indicators: string[]): number =>
      indicators.reduce((acc, ind) => acc + (allValuesString.includes(ind) ? 1 : 0), 0);

    const estoqueScore = countMatches(estoqueIndicators)
      + (headersNormalized.some(h => h.includes('produto')) ? 1 : 0)
      + (headersNormalized.some(h => h.includes('un. neg') || h.includes('unidade')) ? 1 : 0)
      + (sheetNameNormalized.includes('estoque') ? 2 : 0);

    const colaboradoresScore = countMatches(colaboradoresIndicators)
      + (allValuesString.includes('ano-mes:') ? 1 : 0)
      + (allValuesString.includes('total usuario') ? 1 : 0)
      + (sheetNameNormalized.includes('colab') || sheetNameNormalized.includes('colaborador') ? 2 : 0);

    // Para faturamento exigimos combinação mais forte (evitar falso positivo por "venda")
    const faturamentoStrongSignals = (
      (allValuesString.includes('ano-mes') || headersNormalized.includes('ano-mes')) &&
      (allValuesString.includes('cod. un. neg') || headersNormalized.some(h => h.includes('cod') && h.includes('un') && h.includes('neg')))
    ) ? 2 : 0;

    const faturamentoScore = countMatches(faturamentoIndicators)
      + faturamentoStrongSignals
      + ((sheetNameNormalized.includes('fatur') || sheetNameNormalized.includes('venda')) ? 1 : 0);

    console.log('🧮 Scores → Estoque:', estoqueScore, '| Colaboradores:', colaboradoresScore, '| Faturamento:', faturamentoScore);

    // Decisão com prioridade por maior score; empate: estoque > colaboradores > faturamento
    const maxScore = Math.max(estoqueScore, colaboradoresScore, faturamentoScore);
    if (maxScore === 0) {
      // Fallback por combinação de termos
      if ((allValuesString.includes('produto') && allValuesString.includes('estoque')) || headersNormalized.includes('produto')) {
        console.log('📦 Fallback: detectado ESTOQUE por combinação');
        return 'estoque';
      }
      if (allValuesString.includes('usuario:') || allValuesString.includes('colaborador')) {
        console.log('👥 Fallback: detectado COLABORADORES por termos');
        return 'colaboradores';
      }
      if (allValuesString.includes('ano-mes') && allValuesString.includes('venda')) {
        console.log('💰 Fallback: detectado FATURAMENTO por combinação');
        return 'faturamento';
      }
      return 'unknown';
    }

    if (estoqueScore === maxScore) {
      console.log('📦 Planilha detectada como ESTOQUE');
      return 'estoque';
    }
    if (colaboradoresScore === maxScore) {
      console.log('👥 Planilha detectada como COLABORADORES');
      return 'colaboradores';
    }
    console.log('💰 Planilha detectada como FATURAMENTO');
    return 'faturamento';
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

    // Processar cada linha para extrair informações
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowValues = Object.values(row).map(v => v?.toString() || '');
      const rowString = rowValues.join(' ').toLowerCase();

      console.log(`🔍 Processando linha ${i + 1}:`, rowString.substring(0, 200));

      // Detectar usuário
      if (rowString.includes('usuário:') || rowString.includes('colaborador:')) {
        // Extrair nome do usuário
        const userMatch = rowString.match(/usuário:\s*([^-]+?)(?:-|$)/i);
        if (userMatch) {
          currentUser = userMatch[1].trim();
          // Extrair ID do usuário se presente
          const idMatch = rowString.match(/-(\d+)/);
          if (idMatch) {
            currentUserId = idMatch[1];
          }
          console.log(`👤 Usuário detectado: ${currentUser} (ID: ${currentUserId})`);
        }
        continue;
      }

      // Detectar período (ano-mês)
      if (rowString.includes('ano-mês:')) {
        const anoMesMatch = rowString.match(/ano-mês:\s*(\d{4}-\d{2})/i);
        if (anoMesMatch) {
          currentAnoMes = anoMesMatch[1];
          console.log(`📅 Período detectado: ${currentAnoMes}`);
        }
        continue;
      }

      // Pular linhas de cabeçalho de tabela
      if (rowString.includes('cód. un. neg.') && rowString.includes('itens') && rowString.includes('venda')) {
        console.log(`📋 Pulando linha ${i + 1} - cabeçalho de tabela`);
        continue;
      }

      // Pular linhas de totais
      if (rowString.includes('(soma)') || rowString.includes('total usuário')) {
        console.log(`📋 Pulando linha ${i + 1} - linha de totais`);
        continue;
      }

      // Detectar dados de vendas por unidade
      // Procurar por códigos de unidade (1-2 dígitos) que não são datas
      const unidadeMatch = rowValues.find((value, index) => {
        const strValue = value.toString().trim();
        // Verificar se é um código de unidade válido (1-2 dígitos)
        return /^\d{1,2}$/.test(strValue) &&
          !strValue.includes('-') && // Não é uma data
          index < rowValues.length - 3; // Tem espaço para dados seguintes
      });

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

      if (unidadeMatch && currentUser && currentAnoMes) {
        currentUnidade = unidadeMatch.toString().trim();
        console.log(`🏢 Processando unidade ${currentUnidade} para ${currentUser} em ${currentAnoMes}`);

        // Encontrar os dados nas colunas seguintes
        const rowKeys = Object.keys(row);
        const dataIndex = rowKeys.findIndex(key => row[key]?.toString().trim() === currentUnidade);

        if (dataIndex !== -1 && rowKeys.length >= dataIndex + 6) {
          // Extrair dados das colunas seguintes
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
  // Função para normalizar strings (remover acentos, espaços extras, etc.)
  const normalizeString = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  };

  // Função para truncar strings para campos com limite de caracteres
  const truncateString = (str: string, maxLength: number): string => {
    if (!str) return '';
    return str.toString().substring(0, maxLength);
  };

  const parseEstoqueData = (data: any[]): EstoqueData[] => {
    const parsedData: EstoqueData[] = [];
    let currentUnitCode = '';
    let totalLinhas = data.length;
    let linhasProcessadas = 0;
    let linhasPuladas = 0;
    let linhasComErro = 0;
    let linhasVazias = 0;
    let linhasRodape = 0;
    let linhasMetadados = 0;

    console.log('📦 Iniciando parse de dados de estoque...');
    console.log(`📋 Total de linhas lidas da planilha: ${totalLinhas}`);
    console.log('📋 Primeiras 3 linhas para debug:', data.slice(0, 3));

    // Encontrar a linha de cabeçalhos reais - LÓGICA SIMPLIFICADA
    let headerRowIndex = -1;
    let headerRow: any = null;

    // Procurar pela linha que contém os cabeçalhos - MAIS PRECISO
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      const rowValues = Object.values(row).map(v => v?.toString() || '');
      const normalizedRowString = rowValues.map(v => normalizeString(v)).join(' ');

      // Verificar se esta linha contém cabeçalhos de estoque - CRITÉRIOS MAIS ESPECÍFICOS
      const hasEstoqueHeaders = [
        'produto', 'un. neg.', 'estoque', 'curva', 'preco', 'media',
        'classificacao', 'ult.', 'venda', 'compra', 'final', 'dias',
        'necessidade', 'comprar', 'fabricante', 'fornecedor'
      ].some(header => normalizedRowString.includes(header));

      // Verificar se é uma linha de metadados (usuário, impressão, etc.)
      const isMetadataLine = normalizedRowString.includes('usuario:') || 
                            normalizedRowString.includes('impressao:') || 
                            normalizedRowString.includes('unidade de negocio:') ||
                            normalizedRowString.includes('escritorio') ||
                            normalizedRowString.includes('nayara') ||
                            normalizedRowString.includes('faria');

      if (hasEstoqueHeaders && !isMetadataLine) {
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
    const columnMapping: { [key: string]: string } = {};
    Object.keys(headerRow).forEach(key => {
      const headerValue = headerRow[key]?.toString() || '';
      const normalizedHeaderValue = normalizeString(headerValue);
      console.log(`🔍 Processando cabeçalho: "${key}" -> "${headerValue}" (normalizado: "${normalizedHeaderValue}")`);
      
      // Mapeamento correto baseado nas informações fornecidas pelo usuário - USANDO NORMALIZAÇÃO
      if (normalizedHeaderValue.includes('produto')) {
        columnMapping['Produto'] = key;
        console.log(`✅ Mapeado 'Produto' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('un. neg.') && !normalizedHeaderValue.includes('apelido un. neg.')) {
        columnMapping['Un. Neg.'] = key;
        console.log(`✅ Mapeado 'Un. Neg.' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('estoque') && !normalizedHeaderValue.includes('estoque conf.') && !normalizedHeaderValue.includes('estoque final') && !normalizedHeaderValue.includes('estoque dias') && !normalizedHeaderValue.includes('custo x estoque') && !normalizedHeaderValue.includes('*') && !normalizedHeaderValue.includes('(')) {
        columnMapping['Estoque'] = key;
        console.log(`✅ Mapeado 'Estoque' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('estoque final (dias)') || normalizedHeaderValue.includes('estoque final dias')) {
        columnMapping['Estoque Final Dias'] = key;
        console.log(`✅ Mapeado 'Estoque Final Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('estoque (dias)') || normalizedHeaderValue.includes('estoque dias')) {
        columnMapping['Estoque Final Dias'] = key;
        console.log(`✅ Mapeado 'Estoque Final Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('preco venda medio')) {
        columnMapping['Preco Venda Medio'] = key;
        console.log(`✅ Mapeado 'Preco Venda Medio' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('necessidade') && !normalizedHeaderValue.includes('tipo necessidade') && !normalizedHeaderValue.includes('necessidade (dias)') && !normalizedHeaderValue.includes('necessidade qtd') && !normalizedHeaderValue.includes('custo x necessidade')) {
        columnMapping['Necessidade'] = key;
        console.log(`✅ Mapeado 'Necessidade' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('curva qtd')) {
        columnMapping['Curva Qtd'] = key;
        console.log(`✅ Mapeado 'Curva Qtd' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('media venda mensal')) {
        columnMapping['Media Venda Mensal'] = key;
        console.log(`✅ Mapeado 'Media Venda Mensal' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('classificacao principal')) {
        columnMapping['Classificação Principal'] = key;
        console.log(`✅ Mapeado 'Classificação Principal' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('ult. venda (dias)') || normalizedHeaderValue.includes('ult. venda dias')) {
        columnMapping['Ultima Venda Dias'] = key;
        console.log(`✅ Mapeado 'Ultima Venda Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('ult. compra (dias)') || normalizedHeaderValue.includes('ult. compra dias')) {
        columnMapping['Ultima Compra Dias'] = key;
        console.log(`✅ Mapeado 'Ultima Compra Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('apelido un. neg.')) {
        columnMapping['Apelido Unidade'] = key;
        console.log(`✅ Mapeado 'Apelido Unidade' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('media venda diaria')) {
        columnMapping['Media Venda Diaria'] = key;
        console.log(`✅ Mapeado 'Media Venda Diaria' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('qtd. demanda')) {
        columnMapping['Qtd Demanda'] = key;
        console.log(`✅ Mapeado 'Qtd Demanda' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('custo medio')) {
        columnMapping['Custo Medio'] = key;
        console.log(`✅ Mapeado 'Custo Medio' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('estoque conf.')) {
        columnMapping['Estoque Confirmado'] = key;
        console.log(`✅ Mapeado 'Estoque Confirmado' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('comprar') && !normalizedHeaderValue.includes('comprar (dias)')) {
        columnMapping['Comprar'] = key;
        console.log(`✅ Mapeado 'Comprar' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('comprar (dias)')) {
        columnMapping['Comprar Dias'] = key;
        console.log(`✅ Mapeado 'Comprar Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('necessidade (dias)')) {
        columnMapping['Necessidade Dias'] = key;
        console.log(`✅ Mapeado 'Necessidade Dias' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('fornecedor ult. compra')) {
        columnMapping['Fornecedor Ultima Compra'] = key;
        console.log(`✅ Mapeado 'Fornecedor Ultima Compra' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('fabricante')) {
        columnMapping['Fabricante'] = key;
        console.log(`✅ Mapeado 'Fabricante' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('est. min')) {
        columnMapping['Estoque Minimo'] = key;
        console.log(`✅ Mapeado 'Estoque Minimo' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('origem est. min.')) {
        columnMapping['Origem Estoque Minimo'] = key;
        console.log(`✅ Mapeado 'Origem Estoque Minimo' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('dia estocagem')) {
        columnMapping['Dia Estocad'] = key;
        console.log(`✅ Mapeado 'Dia Estocad' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('custo') && !normalizedHeaderValue.includes('custo medio') && !normalizedHeaderValue.includes('custo x')) {
        columnMapping['Custo'] = key;
        console.log(`✅ Mapeado 'Custo' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('curva valor')) {
        columnMapping['Curva Valor'] = key;
        console.log(`✅ Mapeado 'Curva Valor' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('custo x necessidade')) {
        columnMapping['Custo x Necessidade'] = key;
        console.log(`✅ Mapeado 'Custo x Necessidade' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('custo x estoque')) {
        columnMapping['Custo x Estoque'] = key;
        console.log(`✅ Mapeado 'Custo x Estoque' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('ruptura venda')) {
        columnMapping['Ruptura Venda'] = key;
        console.log(`✅ Mapeado 'Ruptura Venda' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('necessidade qtd')) {
        columnMapping['Necessidade Qtd'] = key;
        console.log(`✅ Mapeado 'Necessidade Qtd' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('percentual suprida qtd')) {
        columnMapping['Percentual Suprida Qtd'] = key;
        console.log(`✅ Mapeado 'Percentual Suprida Qtd' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('compra confirmada')) {
        columnMapping['Compra Confirmada'] = key;
        console.log(`✅ Mapeado 'Compra Confirmada' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('encomenda')) {
        columnMapping['Encomenda'] = key;
        console.log(`✅ Mapeado 'Encomenda' para coluna ${key}`);
      } else if (normalizedHeaderValue.includes('transferencia confirmada')) {
        columnMapping['Transferencia Confirmada'] = key;
        console.log(`✅ Mapeado 'Transferencia Confirmada' para coluna ${key}`);
      }
      // Adicionar mais mapeamentos conforme necessário
    });

    // Se não encontrou mapeamentos específicos, tentar mapeamento por posição
    if (Object.keys(columnMapping).length === 0) {
      console.log('⚠️ Nenhum mapeamento específico encontrado, tentando mapeamento por posição...');
      const columnKeys = Object.keys(headerRow);
      
      if (columnKeys.length >= 1) {
        columnMapping['Un. Neg.'] = columnKeys[0];
        console.log(`✅ Mapeado 'Un. Neg.' para primeira coluna: ${columnKeys[0]}`);
      }
      if (columnKeys.length >= 2) {
        columnMapping['Produto'] = columnKeys[1];
        console.log(`✅ Mapeado 'Produto' para segunda coluna: ${columnKeys[1]}`);
      }
      if (columnKeys.length >= 3) {
        columnMapping['Estoque'] = columnKeys[2];
        console.log(`✅ Mapeado 'Estoque' para terceira coluna: ${columnKeys[2]}`);
      }
      if (columnKeys.length >= 4) {
        columnMapping['Curva'] = columnKeys[3];
        console.log(`✅ Mapeado 'Curva' para quarta coluna: ${columnKeys[3]}`);
      }
      if (columnKeys.length >= 5) {
        columnMapping['Preço'] = columnKeys[4];
        console.log(`✅ Mapeado 'Preço' para quinta coluna: ${columnKeys[4]}`);
      }
    }

    // Debug do mapeamento de colunas
    console.log('🔍 Mapeamento final de colunas:', columnMapping);
    console.log('🔍 Todas as colunas disponíveis na planilha:', Object.keys(data[headerRowIndex] || {}));

    // Se não encontrou a coluna Un. Neg., tentar encontrar na primeira coluna
    if (!columnMapping['Un. Neg.']) {
      const firstColumnKey = Object.keys(headerRow)[0];
      if (firstColumnKey) {
        columnMapping['Un. Neg.'] = firstColumnKey;
        console.log(`✅ Usando primeira coluna como 'Un. Neg.': ${firstColumnKey}`);
      }
    }

    // Se não encontrou a coluna Produto, tentar encontrar na segunda coluna
    if (!columnMapping['Produto']) {
      const secondColumnKey = Object.keys(headerRow)[1];
      if (secondColumnKey) {
        columnMapping['Produto'] = secondColumnKey;
        console.log(`✅ Usando segunda coluna como 'Produto': ${secondColumnKey}`);
      }
    }

    // Processar linhas de dados - FILTROS MELHORADOS
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
        linhasVazias++;
        continue;
      }

      // Verificar se é linha de rodapé/resumo - FILTRO SIMPLIFICADO
      const isFooterLine = rowValues.some(value => {
        if (!value) return false;
        const normalizedValue = normalizeString(value.toString());
        
        // Log para debug de rodapé - SEMPRE LOGAR
        if (normalizedValue.includes('registro') || normalizedValue.includes('total') || normalizedValue.includes('22334')) {
          console.log(`🔍 Verificando possível rodapé: "${value}" -> "${normalizedValue}"`);
        }
        
        const isFooter = (
          // Padrões específicos das fotos
          normalizedValue.includes('22334 registro(s)') ||
          normalizedValue.includes('22334 registros') ||
          normalizedValue.includes('registro(s)') ||
          // Outros padrões de rodapé
          normalizedValue.includes('total de produtos') ||
          normalizedValue.includes('total geral') ||
          normalizedValue.includes('soma total') ||
          normalizedValue.includes('registros encontrados') ||
          normalizedValue.includes('produtos encontrados') ||
          normalizedValue.includes('total de itens') ||
          normalizedValue.includes('total de estoque') ||
          normalizedValue.includes('resumo final') ||
          normalizedValue.includes('fim do relatorio')
        );
        
        if (isFooter) {
          console.log(`📄 ENCONTRADO RODAPÉ: "${value}" -> "${normalizedValue}"`);
        }
        
        return isFooter;
      });

      if (isFooterLine) {
        console.log(`📄 Pulando linha ${i + 1} - identificada como rodapé/resumo`);
        linhasRodape++;
        continue;
      }

      // Pular linhas que contêm apenas cabeçalhos do sistema - FILTRO SIMPLIFICADO
      const hasSystemHeader = rowValues.some(value => {
        if (!value) return false;
        const normalizedValue = normalizeString(value.toString());
        
        return (
          // Padrões específicos das fotos
          normalizedValue.includes('unidade de negocio:') ||
          normalizedValue.includes('usuario:') ||
          normalizedValue.includes('impressao:') ||
          normalizedValue.includes('a7 pharma') ||
          normalizedValue.includes('pagina') ||
          normalizedValue.includes('desenvolvimento de software') ||
          normalizedValue.includes('alpha7 desenvolvimento de software') ||
          normalizedValue.includes('http://www.a7.net.br')
        );
      });

      if (hasSystemHeader) {
        console.log(`🏢 Pulando linha ${i + 1} - identificada como cabeçalho do sistema`);
        linhasMetadados++;
        continue;
      }

      // REMOVER FILTRO DE STATUS - ESTÁ FILTRANDO DEMAIS
      // const hasStatusContent = rowValues.some(value => {
      //   if (!value) return false;
      //   const normalizedValue = normalizeString(value.toString());
      //   
      //   return (
      //     normalizedValue.includes('falta:') ||
      //     normalizedValue.includes('excesso:') ||
      //     normalizedValue.includes('confirmado:') ||
      //     normalizedValue.includes('atencao:') ||
      //     normalizedValue.includes('03:') ||
      //     normalizedValue.includes('09:') ||
      //     normalizedValue.includes('02:') ||
      //     normalizedValue.includes('04:') ||
      //     normalizedValue.includes('05:') ||
      //     normalizedValue.includes('06:') ||
      //     normalizedValue.includes('07:') ||
      //     normalizedValue.includes('08:') ||
      //     normalizedValue.includes('10:') ||
      //     normalizedValue.includes('11:') ||
      //     normalizedValue.includes('12:')
      //   );
      // });
      // 
      // if (hasStatusContent) {
      //   console.log(`⚠️ Pulando linha ${i + 1} - conteúdo de status/resumo`);
      //   linhasPuladas++;
      //   continue;
      // }

      // Verificar se é uma linha de cabeçalho de unidade
      const unitCodeMatch = rowValues.find(value =>
        value && value.toString().includes('Cód. Un. Neg.:')
      );

      if (unitCodeMatch) {
        const match = unitCodeMatch.toString().match(/Cód\. Un\. Neg\.:\s*(\d+)/);
        if (match) {
          currentUnitCode = match[1];
          console.log(`🏢 Unidade detectada: ${currentUnitCode}`);
        }
        continue;
      }

              // Mapear dados usando o mapeamento de colunas
        const estoqueItem: EstoqueData = {};

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
                estoqueItem['Estoque'] = parseNumber(value);
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
              case 'Classificação Principal':
                estoqueItem['Classificação Principal'] = value?.toString();
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
              case 'Necessidade':
                estoqueItem['Necessidade'] = value?.toString();
                break;
              case 'Fabricante':
                estoqueItem['Fabricante'] = value?.toString();
                break;
              case 'Curva':
                estoqueItem['Curva'] = value?.toString();
                break;
              case 'Preço':
                estoqueItem['Preço'] = parseNumber(value);
                break;
            }
          });

          // Se não conseguiu mapear por colunas específicas, tentar mapeamento direto
          if (!estoqueItem['Produto'] || !estoqueItem['Un. Neg.']) {
            console.log(`🔍 Tentando mapeamento direto para linha ${i + 1}...`);
            
            // Procurar por produto em qualquer coluna
            for (const columnKey of Object.keys(row)) {
              const cellValue = row[columnKey];
              const cellStr = cellValue?.toString() || '';
              
              // Se não temos produto ainda e encontramos algo que parece um nome de produto
              if (!estoqueItem['Produto'] && cellStr.length > 3 && !cellStr.match(/^\d+$/) && 
                  !cellStr.includes('unidade') && !cellStr.includes('negócio') && 
                  !cellStr.includes('estoque') && !cellStr.includes('curva')) {
                estoqueItem['Produto'] = cellStr;
                console.log(`✅ Produto encontrado por mapeamento direto: ${cellStr}`);
                break;
              }
            }
          }

        // Se não encontrou unidade na coluna específica, procurar em outras colunas
        if (!estoqueItem['Un. Neg.'] || estoqueItem['Un. Neg.'] === '') {
          // Procurar por códigos de unidade em qualquer coluna
          for (const columnKey of Object.keys(row)) {
            const cellValue = row[columnKey];
            const cellStr = cellValue?.toString() || '';

            // Procurar por padrões de código de unidade (números de 1-2 dígitos)
            const unitMatch = cellStr.match(/^(\d{1,2})$/);
            if (unitMatch && !estoqueItem['Un. Neg.']) {
              estoqueItem['Un. Neg.'] = unitMatch[1];
              break;
            }
          }
        }

        // Verificar se temos dados válidos - LÓGICA DETERMINÍSTICA
        if (estoqueItem['Produto'] && estoqueItem['Produto'].toString().trim() !== '') {
          // Validar se é um produto real (não status/resumo) - CRITÉRIOS MAIS PRECISOS
          const produtoStr = normalizeString(estoqueItem['Produto'].toString());
          
          // Log para debug de produtos
          if (produtoStr.includes('22334') || produtoStr.includes('registro')) {
            console.log(`🔍 Verificando produto: "${estoqueItem['Produto']}" -> "${produtoStr}"`);
          }
          
          // Critérios para identificar produtos válidos - FILTRO SIMPLIFICADO
          const isRealProduct = produtoStr.length > 3 && // Nome tem pelo menos 4 caracteres
                               !produtoStr.includes('22334 registro(s)') &&
                               !produtoStr.includes('22334 registros') &&
                               !produtoStr.includes('registro(s)') &&
                               !produtoStr.includes('total de produtos') &&
                               !produtoStr.includes('total geral') &&
                               !produtoStr.includes('soma total') &&
                               !produtoStr.includes('registros encontrados') &&
                               !produtoStr.includes('produtos encontrados') &&
                               !produtoStr.includes('total de itens') &&
                               !produtoStr.includes('total de estoque') &&
                               !produtoStr.includes('resumo final') &&
                               !produtoStr.includes('fim do relatorio') &&
                               !produtoStr.includes('unidade de negocio:') &&
                               !produtoStr.includes('usuario:') &&
                               !produtoStr.includes('impressao:') &&
                               !produtoStr.includes('a7 pharma') &&
                               !produtoStr.includes('pagina') &&
                               !produtoStr.includes('desenvolvimento de software') &&
                               !produtoStr.includes('alpha7 desenvolvimento de software') &&
                               !produtoStr.includes('http://www.a7.net.br') &&
                               !/^\d{1,2}:/.test(produtoStr) && // Não começa com código de unidade
                               !/^\d+$/.test(produtoStr) && // Não é apenas números
                               !produtoStr.match(/^[A-Z\s]+$/); // Não é apenas letras maiúsculas e espaços

          if (isRealProduct) {
            console.log(`✅ Produto válido: "${estoqueItem['Produto']}" -> "${produtoStr}"`);
          } else {
            console.log(`❌ Produto inválido: "${estoqueItem['Produto']}" -> "${produtoStr}"`);
          }

          if (isRealProduct) {
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

            // Verificar se o produto tem informações básicas completas
            const hasBasicInfo = estoqueItem['Produto'] && 
                               estoqueItem['Produto'].toString().trim() !== '' &&
                               estoqueItem['Un. Neg.'] && 
                               estoqueItem['Un. Neg.'].toString().trim() !== '';

            if (hasBasicInfo) {
              parsedData.push(estoqueItem);
              linhasProcessadas++;
              
              if (linhasProcessadas <= 10) {
                console.log(`✅ Registro processado: ${estoqueItem['Produto']} - Unidade: ${estoqueItem['Un. Neg.']} - Estoque: ${estoqueItem['Estoque']}`);
              }
            } else {
              linhasPuladas++;
              if (linhasPuladas <= 10) {
                console.log(`⚠️ Linha ${i + 1} ignorada - informações básicas incompletas: Produto="${estoqueItem['Produto']}" Unidade="${estoqueItem['Un. Neg.']}"`);
              }
            }
          } else {
            linhasPuladas++;
            if (linhasPuladas <= 10) {
              console.log(`⚠️ Linha ${i + 1} ignorada - produto não válido: ${estoqueItem['Produto']}`);
            }
          }
        } else {
          linhasPuladas++;
          if (linhasPuladas <= 10) {
            console.log(`⚠️ Linha ${i + 1} ignorada - sem nome de produto válido`);
            console.log(`🔍 Conteúdo da linha:`, row);
          }
        }
      } catch (error) {
        linhasComErro++;
        console.log(`❌ Erro ao processar linha ${i + 1}:`, error);
      }
    }

    // Ordenação determinística para garantir resultados consistentes
    parsedData.sort((a, b) => {
      // Primeiro por unidade
      const unidadeA = (a['Un. Neg.'] || '').toString();
      const unidadeB = (b['Un. Neg.'] || '').toString();
      if (unidadeA !== unidadeB) {
        return unidadeA.localeCompare(unidadeB);
      }
      
      // Depois por produto
      const produtoA = (a['Produto'] || '').toString();
      const produtoB = (b['Produto'] || '').toString();
      return produtoA.localeCompare(produtoB);
    });

    // Logs detalhados de estatísticas
    console.log(`📊 RESUMO DETALHADO DO PROCESSAMENTO:`);
    console.log(`  📋 Total de linhas lidas da planilha: ${totalLinhas}`);
    console.log(`  ✅ Linhas processadas com sucesso: ${linhasProcessadas}`);
    console.log(`  ⚠️ Linhas puladas (status/resumo): ${linhasPuladas}`);
    console.log(`  ❌ Linhas com erro: ${linhasComErro}`);
    console.log(`  🔲 Linhas vazias: ${linhasVazias}`);
    console.log(`  📄 Linhas de rodapé/resumo: ${linhasRodape}`);
    console.log(`  🏢 Linhas de metadados: ${linhasMetadados}`);
    console.log(`  📦 Total de registros válidos processados: ${parsedData.length}`);
    console.log(`  📈 Taxa de aproveitamento: ${((parsedData.length / totalLinhas) * 100).toFixed(2)}%`);
    
    // Verificar se há variação nos resultados
    if (parsedData.length < totalLinhas * 0.1) {
      console.warn(`⚠️ ATENÇÃO: Apenas ${parsedData.length} de ${totalLinhas} linhas foram processadas!`);
      console.warn(`⚠️ Verifique se os filtros não estão muito restritivos.`);
    }
    
    console.log(`🔄 Ordenação determinística aplicada - resultados serão sempre consistentes`);
    
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

    console.log('🔍 Iniciando parse de dados de faturamento...');
    console.log('📋 Total de linhas:', data.length);
    console.log('📋 Primeiras 3 linhas:', data.slice(0, 3));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`🔍 Processando linha ${i + 1}:`, row);

      // Verificar se é uma linha de cabeçalho de unidade
      // Pode estar em qualquer coluna, então vamos verificar todas
      const unitCodeMatch = Object.values(row).find(value =>
        value && value.toString().includes('Cód. Un. Neg.:')
      );

      if (unitCodeMatch) {
        console.log(`✅ Encontrado código de unidade: ${unitCodeMatch}`);
        const match = unitCodeMatch.toString().match(/Cód\. Un\. Neg\.:\s*(\d+)/);
        if (match) {
          currentUnitCode = match[1];
          console.log(`✅ Código de unidade extraído: ${currentUnitCode}`);
        }
        continue;
      }

      // Verificar se é uma linha de dados válida (tem ano-mês)
      // Mapear colunas __EMPTY para os nomes corretos
      let anoMes = row['__EMPTY'] || row['Ano-mês'];
      console.log(`🔍 Tentando encontrar ano-mês: __EMPTY=${row['__EMPTY']}, Ano-mês=${row['Ano-mês']}`);

      // Se não encontrou, verificar se a primeira chave é uma data (Page 2)
      if (!anoMes) {
        const firstKey = Object.keys(row)[0];
        console.log(`🔍 Primeira chave: ${firstKey}`);
        if (firstKey && firstKey.toString().match(/^\d{4}-\d{2}$/)) {
          // Na Page 2, usar o VALOR da primeira coluna como data
          anoMes = row[firstKey];
          console.log(`🔍 Encontrado ano-mês na primeira chave: ${anoMes}`);
        }
      }

      // Se não encontrou na coluna padrão, procurar em outras colunas
      if (!anoMes) {
        console.log(`🔍 Procurando ano-mês em outras colunas...`);
        // Procurar por colunas que contêm datas no formato YYYY-MM
        const dateColumns = Object.keys(row).filter(key =>
          key && key.toString().match(/^\d{4}-\d{2}$/)
        );
        console.log(`🔍 Colunas com data encontradas:`, dateColumns);
        if (dateColumns.length > 0) {
          // Na Page 2, TODAS as linhas são dados reais
          // O VALOR da primeira coluna é a data real de cada linha
          anoMes = row[dateColumns[0]];
          console.log(`🔍 Encontrado ano-mês em coluna de data: ${anoMes}`);
        } else {
          // Se não encontrou colunas com data, verificar se a primeira chave é uma data
          const firstKey = Object.keys(row)[0];
          console.log(`🔍 Primeira chave como possível data: ${firstKey}`);
          if (firstKey && firstKey.toString().match(/^\d{4}-\d{2}$/)) {
            // A primeira chave é uma data, usar ela diretamente
            anoMes = firstKey;
            console.log(`🔍 Usando primeira chave como data: ${anoMes}`);
          }
        }
      }

      // Se ainda não encontrou ano-mês, pular a linha
      if (!anoMes) {
        console.log(`⚠️ Linha ${i + 1} ignorada - sem ano-mês válido`);
        continue;
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
        console.log(`✅ Encontrado ano-mês válido: ${anoMes}`);
        // Verificar se temos uma unidade válida
        if (!currentUnitCode) {
          console.log(`⚠️ Linha ${i + 1} ignorada - sem código de unidade`);
          continue;
        }

        // Verificar se já processamos esta combinação de data e unidade
        const key = `${currentUnitCode}-${anoMes}`;
        if (processedKeys.has(key)) {
          console.log(`⚠️ Linha ${i + 1} ignorada - combinação já processada: ${key}`);
          continue; // Pular se já processamos esta combinação
        }
        processedKeys.add(key);
        console.log(`✅ Processando linha ${i + 1} - unidade: ${currentUnitCode}, data: ${anoMes}`);

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

        console.log(`✅ Dados processados com sucesso:`, {
          'Ano-mês': faturamentoItem['Ano-mês'],
          'Itens': faturamentoItem['Itens'],
          'Venda': faturamentoItem['Venda'],
          'Cód. Un. Neg.': currentUnitCode
        });

        parsedData.push(faturamentoItem);
      }
    }

    console.log(`📊 Resumo do processamento: ${parsedData.length} registros processados`);
    console.log(`📊 Código de unidade final: ${currentUnitCode}`);
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
    
    // CORREÇÃO: Adicionar mapeamento flexível para códigos com zeros à esquerda
    unidades?.forEach((u: any) => {
      const codigo = u.codigo;
      // Adicionar versões com e sem zero à esquerda
      if (codigo.length === 1) {
        unidadesMap.set(`0${codigo}`, u.id); // "2" -> "02"
      } else if (codigo.length === 2 && codigo.startsWith('0')) {
        unidadesMap.set(codigo.substring(1), u.id); // "02" -> "2"
      }
    });

    // ADICIONAR MAPEAMENTO TEMPORÁRIO PARA UNIDADE "1"
    if (!unidadesMap.has('1')) {
      console.log('🔄 Adicionando mapeamento temporário para unidade "1" -> ID 2');
      unidadesMap.set('1', 2); // Mapear unidade "1" para ID 2 temporariamente
    }

    console.log('🏢 Mapeamento de unidades por código (expandido):', Array.from(unidadesMap.entries()));

    // Inserir dados de estoque
    const estoqueToInsert = [];
    const unidadesEncontradas = new Set();
    const unidadesNaoEncontradas = new Set();

    // Gerar data de estocagem e ano_mes baseado na data atual
    const hoje = new Date();
    const dataEstocagem = hoje.toISOString().split('T')[0];
    const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

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
        
        // CORREÇÃO: Tentar encontrar unidade por código numérico
        const codigoNumerico = parseInt(unidadeCode, 10);
        if (!isNaN(codigoNumerico)) {
          // Procurar por unidade com código numérico
          const unidadeEncontrada = unidades?.find((u: any) => parseInt(u.codigo, 10) === codigoNumerico);
          if (unidadeEncontrada) {
            console.log(`✅ Unidade encontrada por código numérico: ${unidadeCode} -> ID: ${unidadeEncontrada.id}`);
            unidadesEncontradas.add(unidadeCode);
            // Continuar com o processamento usando a unidade encontrada
            const estoqueItem = {
              unidade_id: unidadeEncontrada.id,
              produto_nome: item['Produto'],
              fabricante: item['Fabricante'] || 'N/A',
              quantidade: item['Estoque'] || 0,
              valor_estoque: item['Preco Venda Medio'] || 0,
              dias_estoque: item['Estoque Final Dias'] || 0,
              data_atualizacao: dataEstocagem,
              data_estocagem: dataEstocagem,
              ano_mes: anoMes,
              necessidade: item['Necessidade'] || 'NORMAL',
              estoque_confirmado: item['Estoque Confirmado'] || item['Estoque'] || 0,
              comprar: item['Comprar'] || 0,
              curva_qtd: truncateString(item['Curva Qtd'] || 'C', 10),
              media_venda_mensal: item['Media Venda Mensal'] || 0,
              estoque_final_dias: item['Estoque Final Dias'] || 0,
              classificacao_principal: item['Classificação Principal'] || 'MÉDIO',
              preco_venda_medio: item['Preco Venda Medio'] || 0,
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
              custo_medio: item['Custo Medio'] || 0,
              curva_valor: truncateString(item['Curva Valor'] || 'C', 10),
              custo_x_necessidade: item['Custo x Necessidade'] || 0,
              custo_x_estoque: item['Custo x Estoque'] || 0,
              ruptura_venda: item['Ruptura Venda'] || 0,
              necessidade_qtd: item['Necessidade Qtd'] || 0,
              percentual_suprida_qtd: item['Percentual Suprida Qtd'] || 0,
              compra_confirmada: item['Compra Confirmada'] || 0,
              encomenda: item['Encomenda'] || 0
            };
            estoqueToInsert.push(estoqueItem);
            continue;
          } else {
            console.log(`❌ Unidade não encontrada mesmo por código numérico: ${unidadeCode}`);
            console.log(`🔍 Unidades disponíveis:`, unidades?.map((u: any) => ({ id: u.id, codigo: u.codigo, nome: u.nome })));
            
            // SOLUÇÃO TEMPORÁRIA: Mapear unidade "1" para unidade "2" (ID: 2)
            if (unidadeCode === '1') {
              console.log(`🔄 Mapeando unidade "1" para unidade "2" (ID: 2) temporariamente`);
              const estoqueItem = {
                unidade_id: 2, // Usar ID da unidade 2
              produto_nome: item['Produto'],
              fabricante: item['Fabricante'] || 'N/A',
              quantidade: item['Estoque'] || 0,
              valor_estoque: item['Preco Venda Medio'] || 0,
              dias_estoque: item['Estoque Final Dias'] || 0,
              data_atualizacao: dataEstocagem,
              data_estocagem: dataEstocagem,
              ano_mes: anoMes,
              necessidade: item['Necessidade'] || 'NORMAL',
              estoque_confirmado: item['Estoque Confirmado'] || item['Estoque'] || 0,
              comprar: item['Comprar'] || 0,
              curva_qtd: truncateString(item['Curva Qtd'] || 'C', 10),
              media_venda_mensal: item['Media Venda Mensal'] || 0,
              estoque_final_dias: item['Estoque Final Dias'] || 0,
              classificacao_principal: item['Classificação Principal'] || 'MÉDIO',
              preco_venda_medio: item['Preco Venda Medio'] || 0,
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
              custo_medio: item['Custo Medio'] || 0,
              curva_valor: truncateString(item['Curva Valor'] || 'C', 10),
              custo_x_necessidade: item['Custo x Necessidade'] || 0,
              custo_x_estoque: item['Custo x Estoque'] || 0,
              ruptura_venda: item['Ruptura Venda'] || 0,
              necessidade_qtd: item['Necessidade Qtd'] || 0,
              percentual_suprida_qtd: item['Percentual Suprida Qtd'] || 0,
              compra_confirmada: item['Compra Confirmada'] || 0,
              encomenda: item['Encomenda'] || 0
            };
            estoqueToInsert.push(estoqueItem);
            unidadesEncontradas.add(unidadeCode);
            continue;
          }
        }
        }
        continue;
      }

      if (!item['Produto']) {
        continue;
      }

      // Debug da coluna Classificação Principal
      console.log(`🔍 Debug - Classificação Principal para ${item['Produto']}:`, {
        'Valor bruto': item['Classificação Principal'],
        'Tipo': typeof item['Classificação Principal'],
        'É falsy?': !item['Classificação Principal'],
        'Valor final': item['Classificação Principal'] || 'MÉDIO'
      });

      const estoqueItem = {
        unidade_id: unidadeId,
        produto_nome: item['Produto'],
        fabricante: item['Curva'] || 'N/A',
        quantidade: item['Estoque'] || 0,
        valor_estoque: item['Preço'] || 0, // Preço unitário apenas
        dias_estoque: item['Estoque Final Dias'] || item['Dia Estocad'] || item['Estoque Classific'] || 0,
        data_atualizacao: dataEstocagem,
        data_estocagem: dataEstocagem,
        ano_mes: anoMes,
        necessidade: item['Necessidade'] || 'NORMAL',
        estoque_confirmado: item['Estoque Confirmado'] || item['Estoque'] || 0,
        comprar: item['Comprar'] || 0,
        curva_qtd: truncateString(item['Curva Qtd'] || item['Curva'] || 'C', 10),
        media_venda_mensal: item['Media Venda Mensal'] || item['Media Venda'] || 0,
        estoque_final_dias: item['Estoque Final Dias'] || item['Estoque Final'] || 0,
        classificacao_principal: item['Classificação Principal'] || 'MÉDIO',
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
        curva_valor: truncateString(item['Curva Valor'] || item['Curva'] || 'C', 10),
        custo_x_necessidade: item['Custo x Necessidade'] || 0,
        custo_x_estoque: item['Custo x Estoque'] || 0,
        ruptura_venda: item['Ruptura Venda'] || 0,
        necessidade_qtd: item['Necessidade Qtd'] || 0,
        percentual_suprida_qtd: item['Percentual Suprida Qtd'] || item['% Sunrida'] || 0,
        compra_confirmada: item['Compra Confirmada'] || 0,
        encomenda: item['Encomenda'] || 0
      };

      // Log para debug dos campos de dias no estoque
      console.log(`🔍 Debug - Dias no estoque para ${item['Produto']}:`, {
        'Estoque Final Dias': item['Estoque Final Dias'],
        'Dia Estocad': item['Dia Estocad'],
        'Estoque Classific': item['Estoque Classific'],
        'Valor Final': item['Estoque Final Dias'] || item['Dia Estocad'] || item['Estoque Classific'] || 0
      });

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
      console.log('📁 Arquivo selecionado:', file?.name, file?.type);

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

          // Detectar tipo da planilha (usando também o nome da aba)
          const sheetType = detectSheetType(jsonData, sheetName);

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
              Arquivo selecionado: {file?.name}
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
          <div className={`rounded-md p-4 ${result?.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-center">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <p className={result?.success ? 'text-green-700' : 'text-red-700'}>
                {result?.message}
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

  // ⚠️ FUNÇÃO TEMPORÁRIA - REMOVER APÓS USO ⚠️
  // Função para limpar completamente a tabela estoque_2
  const limparEstoque2Temporariamente = async () => {
    try {
      console.log('🔄 Iniciando limpeza da tabela estoque_2...');
      
      const { error } = await supabase
        .from('estoque_2')
        .delete()
        .neq('id', 0); // Deleta todos os registros (id nunca é 0)
      
      if (error) {
        console.error('❌ Erro ao limpar estoque_2:', error);
        alert(`Erro ao limpar tabela: ${error.message}`);
        return;
      }
      
      console.log('✅ Tabela estoque_2 limpa com sucesso!');
      alert('✅ Tabela estoque_2 foi limpa completamente!');
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      alert(`Erro inesperado: ${error}`);
    }
  };

  // Expor a função temporariamente no window para acesso via console
  (window as any).limparEstoque2Temporariamente = limparEstoque2Temporariamente;

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
              Arquivo selecionado: {file?.name}
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
          <div className={`rounded-md p-4 ${result?.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-center">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <p className={result?.success ? 'text-green-700' : 'text-red-700'}>
                {result?.message}
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