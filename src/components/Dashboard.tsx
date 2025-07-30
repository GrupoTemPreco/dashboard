import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, TooltipItem } from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import {
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Users,
  BarChart3,
  Plus,
  Info,
  Settings,
  User,
  Upload,
  X,
  Filter,
  X as XIcon,
  Package as PackageIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChartCard from './ChartCard';
import ExcelImporter from './ExcelImporter';
import DashboardFilters from './DashboardFilters';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { DashboardFilters as FilterType, Faturamento, Estoque2, Unidade, Colaborador, VendaItem } from '../types';
import '../styles/dashboard.css';

interface ColaboradorMetricsAcumulador {
  user_name: string;
  user_id: string;
  unidade_negocio: number;
  total_venda: number;
  total_itens: number;
  ticket_medio: number;
}

interface LojaMetricsAcumulador {
  loja_id: string;
  total_venda: number;
  total_itens: number;
  ticket_medio: number;
}

interface LojaMargemBrutaAcumulador {
  loja_id: string;
  total_venda: number;
  total_custo: number;
  margem_bruta: number;
}

interface ProdutoAgrupado {
  produto_nome: string;
  fabricante: string;
  quantidade: number;
  valor_estoque: number;
  dias_estoque: number;
  ultima_venda_dias: number;
  ultima_compra_dias: number;
  count: number;
}

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterType>({
    periodo: 'all',
    unidade: 'all',
    categoria: 'all',
    searchCollaborator: ''
  });

  const [faturamento, setFaturamento] = useState<Faturamento[]>([]);
  const [estoque, setEstoque] = useState<Estoque2[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // @ts-expect-error
  const [estoqueViewType, setEstoqueViewType] = useState<'bars' | 'list'>('bars');
  const [activeDashboard, setActiveDashboard] = useState<'geral' | 'colaboradores'>('geral');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [searchCollaborator, setSearchCollaborator] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchEstoque, setSearchEstoque] = useState('');
  const [debouncedSearchEstoque, setDebouncedSearchEstoque] = useState('');
  const [showFaturamentoChart, setShowFaturamentoChart] = useState(false);
  const [showCMVChart, setShowCMVChart] = useState(false);
  const [cmvModalPeriodo, setCmvModalPeriodo] = useState('all');
  const [faturamentoModalPeriodo, setFaturamentoModalPeriodo] = useState('all');
  // Adicionar estados auxiliares para o dropdown customizado
  const [faturamentoModalLojasSelecionadas, setFaturamentoModalLojasSelecionadas] = useState<string[]>([]);
  const [dropdownLojasAberto, setDropdownLojasAberto] = useState(false);
  // Estados para o modal de CMV com filtros de checkbox
  const [cmvModalLojasSelecionadas, setCmvModalLojasSelecionadas] = useState<string[]>([]);
  const [dropdownCmvLojasAberto, setDropdownCmvLojasAberto] = useState(false);
  // Estados para o modal de Margem Bruta com filtros de checkbox
  const [showMargemBrutaChart, setShowMargemBrutaChart] = useState(false);
  const [margemBrutaModalPeriodo, setMargemBrutaModalPeriodo] = useState('all');
  const [margemBrutaModalLojasSelecionadas, setMargemBrutaModalLojasSelecionadas] = useState<string[]>([]);
  const [dropdownMargemBrutaLojasAberto, setDropdownMargemBrutaLojasAberto] = useState(false);
  // Estado para alternar entre Ticket Médio e Quantidade de Vendas (removido pois não é usado)
  // const [showQuantidadeVendas, setShowQuantidadeVendas] = useState(false);
  const [showColaboradoresModal, setShowColaboradoresModal] = useState(false);
  // @ts-expect-error
  const [colabModalPeriodo, setColabModalPeriodo] = useState('all');
  const [colabModalLojasSelecionadas, setColabModalLojasSelecionadas] = useState<string[]>([]);
  const [dropdownColabLojasAberto, setDropdownColabLojasAberto] = useState(false);
  const [showColaboradoresListModal, setShowColaboradoresListModal] = useState(false);
  const [colaboradoresListSearch, setColaboradoresListSearch] = useState('');
  const [colaboradoresListLojaFilter, setColaboradoresListLojaFilter] = useState('all');
  const [showColaboradorDetailsModal, setShowColaboradorDetailsModal] = useState(false);
  const [selectedColaboradorDetails, setSelectedColaboradorDetails] = useState<Colaborador | null>(null);
  const [colaboradorDetailsPeriodoFilter, setColaboradorDetailsPeriodoFilter] = useState('all');
  const [colaboradorDetailsViewType, setColaboradorDetailsViewType] = useState<'cards' | 'chart'>('cards');
  const [showQuantidadeVendasModal, setShowQuantidadeVendasModal] = useState(false);
  const [showQuantidadeVendasModalView, setShowQuantidadeVendasModalView] = useState(false);
  const [showDiasEstoqueModal, setShowDiasEstoqueModal] = useState(false);
  const [showMaiorTempoEstoqueModal, setShowMaiorTempoEstoqueModal] = useState(false);
  // @ts-expect-error
  const [vendasProdutoSelecionado, setVendasProdutoSelecionado] = useState<VendaItem[]>([]);
  // @ts-expect-error
  const [loadingVendasProduto, setLoadingVendasProduto] = useState(false);
  
  // Estados para o modal de detalhes do produto
  const [showProdutoDetalhesModal, setShowProdutoDetalhesModal] = useState(false);
  const [produtoSelecionadoDetalhes, setProdutoSelecionadoDetalhes] = useState<Estoque2 | null>(null);

  // Estados para modais de ajuda
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpModalType, setHelpModalType] = useState<'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores' | 'diasEstoque' | 'estoque' | 'maiorTempoEstoque' | 'totalColaboradores' | 'ticketMedio'>('faturamento');

  // Estados para paginação centralizada
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [estoquePagination, setEstoquePagination] = useState<{
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 200
  });

  // Estados para controle de hover nas legendas
  const [hoveredFaturamentoIndex, setHoveredFaturamentoIndex] = useState<number | null>(null);
  const [hoveredCmvIndex, setHoveredCmvIndex] = useState<number | null>(null);
  const [hoveredMargemBrutaIndex, setHoveredMargemBrutaIndex] = useState<number | null>(null);
  const [hoveredColaboradoresIndex, setHoveredColaboradoresIndex] = useState<number | null>(null);

  const { loading, error, fetchFaturamento, fetchEstoque, fetchUnidades, fetchCMV, fetchColaboradores } = useSupabase();

  // Componente de Paginação
  const TotalItemsDisplay = ({ totalItems }: { totalItems: number }) => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        fontSize: '14px',
        color: '#64748b',
        fontWeight: '500'
      }}>
        <span>📊 Total de itens: {totalItems.toLocaleString('pt-BR')}</span>
      </div>
    );
  };

  // Paleta de cores mais distinta e contrastante para os gráficos
  const getChartColors = () => [
    '#1f77b4', // azul escuro
    '#ff7f0e', // laranja vibrante
    '#2ca02c', // verde escuro
    '#d62728', // vermelho escuro
    '#9467bd', // roxo
    '#8c564b', // marrom
    '#e377c2', // rosa
    '#7f7f7f', // cinza
    '#bcbd22', // verde-amarelo
    '#17becf', // ciano
    '#ff9896', // rosa claro
    '#98df8a', // verde claro
    '#ffbb78', // laranja claro
    '#aec7e8', // azul claro
    '#c5b0d5', // roxo claro
  ];

  // Função para mapear nomes das lojas para códigos
  const getLojaCode = (nome: string): string => {
    const lojaMap: { [key: string]: string } = {
      'FARMACIA MONTE CASTELO J.G': 'Loja 02',
      'DROGARIA MAIS EM CONTA FARIA': 'Loja 03',
      'DROGARIA MAIS EM CONTA DA FIGUEIRA': 'Loja 04',
      'DROGARIA MAIS EM CONTA DA FIGUEIRA LTDA': 'Loja 04',
      'FARMACIA MONTE CASTELO V.B': 'Loja 06',
      'FARMACIA MONTE CASTELO V.M': 'Loja 07',
      'DROGARIA ULTRA XBROTHERS - PRIMAVERA': 'Loja 08',
      'DROGARIA ULTRA XBROTHERS - VASCO': 'Loja 09',
      'DROGARIA ULTRA XBROTHERS - PENHA': 'Loja 10'
    };

    // Verificar se o nome exato existe no mapeamento
    if (lojaMap[nome]) {
      return lojaMap[nome];
    }

    // Verificar se o nome contém "FIGUEIRA" e mapear para Loja 04
    if (nome.includes('FIGUEIRA')) {
      return 'Loja 04';
    }

    // Se não encontrar o mapeamento, retorna o nome original
    return nome;
  };

  // Função para obter o ID da unidade baseado no nome

  // Função para obter o nome da unidade baseado no ID
  const getUnidadeNameById = useCallback((id: number): string => {
    const unidade = unidades.find(u => u.id === id);
    return unidade ? unidade.nome : 'Loja Desconhecida';
  }, [unidades]);

  // Estados para dados completos dos modais (sem filtros)
  const [modalFaturamentoData, setModalFaturamentoData] = useState<Faturamento[]>([]);
  const [modalCmvData, setModalCmvData] = useState<Faturamento[]>([]);
  // @ts-expect-error
  const [modalColaboradoresData, setModalColaboradoresData] = useState<Colaborador[]>([]);

  const loadData = useCallback(async () => {
    console.log('🔄 Carregando dados com filtros:', filters);
    console.log('🔍 Filtro unidade no loadData:', filters.unidade);
    console.log('🔍 Tipo do filtro unidade no loadData:', typeof filters.unidade);
    
    // Adicionar parâmetros de paginação aos filtros
    const filtersWithPagination = {
      ...filters,
      page: currentPage,
      pageSize: itemsPerPage,
      search: debouncedSearchEstoque
    };
    
    console.log('🔍 FiltersWithPagination:', filtersWithPagination);
    
    const [faturamentoData, estoqueResult, unidadesData, , colaboradoresData] = await Promise.all([
      fetchFaturamento(filters),
      fetchEstoque(filtersWithPagination), // Usar fetchEstoque com paginação
      fetchUnidades(),
      fetchCMV(filters),
      fetchColaboradores(filters)
    ]);

    // --- FILTRO DE CATEGORIA ---
    // Filtro de categoria implementado - os dados já vêm filtrados do backend
    const faturamentoFiltrado = faturamentoData;
    const estoqueFiltrado = estoqueResult.data || [];
    const colaboradoresFiltrado = colaboradoresData;
    // --- FIM FILTRO DE CATEGORIA ---

    console.log('📊 Dados carregados - faturamento:', faturamentoFiltrado.length, 'estoque:', estoqueFiltrado.length);
    console.log('📊 Paginação - página atual:', estoqueResult.currentPage, 'de', estoqueResult.totalPages, 'total:', estoqueResult.totalCount);
    console.log('🔍 Primeiros 3 itens do estoque filtrado:', estoqueFiltrado.slice(0, 3).map(item => ({
      id: item.id,
      produto_nome: item.produto_nome,
      unidade_id: item.unidade_id,
      quantidade: item.quantidade
    })));
    
    setFaturamento(faturamentoFiltrado);
    setEstoque(estoqueFiltrado);
    setUnidades(unidadesData);
    setColaboradores(colaboradoresFiltrado);
    
    // Atualizar informações de paginação se necessário
    if (estoqueResult.totalCount > 0) {
      console.log('📊 Atualizando informações de paginação:', {
        totalCount: estoqueResult.totalCount,
        totalPages: estoqueResult.totalPages,
        currentPage: estoqueResult.currentPage,
        pageSize: estoqueResult.pageSize
      });
      
      setEstoquePagination({
        totalCount: estoqueResult.totalCount,
        totalPages: estoqueResult.totalPages,
        currentPage: estoqueResult.currentPage,
        pageSize: estoqueResult.pageSize
      });
    }
  }, [filters, currentPage, itemsPerPage, debouncedSearchEstoque, fetchFaturamento, fetchEstoque, fetchUnidades, fetchCMV, fetchColaboradores]);

  // Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchEstoque(searchEstoque);
    }, 1000); // 1 segundo de delay para terminar de escrever

    return () => clearTimeout(timer);
  }, [searchEstoque]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recarregar dados quando os filtros mudarem
  useEffect(() => {
    console.log('🔍 Filtro mudou - periodo:', filters.periodo, 'unidade:', filters.unidade);
    loadData();
    // Sincronizar selectedMonth com o filtro de período
    if (filters.periodo && filters.periodo !== 'all') {
      console.log('📅 Definindo selectedMonth como:', filters.periodo);
      setSelectedMonth(filters.periodo);
    } else {
      console.log('📅 Limpando selectedMonth');
      setSelectedMonth(null);
    }
  }, [filters.periodo, filters.unidade, loadData]);

  // Resetar filtro se o período selecionado não existir nos dados ou for de 2024
  // (Movido para depois da declaração de availablePeriods e handleFiltersChange)

  useEffect(() => {
    // Se o produto selecionado não existe no filtro atual, limpa a seleção
    if (selectedProduct) {
      const existe = estoque.some(item =>
        item.produto_nome === selectedProduct &&
        (!selectedMonth || item.ano_mes === selectedMonth) &&
        (filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade))
      );
      if (!existe) setSelectedProduct(null);
    }
  }, [selectedMonth, filters.unidade, estoque, selectedProduct]);

  const handleImportComplete = () => {
    setShowImportModal(false);
    loadData(); // Recarregar dados após importação
  };

  // Função para carregar dados completos para os modais (sem filtros)
  const loadModalData = async () => {
    console.log('🔄 Carregando dados completos para os modais (INDEPENDENTE dos filtros principais)');

    // IMPORTANTE: Sempre buscar dados completos, independente dos filtros principais do dashboard
    const [faturamentoData, cmvData, colaboradoresData] = await Promise.all([
      fetchFaturamento({ periodo: 'all', unidade: 'all', categoria: 'all' }),
      fetchCMV({ periodo: 'all', unidade: 'all', categoria: 'all' }),
      fetchColaboradores({ periodo: 'all', unidade: 'all', categoria: 'all' })
    ]);

    setModalFaturamentoData(faturamentoData);
    setModalCmvData(cmvData);
    setModalColaboradoresData(colaboradoresData);
    console.log('📊 Dados dos modais carregados - faturamento:', faturamentoData.length, 'cmv:', cmvData.length, 'colaboradores:', colaboradoresData.length);
  };

  // Função para resetar filtros dos modais para valores padrão
  const resetModalFilters = async (modalType: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores') => {
    console.log(`🔄 Resetando filtros do modal ${modalType} para valores padrão`);

    // Carregar dados completos para os modais se ainda não foram carregados
    if (modalFaturamentoData.length === 0) {
      await loadModalData();
    }

    switch (modalType) {
      case 'faturamento':
        setFaturamentoModalPeriodo('all');
        setFaturamentoModalLojasSelecionadas([]);
        break;
      case 'cmv':
        setCmvModalPeriodo('all');
        setCmvModalLojasSelecionadas([]);
        break;
      case 'margemBruta':
        setMargemBrutaModalPeriodo('all');
        setMargemBrutaModalLojasSelecionadas([]);
        break;
      case 'colaboradores':
        setColabModalPeriodo('all');
        setColabModalLojasSelecionadas([]);
        break;
    }
  };

  // Funções auxiliares para gerenciar checkboxes dos modais
  const handleSelectAllLojas = (modalType: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores', checked: boolean) => {
    const todasLojasIds = unidades.map(loja => String(loja.id));

    switch (modalType) {
      case 'faturamento':
        setFaturamentoModalLojasSelecionadas(checked ? todasLojasIds : []);
        break;
      case 'cmv':
        setCmvModalLojasSelecionadas(checked ? todasLojasIds : []);
        break;
      case 'margemBruta':
        setMargemBrutaModalLojasSelecionadas(checked ? todasLojasIds : []);
        break;
      case 'colaboradores':
        setColabModalLojasSelecionadas(checked ? todasLojasIds : []);
        break;
    }
  };

  const handleSelectLoja = (modalType: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores', lojaId: string, checked: boolean) => {
    switch (modalType) {
      case 'faturamento':
        setFaturamentoModalLojasSelecionadas(prev => {
          if (checked) {
            const novo = [...prev, lojaId];
            // Se todas as lojas estão selecionadas, retorna todas
            return novo.length === unidades.length ? unidades.map(l => String(l.id)) : novo;
          } else {
            return prev.filter(id => id !== lojaId);
          }
        });
        break;
      case 'cmv':
        setCmvModalLojasSelecionadas(prev => {
          if (checked) {
            const novo = [...prev, lojaId];
            return novo.length === unidades.length ? unidades.map(l => String(l.id)) : novo;
          } else {
            return prev.filter(id => id !== lojaId);
          }
        });
        break;
      case 'margemBruta':
        setMargemBrutaModalLojasSelecionadas(prev => {
          if (checked) {
            const novo = [...prev, lojaId];
            return novo.length === unidades.length ? unidades.map(l => String(l.id)) : novo;
          } else {
            return prev.filter(id => id !== lojaId);
          }
        });
        break;
      case 'colaboradores':
        setColabModalLojasSelecionadas(prev => {
          if (checked) {
            const novo = [...prev, lojaId];
            return novo.length === unidades.length ? unidades.map(l => String(l.id)) : novo;
          } else {
            return prev.filter(id => id !== lojaId);
          }
        });
        break;
    }
  };

  const getLojasSelecionadas = (modalType: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores') => {
    switch (modalType) {
      case 'faturamento':
        return faturamentoModalLojasSelecionadas;
      case 'cmv':
        return cmvModalLojasSelecionadas;
      case 'margemBruta':
        return margemBrutaModalLojasSelecionadas;
      case 'colaboradores':
        return colabModalLojasSelecionadas;
      default:
        return [];
    }
  };

  // Função para lidar com clique no gráfico de faturamento
  const handleFaturamentoBarClick = (mes: string) => {
    console.log('📊 Clique no gráfico de faturamento:', mes);
    const novoMes = selectedMonth === mes ? null : mes;
    setSelectedMonth(novoMes);

    // Sincronizar com o filtro de período
    handleFiltersChange({
      ...filters,
      periodo: novoMes || 'all'
    });
  };

  // Função para limpar seleção
  const clearSelection = () => {
    console.log('🧹 Limpando seleção');
    setSelectedMonth(null);
    // Também limpar o filtro de período
    handleFiltersChange({
      ...filters,
      periodo: 'all'
    });
  };

  // Função para lidar com clique no colaborador
  const handleCollaboratorClick = (collaboratorId: string) => {
    setSelectedCollaborator(selectedCollaborator === collaboratorId ? null : collaboratorId);
  };

  const handleColaboradorDetailsClick = (colaboradorId: string) => {
    const colaborador = colaboradores.find(c => c.user_id === colaboradorId);
    if (colaborador) {
      setSelectedColaboradorDetails(colaborador);
      setShowColaboradorDetailsModal(true);
    }
  };

  interface VendasPorMes {
    valor_venda: number;
    itens_vendidos: number;
    valor_desconto: number;
    valor_lucro: number;
  }

  const getColaboradorMetrics = (colaboradorId: string) => {
    const colaboradorData = colaboradores.filter(c => c.user_id === colaboradorId);

    if (colaboradorData.length === 0) return null;

    const totalVendas = colaboradorData.reduce((sum, c) => sum + (c.valor_venda || 0), 0);
    const totalItens = colaboradorData.reduce((sum, c) => sum + (c.itens_vendidos || 0), 0);
    const totalDescontos = colaboradorData.reduce((sum, c) => sum + (c.valor_desconto || 0), 0);
    const totalCusto = colaboradorData.reduce((sum, c) => sum + (c.valor_custo || 0), 0);
    const totalLucro = colaboradorData.reduce((sum, c) => sum + (c.valor_lucro || 0), 0);

    const ticketMedio = totalItens > 0 ? totalVendas / totalItens : 0;
    const margemBruta = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0;
    const percentualDesconto = totalVendas > 0 ? (totalDescontos / totalVendas) * 100 : 0;

    // Mapeamento correto dos meses (removido pois não é usado)

    // Mapear o ano_mes para o mês correto
    const mapearMesCorreto = (anoMes: string) => {
      const [ano, mes] = anoMes.split('-');
      const mesNum = parseInt(mes);

      // Se for dezembro, mapear para janeiro do próximo ano
      if (mesNum === 12) {
        return `${parseInt(ano) + 1}-01`;
      }

      // Para os outros meses, mapear para o próximo mês
      const proximoMes = mesNum + 1;
      return `${ano}-${proximoMes.toString().padStart(2, '0')}`;
    };

    const vendasPorMes = colaboradorData.reduce((acc, c) => {
      const mesCorreto = mapearMesCorreto(c.ano_mes);
      acc[mesCorreto] = {
        valor_venda: c.valor_venda || 0,
        itens_vendidos: c.itens_vendidos || 0,
        valor_desconto: c.valor_desconto || 0,
        valor_lucro: c.valor_lucro || 0
      };
      return acc;
    }, {} as Record<string, VendasPorMes>);

    return {
      totalVendas,
      totalItens,
      totalDescontos,
      totalCusto,
      totalLucro,
      ticketMedio,
      margemBruta,
      percentualDesconto,
      vendasPorMes,
      quantidadeVendas: colaboradorData.length
    };
  };

  // Função utilitária para garantir que gráficos tenham pelo menos dois pontos
  const ensureLineChart = (labels: string[], data: number[]): { labels: string[]; data: number[] } => {
    if (labels.length === 1 && data.length === 1) {
      return {
        labels: [labels[0], labels[0]],
        data: [data[0], data[0]]
      };
    }
    return { labels, data };
  };

  const getColaboradorChartData = (vendasPorMes: Record<string, VendasPorMes>) => {
    const meses = Object.keys(vendasPorMes).sort();
    const colors = getChartColors();

    // Formatar labels dos meses
    const formattedLabels = meses.map(mes => {
      const [ano, mesNum] = mes.split('-');
      const data = new Date(parseInt(ano), parseInt(mesNum) - 1, 1);
      return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    });

    const createDataset = (label: string, color: string, dataKey: keyof VendasPorMes) => {
      const data = meses.map(mes => vendasPorMes[mes][dataKey]);

      // Usar ensureLineChart para garantir que sempre há uma linha
      const { data: chartData } = ensureLineChart(formattedLabels, data);

      return {
        label,
        data: chartData,
        borderColor: color,
        backgroundColor: color.replace('#', 'rgba(').replace(')', ', 0.1)'),
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointHoverBorderWidth: 3,
        hoverBorderWidth: 4,
        fill: false
      };
    };

    return {
      labels: formattedLabels,
      datasets: [
        createDataset('Vendas (R$)', colors[0], 'valor_venda'),
        createDataset('Itens Vendidos', colors[1], 'itens_vendidos'),
        createDataset('Lucro (R$)', colors[2], 'valor_lucro')
      ]
    };
  };

  // Função para limpar filtro de colaborador
  const clearCollaboratorFilter = () => {
    setSelectedCollaborator(null);
  };

  // Função para lidar com pesquisa de colaborador
  const handleSearchCollaborator = (searchTerm: string) => {
    setSearchCollaborator(searchTerm);
    if (searchTerm.trim() === '') {
      setSelectedCollaborator(null);
      return;
    }

    // Encontrar colaborador pelo nome (case insensitive)
    const foundCollaborator = colaboradores.find(c =>
      c.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (foundCollaborator) {
      setSelectedCollaborator(foundCollaborator.user_id);
    }
  };

  // Função para lidar com mudanças nos filtros
  const handleFiltersChange = useCallback((newFilters: FilterType) => {
    console.log('🎛️ Mudança de filtros:', newFilters);
    setFilters(newFilters);
  }, []);

  // Resetar filtro se o período selecionado não existir nos dados ou for de 2024
  // (Movido para depois da declaração de availablePeriods)

  // Função para alternar visualização do estoque
  // @ts-expect-error
  const toggleEstoqueView = () => {
    setEstoqueViewType(prev => prev === 'bars' ? 'list' : 'bars');
  };

  // Função para abrir o modal de detalhes do produto
  const openProdutoDetalhesModal = (produto: Estoque2) => {
    setProdutoSelecionadoDetalhes(produto);
    setShowProdutoDetalhesModal(true);
  };

  const openHelpModal = (type: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores' | 'diasEstoque' | 'estoque' | 'maiorTempoEstoque' | 'totalColaboradores' | 'ticketMedio') => {
    setHelpModalType(type);
    setShowHelpModal(true);
  };

  // Funções de paginação
  const handlePageChange = (newPage: number) => {
    console.log('🔄 Mudando para página:', newPage);
    setCurrentPage(newPage);
    // O loadData será chamado automaticamente pelo useEffect que depende de currentPage
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    console.log('🔄 Mudando itens por página para:', newItemsPerPage);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    // O loadData será chamado automaticamente pelo useEffect que depende de itemsPerPage
  };

  // Filtro para Valor de Estoque
  const estoqueComValor = estoque
    .filter(item =>
      (!selectedMonth || item.ano_mes === selectedMonth)
    )
    .map(item => ({
      id: item.id,
      unidade_id: item.unidade_id,
      produto_nome: item.produto_nome,
      fabricante: item.fabricante,
      quantidade: item.quantidade,
      valor_estoque: item.valor_estoque,
      dias_estoque: item.dias_estoque,
      data_atualizacao: item.data_atualizacao,
      data_estocagem: item.data_estocagem,
      ano_mes: item.ano_mes,
      necessidade: item.necessidade,
      estoque_confirmado: item.estoque_confirmado,
      comprar: item.comprar,
      curva_qtd: item.curva_qtd,
      media_venda_mensal: item.media_venda_mensal,
      estoque_final_dias: item.estoque_final_dias,
      classificacao_principal: item.classificacao_principal,
      preco_venda_medio: item.preco_venda_medio,
      ultima_venda_dias: item.ultima_venda_dias,
      transferencia_confirmada: item.transferencia_confirmada,
      comprar_dias: item.comprar_dias,
      necessidade_dias: item.necessidade_dias,
      ultima_compra_dias: item.ultima_compra_dias,
      apelido_unidade: item.apelido_unidade,
      fornecedor_ultima_compra: item.fornecedor_ultima_compra,
      media_venda_diaria: item.media_venda_diaria,
      qtd_demanda: item.qtd_demanda,
      estoque_minimo: item.estoque_minimo,
      origem_estoque_minimo: item.origem_estoque_minimo,
      custo: item.custo,
      custo_medio: item.custo_medio,
      curva_valor: item.curva_valor,
      custo_x_necessidade: item.custo_x_necessidade,
      custo_x_estoque: item.custo_x_estoque,
      ruptura_venda: item.ruptura_venda,
      necessidade_qtd: item.necessidade_qtd,
      percentual_suprida_qtd: item.percentual_suprida_qtd,
      compra_confirmada: item.compra_confirmada,
      encomenda: item.encomenda,
      created_at: item.created_at,
      updated_at: item.updated_at,
      unidades: item.unidades,
      valorTotalItem: (item.quantidade || 0) * (item.valor_estoque || 0)
    }));

  // Função para obter estoque filtrado e paginado (usando dados do servidor)
  const getEstoqueFiltradoEPaginado = () => {
    // Os dados já vêm filtrados do servidor conforme filters.unidade
    // Não aplicar filtros adicionais no cliente para evitar conflitos
    let estoqueFiltrado = estoqueComValor;
    
    // Usar o total real do banco do estado de paginação
    const totalItems = estoquePagination.totalCount > 0 ? estoquePagination.totalCount : estoqueFiltrado.length;
    const totalPages = estoquePagination.totalPages > 0 ? estoquePagination.totalPages : Math.ceil(totalItems / itemsPerPage);
    
    // Retornar dados já paginados do servidor (não fazer paginação local)
    return {
      items: estoqueFiltrado, // Dados já vêm paginados do servidor
      totalItems,
      totalPages: Math.max(totalPages, 1),
      currentPage: estoquePagination.currentPage || currentPage
    };
  };

  // Função para buscar vendas de um produto específico
  const fetchVendasProduto = useCallback(async (produtoNome: string) => {
    if (!produtoNome) {
      setVendasProdutoSelecionado([]);
      return;
    }

    setLoadingVendasProduto(true);
    try {
      // Buscar vendas diretamente do Supabase
      let query = supabase
        .from('vendas_item')
        .select(`
          *,
          produtos(nome, fabricante),
          unidades(nome, codigo)
        `)
        .gte('ano_mes', '2025-01')
        .order('valor_venda', { ascending: false });

      // Aplicar filtros
      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_id', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        query = query.eq('ano_mes', filters.periodo);
      }

      const { data: vendas, error } = await query;

      if (error) throw error;

      // Filtrar por produto específico
      const vendasFiltradas = vendas.filter(venda => 
        venda.produtos?.nome === produtoNome || 
        venda.produtos?.nome?.toLowerCase().includes(produtoNome.toLowerCase())
      );

      setVendasProdutoSelecionado(vendasFiltradas);
    } catch (error) {
      console.error('Erro ao buscar vendas do produto:', error);
      setVendasProdutoSelecionado([]);
    } finally {
      setLoadingVendasProduto(false);
    }
  }, [filters]);

  // useEffect para buscar vendas quando um produto é selecionado
  useEffect(() => {
    if (selectedProduct) {
      fetchVendasProduto(selectedProduct);
    } else {
      setVendasProdutoSelecionado([]);
    }
  }, [selectedProduct]);

  const getHelpContent = (type: 'faturamento' | 'cmv' | 'margemBruta' | 'colaboradores' | 'diasEstoque' | 'estoque' | 'maiorTempoEstoque' | 'totalColaboradores' | 'ticketMedio') => {
    switch (type) {
      case 'faturamento':
        return {
          title: 'Gráfico de Faturamento',
          content: `
            <h3>📊 Sobre este gráfico:</h3>
            <p>Este gráfico mostra o <strong>faturamento total</strong> por mês, permitindo visualizar a evolução das vendas ao longo do tempo.</p>
            
            <h3>📈 O que você pode fazer:</h3>
            <ul>
              <li>Visualizar tendências de crescimento ou queda nas vendas</li>
              <li>Comparar o desempenho entre diferentes meses</li>
              <li>Identificar períodos de alta e baixa temporada</li>
              <li>Filtrar por unidade específica para análise detalhada</li>
            </ul>
            
            <h3>🔍 Como usar:</h3>
            <ul>
              <li>Use os filtros no topo para selecionar período e unidades</li>
              <li>Clique nas barras para ver detalhes específicos</li>
              <li>Passe o mouse sobre os pontos para ver valores exatos</li>
            </ul>
          `
        };
      case 'cmv':
        return {
          title: 'Gráfico de CMV (Custo das Mercadorias Vendidas)',
          content: `
            <h3>💰 Sobre este gráfico:</h3>
            <p>O CMV representa o <strong>custo total</strong> das mercadorias vendidas, mostrando quanto foi gasto para gerar as vendas.</p>
            
            <h3>📊 O que você pode analisar:</h3>
            <ul>
              <li>Eficiência na gestão de custos</li>
              <li>Relação entre custos e receitas</li>
              <li>Impacto dos custos na lucratividade</li>
              <li>Comparação de custos entre unidades</li>
            </ul>
            
            <h3>🎯 Objetivo:</h3>
            <p>Monitorar e otimizar os custos para maximizar a margem de lucro.</p>
          `
        };
      case 'margemBruta':
        return {
          title: 'Gráfico de Margem Bruta',
          content: `
            <h3>📈 Sobre este gráfico:</h3>
            <p>A Margem Bruta mostra a <strong>lucratividade</strong> das vendas, calculada como a diferença entre receitas e custos.</p>
            
            <h3>💡 O que significa:</h3>
            <ul>
              <li><strong>Margem alta:</strong> Boa lucratividade</li>
              <li><strong>Margem baixa:</strong> Necessidade de otimização</li>
              <li><strong>Margem negativa:</strong> Prejuízo nas vendas</li>
            </ul>
            
            <h3>📊 Análises possíveis:</h3>
            <ul>
              <li>Eficiência operacional</li>
              <li>Poder de precificação</li>
              <li>Gestão de custos</li>
              <li>Comparação entre unidades</li>
            </ul>
          `
        };
      case 'colaboradores':
        return {
          title: 'Análise de Vendas por Colaborador',
          content: `
            <h3>👥 Sobre esta análise:</h3>
            <p>Esta seção mostra o <strong>desempenho individual</strong> de cada colaborador nas vendas, permitindo identificar os melhores vendedores.</p>
            
            <h3>📊 Métricas disponíveis:</h3>
            <ul>
              <li><strong>Valor de Vendas:</strong> Total vendido por colaborador</li>
              <li><strong>Quantidade de Itens:</strong> Número de produtos vendidos</li>
              <li><strong>Ticket Médio:</strong> Valor médio por venda</li>
              <li><strong>Desempenho por Período:</strong> Evolução temporal</li>
            </ul>
            
            <h3>🎯 Como usar:</h3>
            <ul>
              <li>Identificar top performers</li>
              <li>Detectar oportunidades de treinamento</li>
              <li>Estabelecer metas individuais</li>
              <li>Reconhecer e motivar colaboradores</li>
            </ul>
          `
        };
      case 'diasEstoque':
        return {
          title: 'Análise de Dias no Estoque',
          content: `
            <h3>📦 Sobre esta análise:</h3>
            <p>Esta seção mostra quantos <strong>dias os produtos ficam em estoque</strong> antes de serem vendidos, indicando a eficiência da gestão de estoque.</p>
            
            <h3>📊 O que os dados revelam:</h3>
            <ul>
              <li><strong>Dias baixos:</strong> Produtos com alta rotatividade</li>
              <li><strong>Dias altos:</strong> Produtos com baixa rotatividade</li>
              <li><strong>Risco de obsolescência:</strong> Produtos parados há muito tempo</li>
              <li><strong>Oportunidades de otimização:</strong> Produtos que podem ser reposicionados</li>
            </ul>
            
            <h3>🎯 Objetivos:</h3>
            <ul>
              <li>Otimizar a gestão de estoque</li>
              <li>Reduzir custos de armazenamento</li>
              <li>Melhorar a rotação de produtos</li>
              <li>Identificar produtos problemáticos</li>
            </ul>
          `
        };
      case 'estoque':
        return {
          title: 'Análise de Valor de Estoque',
          content: `
            <h3>💰 Sobre esta análise:</h3>
            <p>Esta seção mostra o <strong>valor total investido em estoque</strong>, permitindo visualizar quais produtos representam maior valor financeiro.</p>
            
            <h3>📊 Visualizações disponíveis:</h3>
            <ul>
              <li><strong>Valor de Estoque:</strong> Valor financeiro total por produto</li>
              <li><strong>Quantidade de Estoque:</strong> Quantidade física de cada produto</li>
            </ul>
            
            <h3>🔍 Como usar:</h3>
            <ul>
              <li>Identificar produtos de alto valor</li>
              <li>Otimizar investimentos em estoque</li>
              <li>Detectar produtos com excesso de estoque</li>
              <li>Planejar compras estratégicas</li>
            </ul>
            
            <h3>💡 Dica:</h3>
            <p>Use o ícone de usuário para alternar entre visualização de valor e quantidade.</p>
          `
        };
      case 'maiorTempoEstoque':
        return {
          title: 'Maior Tempo no Estoque',
          content: `
              <h3>⚠️ Sobre este indicador:</h3>
              <p>Este card mostra o <strong>produto que está há mais tempo em estoque</strong>, indicando possíveis problemas de gestão de estoque.</p>
              
              <h3>📊 O que você pode analisar:</h3>
              <ul>
                <li><strong>Produto problemático:</strong> Identifica produtos com baixa rotatividade</li>
                <li><strong>Tempo em dias:</strong> Quantos dias o produto está parado</li>
                <li><strong>Curva de estoque:</strong> Classificação da urgência de ação</li>
                <li><strong>Risco de obsolescência:</strong> Produtos que podem se tornar obsoletos</li>
              </ul>
              
              <h3>🎯 Ações recomendadas:</h3>
              <ul>
                <li>Implementar estratégias de liquidação</li>
                <li>Reavaliar políticas de compra</li>
                <li>Considerar promoções especiais</li>
                <li>Analisar se o produto ainda é necessário</li>
              </ul>
              
              <h3>💡 Dica:</h3>
              <p>Clique no card para ver o ranking completo dos produtos com maior tempo no estoque.</p>
            `
        };
      case 'totalColaboradores':
        return {
          title: 'Total de Colaboradores',
          content: `
              <h3>👥 Sobre este indicador:</h3>
              <p>Este card mostra o <strong>número total de colaboradores únicos</strong> que realizaram vendas no período selecionado.</p>
              
              <h3>📊 Métricas disponíveis:</h3>
              <ul>
                <li><strong>Total de Colaboradores:</strong> Número de vendedores únicos</li>
                <li><strong>Vendas Totais:</strong> Quantidade total de itens vendidos</li>
                <li><strong>Média por Colaborador:</strong> Produtividade média da equipe</li>
              </ul>
              
              <h3>📈 Análises possíveis:</h3>
              <ul>
                <li>Capacidade da equipe de vendas</li>
                <li>Distribuição de carga de trabalho</li>
                <li>Eficiência operacional</li>
                <li>Necessidade de contratações</li>
              </ul>
              
              <h3>🎯 Objetivos:</h3>
              <ul>
                <li>Otimizar a força de trabalho</li>
                <li>Identificar gaps de produtividade</li>
                <li>Planejar expansão da equipe</li>
                <li>Melhorar a distribuição de vendas</li>
              </ul>
            `
        };
      case 'ticketMedio':
        return {
          title: 'Ticket Médio Geral',
          content: `
              <h3>💰 Sobre este indicador:</h3>
              <p>O Ticket Médio representa o <strong>valor médio gasto por transação</strong>, calculado dividindo o valor total das vendas pela quantidade de itens vendidos.</p>
              
              <h3>📊 Fórmula de cálculo:</h3>
              <p><strong>Ticket Médio = Valor Total das Vendas ÷ Quantidade de Itens Vendidos</strong></p>
              
              <h3>📈 O que este valor indica:</h3>
              <ul>
                <li><strong>Ticket alto:</strong> Clientes compram produtos de maior valor</li>
                <li><strong>Ticket baixo:</strong> Clientes compram produtos de menor valor</li>
                <li><strong>Eficiência de vendas:</strong> Capacidade de vender produtos premium</li>
                <li><strong>Perfil do cliente:</strong> Poder aquisitivo da base de clientes</li>
              </ul>
              
              <h3>🎯 Estratégias baseadas no ticket:</h3>
              <ul>
                <li><strong>Ticket baixo:</strong> Focar em volume e produtos complementares</li>
                <li><strong>Ticket alto:</strong> Manter qualidade e serviço premium</li>
                <li><strong>Melhoria:</strong> Treinamento em vendas e upselling</li>
              </ul>
            `
        };
      default:
        return {
          title: 'Ajuda',
          content: '<p>Informações de ajuda não disponíveis.</p>'
        };
    }
  };

  // Função para alternar entre Ticket Médio e Quantidade de Vendas (removida pois não é usada)

  const metrics = useMemo(() => {
    console.log('🧮 Calculando métricas - selectedMonth:', selectedMonth, 'filters.periodo:', filters.periodo);

    // Garantir sincronização entre selectedMonth e filters.periodo
    const mesParaFiltrar = selectedMonth || (filters.periodo !== 'all' ? filters.periodo : null);
    console.log('🎯 Mês para filtrar:', mesParaFiltrar);

    // Filtrar dados de faturamento
    let dadosParaCalculo = faturamento;
    if (mesParaFiltrar) {
      console.log('📊 Filtrando faturamento para o mês:', mesParaFiltrar);
      dadosParaCalculo = faturamento.filter(item => item.ano_mes === mesParaFiltrar);
      console.log('📊 Dados de faturamento filtrados:', dadosParaCalculo.length);
    }

    // Filtrar dados de estoque - CORREÇÃO: Simplificar a lógica de filtragem
    let estoqueParaCalculo = estoque;

    // Filtrar por mês se selecionado
    if (mesParaFiltrar) {
      console.log('📊 Filtrando estoque para o mês:', mesParaFiltrar);
      estoqueParaCalculo = estoque.filter(item => item.ano_mes === mesParaFiltrar);
      console.log('📊 Dados de estoque filtrados por mês:', estoqueParaCalculo.length);
    }

    // Filtrar por produto selecionado
    if (selectedProduct) {
      estoqueParaCalculo = estoqueParaCalculo.filter(item => item.produto_nome === selectedProduct);
      console.log('📊 Dados de estoque filtrados por produto:', estoqueParaCalculo.length);
    }

    // Filtrar por unidade se selecionada
    if (filters.unidade !== 'all') {
      console.log('🔍 Filtrando por unidade:', filters.unidade);
      dadosParaCalculo = dadosParaCalculo.filter(item => {
        // Verificar tanto unidade_id quanto unidade_negocio
        return String(item.unidade_id) === String(filters.unidade) ||
          String(item.unidade_negocio) === String(filters.unidade);
      });
      estoqueParaCalculo = estoqueParaCalculo.filter(item => {
        return String(item.unidade_id) === String(filters.unidade);
      });
      console.log('🔍 Dados filtrados por unidade:', dadosParaCalculo.length, 'faturamento,', estoqueParaCalculo.length, 'estoque');
    }

    // Calcular métricas de estoque
    const diasEstoque = estoqueParaCalculo.length > 0
      ? estoqueParaCalculo.reduce((acc, item) => acc + (item.dias_estoque || 0), 0) / estoqueParaCalculo.length
      : 0;

    // Calcular total de venda e custo
    const totalVenda = dadosParaCalculo.reduce((acc, item) => acc + item.valor_venda, 0);
    const totalCusto = dadosParaCalculo.reduce((acc, item) => acc + item.valor_custo, 0);

    // Média dos percentuais de lucro (como estava antes)
    const mediaMargemBruta = dadosParaCalculo.length > 0
      ? dadosParaCalculo.reduce((acc, item) => acc + item.percentual_lucro, 0) / dadosParaCalculo.length
      : 0;
    // Margem bruta real (global)
    const margemBrutaReal = totalVenda > 0 ? ((totalVenda - totalCusto) / totalVenda) * 100 : 0;
    // CMV absoluto e percentual
    const cmvTotal = totalCusto;
    const cmvPercent = totalVenda > 0 ? (totalCusto / totalVenda) * 100 : 0;

    // Calcular valor total de estoque: quantidade * preço unitário
    const valorTotalEstoque = estoqueParaCalculo.reduce((acc, item) => {
      const valorItem = (item.quantidade || 0) * (item.valor_estoque || 0);
      return acc + valorItem;
    }, 0);

    // Encontrar produto com maior tempo no estoque
    const produtoMaiorTempo = estoqueParaCalculo.length > 0
      ? estoqueParaCalculo.sort((a, b) => (b.dias_estoque || 0) - (a.dias_estoque || 0))[0]
      : null;

    console.log('Dias no Estoque:', diasEstoque);
    console.log('Maior Tempo no Estoque:', produtoMaiorTempo ? produtoMaiorTempo.produto_nome : 'N/A');

    return {
      faturamentoTotal: totalVenda,
      valorTotalEstoque: valorTotalEstoque,
      diasEstoque: Math.round(diasEstoque),
      mediaMargemBruta,
      margemBrutaReal,
      cmvTotal,
      cmvPercent,
      produtoMaiorTempo
    };
  }, [faturamento, estoque, selectedMonth, selectedProduct, filters.periodo, filters.unidade]);

  // Função para calcular cores baseadas nos valores (removida pois não é usada)

  const chartData = useMemo<{
    faturamentoChartData: ChartData<'line'>;
    vendasLojaChartData: ChartData<'bar'>;
    diasEstoqueChartData: ChartData<'bar'>;
    cmvChartData: ChartData<'bar'>;
  }>((): {
    faturamentoChartData: ChartData<'line'>;
    vendasLojaChartData: ChartData<'bar'>;
    diasEstoqueChartData: ChartData<'bar'>;
    cmvChartData: ChartData<'bar'>;
  } => {
    // Dados para gráfico de faturamento por mês
    const faturamentoPorMes = faturamento.reduce((acc, item) => {
      const mes = item.ano_mes;
      if (!acc[mes]) acc[mes] = 0;
      acc[mes] += item.valor_venda;
      return acc;
    }, {} as { [key: string]: number });

    // Criar cores dinâmicas baseadas na seleção
    const labels = Object.keys(faturamentoPorMes).sort();
    const data = Object.values(faturamentoPorMes);

    // Garantir que há pelo menos dois pontos para formar uma linha
    const { labels: faturamentoLabels, data: faturamentoData } = ensureLineChart(labels, data);

    const backgroundColor = faturamentoLabels.map(label => {
      if (selectedMonth === label) {
        return 'rgba(59, 130, 246, 0.9)';
      } else if (selectedMonth) {
        return 'rgba(220, 38, 38, 0.3)';
      } else {
        return 'rgba(220, 38, 38, 0.8)';
      }
    }) as string[];

    const borderColor = faturamentoLabels.map(label => {
      if (selectedMonth === label) {
        return 'rgba(59, 130, 246, 1)';
      } else if (selectedMonth) {
        return 'rgba(220, 38, 38, 0.5)';
      } else {
        return 'rgba(220, 38, 38, 1)';
      }
    }) as string[];

    const faturamentoChartData: ChartData<'line'> = {
      labels: faturamentoLabels as string[],
      datasets: [
        {
          label: 'Faturamento',
          data: faturamentoData,
          backgroundColor,
          borderColor,
          borderWidth: 2,
        },
      ],
    };

    // Dados para gráfico de vendas por loja
    const vendasPorLoja = faturamento.reduce((acc, item) => {
      // Usar o ID da unidade para identificar a loja corretamente
      const unidadeId = item.unidade_id || item.unidade_negocio;
      const unidadeNome = getUnidadeNameById(unidadeId);
      const loja = getLojaCode(unidadeNome);
      if (!acc[loja]) acc[loja] = 0;
      acc[loja] += item.valor_venda;
      return acc;
    }, {} as { [key: string]: number });

    const vendasLojaLabels = Object.keys(vendasPorLoja);
    const vendasLojaData = Object.values(vendasPorLoja);
    const { labels: vendasLojaChartLabels, data: vendasLojaChartDataValues } = ensureLineChart(vendasLojaLabels, vendasLojaData);

    const vendasLojaChartData: ChartData<'bar'> = {
      labels: vendasLojaChartLabels as string[],
      datasets: [
        {
          label: 'Vendas por Loja',
          data: vendasLojaChartDataValues,
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Dados para gráfico de dias de estoque por loja
    let estoqueFiltrado = estoque;
    if (selectedMonth) {
      estoqueFiltrado = estoque.filter(item => item.ano_mes === selectedMonth);
      if (estoqueFiltrado.length === 0) {
        // Se não houver dados para o mês selecionado, pegar o mês mais recente disponível
        const mesesDisponiveis = [...new Set(estoque.map(item => item.ano_mes))].sort().reverse();
        if (mesesDisponiveis.length > 0) {
          estoqueFiltrado = estoque.filter(item => item.ano_mes === mesesDisponiveis[0]);
        }
      }
    }
    if (selectedProduct) {
      estoqueFiltrado = estoqueFiltrado.filter(item => item.produto_nome === selectedProduct);
    }
    const diasEstoquePorLoja = estoqueFiltrado.reduce((acc, item) => {
      // Usar o ID da unidade para identificar a loja corretamente
      const unidadeId = item.unidade_id;
      const unidadeNome = getUnidadeNameById(unidadeId);
      const loja = getLojaCode(unidadeNome);
      if (!acc[loja]) acc[loja] = [];
      acc[loja].push(item.dias_estoque);
      return acc;
    }, {} as { [key: string]: number[] });

    const mediaDiasEstoquePorLoja = Object.keys(diasEstoquePorLoja).reduce((acc, loja) => {
      const media = diasEstoquePorLoja[loja].reduce((sum, dias) => sum + dias, 0) / diasEstoquePorLoja[loja].length;
      acc[loja] = Math.round(media);
      return acc;
    }, {} as { [key: string]: number });

    const diasEstoqueLabels = Object.keys(mediaDiasEstoquePorLoja);
    const diasEstoqueData = Object.values(mediaDiasEstoquePorLoja);
    const { labels: diasEstoqueChartLabels, data: diasEstoqueChartDataValues } = ensureLineChart(diasEstoqueLabels, diasEstoqueData);

    const diasEstoqueChartData: ChartData<'bar'> = {
      labels: diasEstoqueChartLabels as string[],
      datasets: [
        {
          label: 'Média Dias de Estoque',
          data: diasEstoqueChartDataValues,
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Dados para gráfico de CMV por loja
    const cmvPorLoja = faturamento.reduce((acc, item) => {
      // Usar o ID da unidade para identificar a loja corretamente
      const unidadeId = item.unidade_id || item.unidade_negocio;
      const unidadeNome = getUnidadeNameById(unidadeId);
      const loja = getLojaCode(unidadeNome);
      if (!acc[loja]) acc[loja] = [];
      acc[loja].push(item.percentual_custo);
      return acc;
    }, {} as { [key: string]: number[] });

    const mediaCmvPorLoja = Object.keys(cmvPorLoja).reduce((acc, loja) => {
      const media = cmvPorLoja[loja].reduce((sum, cmv) => sum + cmv, 0) / cmvPorLoja[loja].length;
      acc[loja] = Math.round(media * 10) / 10;
      return acc;
    }, {} as { [key: string]: number });

    const cmvLabels = Object.keys(mediaCmvPorLoja);
    const cmvData = Object.values(mediaCmvPorLoja);
    const { labels: cmvChartLabels, data: cmvChartDataValues } = ensureLineChart(cmvLabels, cmvData);

    const cmvChartData: ChartData<'bar'> = {
      labels: cmvChartLabels as string[],
      datasets: [
        {
          label: 'CMV (%)',
          data: cmvChartDataValues,
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
        },
      ],
    };

    return {
      faturamentoChartData,
      vendasLojaChartData,
      diasEstoqueChartData,
      cmvChartData
    };
  }, [faturamento, estoque, selectedMonth, selectedProduct, getUnidadeNameById]);

  // Obter meses e anos disponíveis para os filtros
  const availablePeriods = useMemo(() => {
    // Sempre mostrar todos os meses de 2025, independente dos dados
    const todosMeses = [
      '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
      '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
    ];
    const periodos = todosMeses.map(mes => {
      const [ano, mesNum] = mes.split('-');
      const data = new Date(Number(ano), Number(mesNum) - 1, 1);
      const label = format(data, 'MMMM yyyy', { locale: ptBR });
      return {
        value: mes,
        label: label
      };
    });
    console.log('📅 Períodos disponíveis:', periodos);
    return periodos;
  }, []);

  // Resetar filtro se o período selecionado não existir nos dados ou for de 2024
  useEffect(() => {
    const periodExists = availablePeriods.some((p: { value: string }) => p.value === filters.periodo);
    if ((filters.periodo !== 'all' && !periodExists && availablePeriods.length > 0) ||
      (filters.periodo && filters.periodo.includes('2024'))) {
      handleFiltersChange({
        ...filters,
        periodo: 'all'
      });
    }
  }, [faturamento, availablePeriods, filters, handleFiltersChange]);

  // Função utilitária para checar se há dados para o produto selecionado no mês/unidade
  const hasProductData = () => {
    if (!selectedProduct) return true;

    // Usar a mesma lógica de filtragem da função metrics
    const mesParaFiltrar = selectedMonth || (filters.periodo !== 'all' ? filters.periodo : null);

    // Verifica se existe algum item de estoque para o produto filtrado
    return estoque.some(item => {
      const produtoOk = item.produto_nome === selectedProduct;
      const unidadeOk = filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade);
      const mesOk = !mesParaFiltrar || item.ano_mes === mesParaFiltrar;

      return produtoOk && unidadeOk && mesOk;
    });
  };

  // Função para capitalizar nomes (primeira letra de cada palavra)
  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Função para calcular métricas de colaboradores
  const colaboradoresMetrics = useMemo(() => {
    if (!colaboradores.length) return {};

    // Filtrar por período se selecionado
    let dadosColaboradores = colaboradores;
    if (selectedMonth) {
      dadosColaboradores = colaboradores.filter(item => item.ano_mes === selectedMonth);
    }

    // Filtrar por colaborador se selecionado
    if (selectedCollaborator) {
      dadosColaboradores = dadosColaboradores.filter(item => item.user_id === selectedCollaborator);
      console.log('Filtrado por colaborador:', selectedCollaborator, 'Dados:', dadosColaboradores.length);
    }

    // Calcular ticket médio por colaborador (somar todas as vendas do colaborador primeiro)
    const ticketMedioPorColaborador = dadosColaboradores.reduce((acc, item) => {
      const key = item.user_name || 'Colaborador Desconhecido';
      if (!acc[key]) {
        acc[key] = {
          user_name: key,
          user_id: item.user_id,
          unidade_negocio: item.unidade_negocio,
          total_venda: 0,
          total_itens: 0,
          ticket_medio: 0
        };
      }
      acc[key].total_venda += item.valor_venda || 0;
      acc[key].total_itens += item.itens_vendidos || 0;
      return acc;
    }, {} as Record<string, ColaboradorMetricsAcumulador>);

    // Calcular ticket médio para cada colaborador (total_venda / total_itens)
    Object.values(ticketMedioPorColaborador).forEach((colaborador: ColaboradorMetricsAcumulador) => {
      colaborador.ticket_medio = colaborador.total_itens > 0 ? colaborador.total_venda / colaborador.total_itens : 0;
    });

    // Ordenar por ticket médio (do maior para o menor)
    const ticketMedioOrdenado = Object.values(ticketMedioPorColaborador)
      .sort((a: ColaboradorMetricsAcumulador, b: ColaboradorMetricsAcumulador) => b.ticket_medio - a.ticket_medio);

    // Se um colaborador específico foi selecionado, mostrar apenas ele
    const ticketMedioFinal = selectedCollaborator
      ? ticketMedioOrdenado.filter((item: ColaboradorMetricsAcumulador) => item.user_id === selectedCollaborator)
      : ticketMedioOrdenado; // Todos os colaboradores se nenhum colaborador selecionado

    // Calcular quantidade de vendas por colaborador
    const quantidadeVendasPorColaborador = dadosColaboradores.reduce((acc, item) => {
      const key = item.user_name || 'Colaborador Desconhecido';
      if (!acc[key]) {
        acc[key] = {
          user_name: key,
          user_id: item.user_id,
          unidade_negocio: item.unidade_negocio,
          total_itens: 0,
          total_venda: 0,
          ticket_medio: 0
        };
      }
      acc[key].total_itens += item.itens_vendidos || 0;
      acc[key].total_venda += item.valor_venda || 0;
      return acc;
    }, {} as Record<string, ColaboradorMetricsAcumulador>);

    // Calcular ticket médio para cada colaborador (total_venda / total_itens)
    Object.values(quantidadeVendasPorColaborador).forEach((colaborador) => {
      colaborador.ticket_medio = colaborador.total_itens > 0 ? colaborador.total_venda / colaborador.total_itens : 0;
    });

    // Ordenar por quantidade de vendas
    const colaboradoresPorQuantidade = Object.values(quantidadeVendasPorColaborador)
      .sort((a, b) => b.total_itens - a.total_itens);

    // Se um colaborador específico foi selecionado, mostrar apenas ele
    const quantidadeVendasFinal = selectedCollaborator
      ? colaboradoresPorQuantidade.filter((colaborador) => colaborador.user_id === selectedCollaborator)
      : colaboradoresPorQuantidade; // Todos se nenhum colaborador selecionado

    // Calcular ticket médio por loja (valor_venda / itens_vendidos)
    const ticketMedioPorLoja = dadosColaboradores.reduce((acc, item) => {
      const lojaId = item.unidade_negocio;
      if (!acc[lojaId]) {
        acc[lojaId] = {
          loja_id: String(lojaId),
          total_venda: 0,
          total_itens: 0,
          ticket_medio: 0
        };
      }
      acc[lojaId].total_venda += item.valor_venda || 0;
      acc[lojaId].total_itens += item.itens_vendidos || 0;
      return acc;
    }, {} as Record<string, LojaMetricsAcumulador>);

    // Calcular ticket médio para cada loja (total_venda / total_itens)
    Object.values(ticketMedioPorLoja).forEach((loja: LojaMetricsAcumulador) => {
      loja.ticket_medio = loja.total_itens > 0 ? loja.total_venda / loja.total_itens : 0;
    });

    // Ordenar lojas por ticket médio
    const lojasPorTicket = Object.values(ticketMedioPorLoja)
      .sort((a: LojaMetricsAcumulador, b: LojaMetricsAcumulador) => b.ticket_medio - a.ticket_medio);

    // Calcular margem bruta por loja
    const margemBrutaPorLoja = dadosColaboradores.reduce((acc, item) => {
      const lojaId = item.unidade_negocio;
      if (!acc[lojaId]) {
        acc[lojaId] = {
          loja_id: String(lojaId),
          total_venda: 0,
          total_custo: 0,
          margem_bruta: 0
        };
      }
      acc[lojaId].total_venda += item.valor_venda || 0;
      acc[lojaId].total_custo += item.valor_custo || 0;
      return acc;
    }, {} as Record<string, LojaMargemBrutaAcumulador>);

    // Calcular margem bruta para cada loja
    Object.values(margemBrutaPorLoja).forEach((loja: LojaMargemBrutaAcumulador) => {
      loja.margem_bruta = loja.total_venda > 0 ? ((loja.total_venda - loja.total_custo) / loja.total_venda) * 100 : 0;
    });

    // Ordenar lojas por margem bruta
    const lojasPorMargem = Object.values(margemBrutaPorLoja)
      .sort((a: LojaMargemBrutaAcumulador, b: LojaMargemBrutaAcumulador) => b.margem_bruta - a.margem_bruta);

    return {
      ticketMedioPorColaborador: ticketMedioFinal, // Usar ticketMedioFinal que já inclui a filtragem
      colaboradoresPorQuantidade: quantidadeVendasFinal, // Usar quantidadeVendasFinal que já inclui a filtragem
      lojasPorTicket,
      lojasPorMargem
    };
  }, [colaboradores, selectedMonth, selectedCollaborator]);

  // Função para organizar colaboradores por loja
  const getColaboradoresPorLoja = () => {
    const colaboradoresUnicos = colaboradores.filter((colaborador, index, self) =>
      index === self.findIndex(c => c.user_id === colaborador.user_id)
    );

    const colaboradoresPorLoja = colaboradoresUnicos.reduce((acc, colaborador) => {
      const lojaId = colaborador.unidade_negocio;
      if (!acc[lojaId]) {
        acc[lojaId] = [];
      }
      acc[lojaId].push({
        id: colaborador.user_id,
        nome: colaborador.user_name,
        loja: lojaId
      });
      return acc;
    }, {} as Record<number, Array<{ id: string, nome: string, loja: number }>>);

    // Ordenar por ID da loja (menor para maior) e dentro de cada loja, ordenar por nome
    return Object.keys(colaboradoresPorLoja)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .reduce((acc, lojaId) => {
        acc[lojaId] = colaboradoresPorLoja[parseInt(lojaId)].sort((a: { id: string, nome: string, loja: number }, b: { id: string, nome: string, loja: number }) =>
          a.nome.localeCompare(b.nome, 'pt-BR')
        );
        return acc;
      }, {} as Record<string, Array<{ id: string, nome: string, loja: number }>>);
  };

  // Função para filtrar colaboradores com base nos filtros aplicados
  const getColaboradoresFiltrados = () => {
    const colaboradoresPorLoja = getColaboradoresPorLoja();

    // Filtrar por loja se selecionada
    let lojasParaMostrar = Object.keys(colaboradoresPorLoja);
    if (colaboradoresListLojaFilter !== 'all') {
      lojasParaMostrar = lojasParaMostrar.filter(lojaId => lojaId === colaboradoresListLojaFilter);
    }

    // Aplicar filtro de busca por nome
    const resultado = {} as Record<string, Array<{ id: string, nome: string, loja: number }>>;

    lojasParaMostrar.forEach(lojaId => {
      const colaboradoresFiltrados = colaboradoresPorLoja[parseInt(lojaId)].filter(colaborador =>
        colaborador.nome.toLowerCase().includes(colaboradoresListSearch.toLowerCase()) ||
        colaborador.id.toLowerCase().includes(colaboradoresListSearch.toLowerCase())
      );

      if (colaboradoresFiltrados.length > 0) {
        resultado[lojaId] = colaboradoresFiltrados;
      }
    });

    return resultado;
  };

  // Função para obter produtos rankeados por tempo no estoque
  const getProdutosRankeadosPorTempoEstoque = () => {
    if (!estoque.length) return [];

    // Filtrar dados baseado nos filtros atuais
    let estoqueFiltrado = estoque;

    // Filtrar por período
    if (filters.periodo !== 'all') {
      estoqueFiltrado = estoqueFiltrado.filter(item => item.ano_mes === filters.periodo);
    }

    // Filtrar por unidade
    if (filters.unidade !== 'all') {
      estoqueFiltrado = estoqueFiltrado.filter(item => String(item.unidade_id) === String(filters.unidade));
    }

    // Agrupar por produto e calcular tempo médio no estoque
    const produtosAgrupados = estoqueFiltrado.reduce((acc, item) => {
      const key = `${item.produto_nome}-${item.fabricante}`;
      if (!acc[key]) {
        acc[key] = {
          produto_nome: item.produto_nome,
          fabricante: item.fabricante,
          quantidade: 0,
          valor_estoque: 0,
          dias_estoque: 0,
          ultima_venda_dias: 0,
          ultima_compra_dias: 0,
          count: 0
        };
      }

      acc[key].quantidade += item.quantidade || 0;
      acc[key].valor_estoque += (item.quantidade || 0) * (item.valor_estoque || 0);
      acc[key].dias_estoque += item.dias_estoque || 0;
      acc[key].ultima_venda_dias += item.ultima_venda_dias || 0;
      acc[key].ultima_compra_dias += item.ultima_compra_dias || 0;
      acc[key].count += 1;

      return acc;
    }, {} as Record<string, ProdutoAgrupado>);

    // Calcular médias e ordenar por tempo no estoque
    const produtosRankeados = Object.values(produtosAgrupados)
      .map((produto: ProdutoAgrupado) => ({
        produto_nome: produto.produto_nome,
        fabricante: produto.fabricante,
        dias_estoque: Math.round(produto.dias_estoque / produto.count),
        ultima_venda_dias: Math.round(produto.ultima_venda_dias / produto.count),
        ultima_compra_dias: Math.round(produto.ultima_compra_dias / produto.count),
        quantidade: produto.quantidade,
        valor_estoque: produto.valor_estoque
      }))
      .sort((a, b) => b.dias_estoque - a.dias_estoque)
      .slice(0, 50); // Top 50 produtos

    return produtosRankeados;
  };

  // Filtro para Valor de Estoque (removido pois não é usado)
  // const estoqueFiltradoPorValor = estoqueComValor.filter(item => {
  //   const busca = searchValue.toLowerCase();
  //   return (
  //     item.produto_nome?.toLowerCase().includes(busca) ||
  //     item.valorTotalItem.toLocaleString('pt-BR').includes(busca)
  //   );
  // });

  // Filtro para Quantidade de Estoque (removido pois não é usado)
  // const estoqueFiltradoPorUnidade = estoqueComValor.filter(item => {
  //   const busca = searchQuantity.toLowerCase();
  //   return (
  //     getLojaCode(item.unidades?.nome || '').toLowerCase().includes(busca) ||
  //     item.apelido_unidade?.toLowerCase().includes(busca) ||
  //     item.produto_nome?.toLowerCase().includes(busca)
  //   );
  // });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar${sidebarOpen ? '' : ' sidebar-closed'}`}>
        <div className="sidebar-header" style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: sidebarOpen ? 12 : 0 }}
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {sidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button>
          {sidebarOpen && (
            <div className="sidebar-logo">
              <Plus />
            </div>
          )}
          {sidebarOpen && <span>Dashboard</span>}
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            {/* O título só aparece se a sidebar estiver aberta */}
            {sidebarOpen && <div className="nav-title">COMERCIAL</div>}
            {/* Os ícones das abas aparecem sempre, o texto só se aberta */}
            <div
              className={`nav-item ${activeDashboard === 'geral' ? 'active' : ''}`}
              onClick={() => setActiveDashboard('geral')}
              title="Controle de Vendas"
              style={{ justifyContent: 'center' }}
            >
              <BarChart3 />
              {sidebarOpen && <span>Controle de Vendas</span>}
            </div>
            <div
              className={`nav-item ${activeDashboard === 'colaboradores' ? 'active' : ''}`}
              onClick={() => setActiveDashboard('colaboradores')}
              title="Controle de Vendas (por colaborador)"
              style={{ justifyContent: 'center' }}
            >
              <Users />
              {sidebarOpen && <span>Controle de Vendas (por colaborador)</span>}
            </div>
          </div>

          {/* Store Filter */}
          {/* Removido a lista de lojas da sidebar, pois o filtro de unidade já está disponível em outro local */}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="main-header">
          <div>
            <h1 className="header-title">Controle de Vendas</h1>
            {/* Seleção ativa */}
            {(selectedMonth || (filters.periodo !== 'all')) && (
              <div className="flex items-center gap-2 mt-2">
                <Filter size={16} className="text-blue-600" />
                <span className="text-sm text-gray-600">
                  Mês selecionado: {selectedMonth || filters.periodo}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Limpar seleção"
                >
                  <XIcon size={14} />
                </button>
              </div>
            )}
            {selectedCollaborator && (
              <div className="flex items-center gap-2 mt-2">
                <User size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  Colaborador selecionado: {capitalizeName(colaboradores.find(c => c.user_id === selectedCollaborator)?.user_name || '')}
                </span>
                <button
                  onClick={clearCollaboratorFilter}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Limpar filtro de colaborador"
                >
                  <XIcon size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="header-actions">
            <div className="header-date">
              Data da Atualização: {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="header-action import-button"
              title="Importar Planilha Excel"
            >
              <Upload size={18} />
            </button>
            <div className="header-action">
              <Info size={18} />
            </div>
            <div className="header-action">
              <Settings size={18} />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <DashboardFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            unidades={unidades}
            availablePeriods={availablePeriods}
            setSelectedMonth={setSelectedMonth}
          />



          {activeDashboard === 'geral' ? (
            // Dashboard Geral
            <>
              {/* Metrics Cards */}
              <div className="metrics-grid">
                <div
                  className="metric-card faturamento"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    resetModalFilters('faturamento');
                    setShowFaturamentoChart(true);
                  }}
                  title="Clique para ver o gráfico de faturamento"
                >
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Faturamento</div>
                      <div className="metric-value">
                        R$ {metrics.faturamentoTotal.toLocaleString('pt-BR', {})}
                      </div>
                      <div className="metric-subtitle">Itens Vendidos</div>
                      <div className="metric-subvalue">
                        {faturamento.reduce((acc, item) => acc + item.itens_vendidos, 0).toLocaleString('pt-BR')}
                      </div>
                      <div className="metric-subtitle">Média por Item</div>
                      <div className="metric-subvalue">
                        R$ {faturamento.length > 0 ? (metrics.faturamentoTotal / faturamento.reduce((acc, item) => acc + item.itens_vendidos, 0)).toFixed(2) : '0,00'}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div
                  className="metric-card dias-estoque"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Sincronizar filtros do modal com os filtros principais
                    if (filters.unidade !== 'all') {
                      // Para o modal de dias de estoque, vamos usar a mesma lógica dos outros modais
                      // mas precisamos verificar se há estados específicos para este modal
                      setShowDiasEstoqueModal(true);
                    } else {
                      setShowDiasEstoqueModal(true);
                    }
                  }}
                  title="Clique para ver o gráfico de Média Dias de Estoque por Lojas"
                >
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">
                        Dias no Estoque
                        {(selectedMonth || (filters.periodo !== 'all')) && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Filtrado: {selectedMonth || filters.periodo})
                          </span>
                        )}
                      </div>
                      <div className="metric-value">
                        {hasProductData() ? metrics.diasEstoque : <span style={{ color: '#ef4444' }}>Sem dados para este produto neste mês/unidade</span>}
                      </div>
                      <div className="metric-subtitle">Produtos em Estoque</div>
                      <div className="metric-subvalue">
                        {estoque.length > 0 ? estoque.filter(item => item.quantidade > 0).length.toLocaleString('pt-BR') : '0'}
                      </div>
                      <div className="metric-subtitle">Total de Itens</div>
                      <div className="metric-subvalue">
                        {estoque.reduce((acc, item) => acc + (item.quantidade || 0), 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <Clock size={20} />
                    </div>
                  </div>
                </div>

                <div
                  className="metric-card maior-tempo"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowMaiorTempoEstoqueModal(true)}
                  title="Clique para ver o ranking completo de produtos com maior tempo no estoque"
                >
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">
                        Maior Tempo no Estoque
                        {(selectedMonth || (filters.periodo !== 'all')) && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Filtrado: {selectedMonth || filters.periodo})
                          </span>
                        )}
                      </div>
                      <div className="metric-value">
                        {hasProductData() ? metrics.produtoMaiorTempo?.produto_nome : <span style={{ color: '#ef4444' }}>Sem dados para este produto neste mês/unidade</span>}
                      </div>
                      <div className="metric-subtitle">Tempo em Dias</div>
                      <div className="metric-subvalue">
                        {hasProductData() && metrics.produtoMaiorTempo ? `${metrics.produtoMaiorTempo.dias_estoque || 0} dias` : 'N/A'}
                      </div>
                      <div className="metric-subtitle">Curva</div>
                      <div className="metric-subvalue">
                        {hasProductData() && metrics.produtoMaiorTempo ? metrics.produtoMaiorTempo.curva_qtd : 'N/A'}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card margem-bruta" style={{ cursor: 'pointer' }} onClick={() => {
                  resetModalFilters('margemBruta');
                  setShowMargemBrutaChart(true);
                }} title="Clique para ver o gráfico de Margem Bruta">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Média Margem Bruta</div>
                      <div className="metric-value">{metrics.mediaMargemBruta.toFixed(1)}%</div>
                      <div className="metric-subtitle">Margem Bruta Real</div>
                      <div className="metric-subvalue">{metrics.margemBrutaReal.toFixed(1)}%</div>
                    </div>
                    <div className="metric-icon">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card cmv" style={{ cursor: 'pointer' }} onClick={() => {
                  resetModalFilters('cmv');
                  setShowCMVChart(true);
                }} title="Clique para ver o gráfico de CMV">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">CMV</div>
                      <div className="metric-value">{metrics.cmvPercent.toFixed(1)}%</div>
                      <div className="metric-subtitle">Valor Absoluto</div>
                      <div className="metric-subvalue">
                        R$ {metrics.cmvTotal.toLocaleString('pt-BR')}
                      </div>
                      <div className="metric-subtitle">Valor Total no Estoque</div>
                      <div className="metric-subvalue">
                        R$ {metrics.valorTotalEstoque.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <Package size={20} />
                    </div>
                  </div>
                </div>

                {/* Cards de Métricas de Colaboradores - Adicionados ao Dashboard Geral */}
                <div
                  className="metric-card colaboradores"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    resetModalFilters('colaboradores');
                    setShowColaboradoresListModal(true);
                  }}
                  title="Clique para ver a lista completa de colaboradores organizados por loja"
                >
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Total de Colaboradores</div>
                      <div className="metric-value">
                        {colaboradores.length > 0 ? new Set(colaboradores.map(c => c.user_name)).size : 0}
                      </div>
                      <div className="metric-subtitle">Vendas Totais</div>
                      <div className="metric-subvalue">
                        {colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0).toLocaleString('pt-BR')}
                      </div>
                      <div className="metric-subtitle">Média por Colaborador</div>
                      <div className="metric-subvalue">
                        {colaboradores.length > 0 ? Math.round(colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0) / new Set(colaboradores.map(c => c.user_name)).size) : 0}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <Users size={20} />
                    </div>
                  </div>
                </div>

                <div
                  className="metric-card ticket-medio"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    resetModalFilters('colaboradores');
                    setShowQuantidadeVendasModal(true);
                  }}
                  title="Clique para ver a quantidade de vendas por colaborador"
                >
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Ticket Médio Geral</div>
                      <div className="metric-value">
                        R$ {colaboradores.length > 0
                          ? (colaboradores.reduce((acc, c) => acc + c.valor_venda, 0) /
                            colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0)).toFixed(2)
                          : '0,00'}
                      </div>
                      <div className="metric-subtitle">Valor Total</div>
                      <div className="metric-subvalue">
                        R$ {colaboradores.reduce((acc, c) => acc + c.valor_venda, 0).toLocaleString('pt-BR', {})}
                      </div>
                      <div className="metric-subtitle">Itens Vendidos</div>
                      <div className="metric-subvalue">
                        {colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card total-vendas">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Total de Vendas</div>
                      <div className="metric-value">
                        {colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0).toLocaleString('pt-BR')}
                      </div>
                      <div className="metric-subtitle">Valor Total</div>
                      <div className="metric-subvalue">
                        R$ {colaboradores.reduce((acc, c) => acc + c.valor_venda, 0).toLocaleString('pt-BR', {})}
                      </div>
                      <div className="metric-subtitle">Média por Venda</div>
                      <div className="metric-subvalue">
                        R$ {colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0) > 0
                          ? (colaboradores.reduce((acc, c) => acc + c.valor_venda, 0) / colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0)).toFixed(2)
                          : '0,00'}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <ShoppingCart size={20} />
                    </div>
                  </div>
                </div>


              </div>

              {/* Modal do Gráfico de Faturamento */}
              {showFaturamentoChart && (
                <div className="modal-overlay" onClick={() => setShowFaturamentoChart(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Faturamento</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => openHelpModal('faturamento')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          title="Ajuda sobre este gráfico"
                        >
                          <Info size={20} />
                        </button>
                        <button
                          onClick={() => setShowColaboradoresModal(true)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          title="Ver Análise de venda e estoque"
                        >
                          <UserIcon size={24} />
                        </button>
                        <button onClick={() => setShowFaturamentoChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
                      </div>
                    </div>
                    {/* Filtros do modal de faturamento */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <select
                        value={faturamentoModalPeriodo}
                        onChange={e => setFaturamentoModalPeriodo(e.target.value)}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      >
                        <option value="all">Todos os períodos</option>
                        {availablePeriods.map(periodo => (
                          <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
                        ))}
                      </select>
                      <div className="dropdown-lojas-modal" style={{ position: 'relative', minWidth: 180, maxWidth: '100vw', width: '100%' }}>
                        <button
                          type="button"
                          className="dropdown-lojas-modal"
                          onClick={() => setDropdownLojasAberto((open) => !open)}
                          style={{
                            width: '100%',
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #222',
                            background: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 16,
                            marginBottom: 0,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: '100vw',
                            minWidth: 180
                          }}
                        >
                          {getLojasSelecionadas('faturamento').length === 0 || getLojasSelecionadas('faturamento').length === unidades.length
                            ? 'Todas as lojas'
                            : unidades
                              .filter(u => getLojasSelecionadas('faturamento').includes(String(u.id)))
                              .map(u => u.nome)
                              .join(', ')
                          }
                        </button>
                        {dropdownLojasAberto && (
                          <div
                            className="dropdown-lojas-modal"
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              width: '100%',
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                              zIndex: 1001,
                              maxHeight: 260,
                              overflowY: 'auto',
                              padding: 8,
                              pointerEvents: 'auto',
                              minWidth: 180,
                              maxWidth: '100vw',
                              boxSizing: 'border-box',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                              <input
                                type="checkbox"
                                checked={getLojasSelecionadas('faturamento').length === unidades.length}
                                ref={el => {
                                  if (el) el.indeterminate = getLojasSelecionadas('faturamento').length > 0 && getLojasSelecionadas('faturamento').length < unidades.length;
                                }}
                                onChange={e => handleSelectAllLojas('faturamento', e.target.checked)}
                              />
                              Todas as lojas
                            </label>
                            {unidades.map(loja => (
                              <label key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                                <input
                                  type="checkbox"
                                  checked={getLojasSelecionadas('faturamento').includes(String(loja.id))}
                                  onChange={e => handleSelectLoja('faturamento', String(loja.id), e.target.checked)}
                                />
                                {getLojaCode(loja.nome)}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Gráfico filtrado */}
                    <div>
                      <ChartCard
                        title=""
                        type="line"
                        onHover={setHoveredFaturamentoIndex}
                        chartData={(() => {
                          // Cores para as lojas - Paleta mais distinta e contrastante
                          const cores = getChartColors();
                          // Filtrar faturamento conforme seleção do modal
                          let faturamentoFiltrado = modalFaturamentoData;

                          if (faturamentoModalPeriodo !== 'all') {
                            faturamentoFiltrado = faturamentoFiltrado.filter(item => item.ano_mes === faturamentoModalPeriodo);
                          }
                          // Se loja específica, filtra só ela
                          let lojasParaMostrar: typeof unidades = [];
                          // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                          const idsLegenda = [...new Set(modalFaturamentoData.filter(item => {
                            if (faturamentoModalPeriodo !== 'all') {
                              return item.ano_mes === faturamentoModalPeriodo;
                            }
                            return true;
                          }).map(item => item.unidade_negocio))];
                          const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                          if (getLojasSelecionadas('faturamento').length === 0) {
                            // Se nenhuma loja está selecionada, não mostrar nenhuma
                            lojasParaMostrar = [];
                          } else if (getLojasSelecionadas('faturamento').length === unidades.length) {
                            // Se todas as lojas estão selecionadas, mostrar todas
                            lojasParaMostrar = lojasLegenda;
                          } else {
                            // Se algumas lojas estão selecionadas, mostrar apenas elas
                            lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('faturamento').includes(String(u.id)));
                          }
                          // Montar labels (meses)
                          const meses = [...new Set(faturamentoFiltrado.map(item => item.ano_mes))].sort();

                          // Garantir que há pelo menos dois pontos para formar uma linha
                          const { labels: chartLabels } = ensureLineChart(meses, meses.map(() => 0));

                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja, idx) => {
                            // Para cada mês, pegar o valor da loja
                            const data = chartLabels.map(mes => {
                              const item = faturamentoFiltrado.find(f => f.ano_mes === mes && String(f.unidade_negocio) === String(loja.id));
                              return item ? item.valor_venda : 0;
                            });

                            // Se há apenas um ponto, duplicar para criar uma linha
                            const finalData = data.length === 1 ? [data[0], data[0]] : data;

                            // A cor é baseada no índice da loja na lista de lojas para mostrar
                            const cor = cores[idx % cores.length];
                            return {
                              label: getLojaCode(loja.nome),
                              data: finalData,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 8,
                              pointHoverBorderWidth: 3,
                              hoverBorderWidth: 4,
                            };
                          });
                          return {
                            labels: chartLabels as string[],
                            datasets,
                          };
                        })()}
                        onBarClick={handleFaturamentoBarClick}
                        getTooltipExtra={(label) => {
                          if (!selectedProduct) return undefined;
                          const estoqueDoProduto = estoque.filter(item => item.ano_mes === label && item.produto_nome === selectedProduct && (filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade)));
                          if (estoqueDoProduto.length === 0) return 'Sem dados de estoque';
                          const mediaDias = Math.round(estoqueDoProduto.reduce((acc, item) => acc + (item.dias_estoque || 0), 0) / estoqueDoProduto.length);
                          return `Dias no estoque: ${mediaDias}`;
                        }}
                      />
                      {/* Legenda personalizada para o gráfico de faturamento */}
                      {(() => {
                        // Cores para as lojas - Paleta mais distinta e contrastante
                        const cores = getChartColors();
                        // Mesma lógica de lojasParaMostrar do gráfico
                        let lojasParaMostrar: typeof unidades = [];
                        // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                        const idsLegenda = [...new Set(modalFaturamentoData.filter(item => {
                          if (faturamentoModalPeriodo !== 'all') {
                            return item.ano_mes === faturamentoModalPeriodo;
                          }
                          return true;
                        }).map(item => item.unidade_negocio))];
                        const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                        if (getLojasSelecionadas('faturamento').length === 0) {
                          // Se nenhuma loja está selecionada, não mostrar nenhuma
                          lojasParaMostrar = [];
                        } else if (getLojasSelecionadas('faturamento').length === unidades.length) {
                          // Se todas as lojas estão selecionadas, mostrar todas
                          lojasParaMostrar = lojasLegenda;
                        } else {
                          // Se algumas lojas estão selecionadas, mostrar apenas elas
                          lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('faturamento').includes(String(u.id)));
                        }
                        if (lojasParaMostrar.length > 1) {
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                              {lojasParaMostrar.map((loja, idx) => (
                                <div key={loja.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  opacity: hoveredFaturamentoIndex === null || hoveredFaturamentoIndex === idx ? 1 : 0.3,
                                  transform: hoveredFaturamentoIndex === idx ? 'scale(1.05)' : 'scale(1)',
                                  transition: 'all 0.2s ease-in-out',
                                  fontWeight: hoveredFaturamentoIndex === idx ? 'bold' : 'normal',
                                  cursor: 'pointer'
                                }}
                                  onMouseEnter={() => setHoveredFaturamentoIndex(idx)}
                                  onMouseLeave={() => setHoveredFaturamentoIndex(null)}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: hoveredFaturamentoIndex === idx ? 22 : 18,
                                    height: hoveredFaturamentoIndex === idx ? 6 : 4,
                                    background: cores[idx % cores.length],
                                    borderRadius: 2,
                                    marginRight: 6,
                                    transition: 'all 0.2s ease-in-out'
                                  }}></span>
                                  <span style={{
                                    fontSize: hoveredFaturamentoIndex === idx ? 15 : 14,
                                    transition: 'all 0.2s ease-in-out'
                                  }}>{getLojaCode(loja.nome)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal do Gráfico de CMV */}
              {showCMVChart && (
                <div className="modal-overlay" onClick={() => setShowCMVChart(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>CMV por Loja (Menor = Melhor)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => openHelpModal('cmv')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          title="Ajuda sobre este gráfico"
                        >
                          <Info size={20} />
                        </button>
                        <button onClick={() => setShowCMVChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
                      </div>
                    </div>
                    {/* Filtros do modal de CMV */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <select
                        value={cmvModalPeriodo}
                        onChange={e => setCmvModalPeriodo(e.target.value)}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      >
                        <option value="all">Todos os períodos</option>
                        {availablePeriods.map(periodo => (
                          <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
                        ))}
                      </select>
                      <div className="dropdown-lojas-modal" style={{ position: 'relative', minWidth: 180, maxWidth: '100vw', width: '100%' }}>
                        <button
                          type="button"
                          className="dropdown-lojas-modal"
                          onClick={() => setDropdownCmvLojasAberto((open) => !open)}
                          style={{
                            width: '100%',
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #222',
                            background: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 16,
                            marginBottom: 0,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: '100vw',
                            minWidth: 180
                          }}
                        >
                          {getLojasSelecionadas('cmv').length === 0 || getLojasSelecionadas('cmv').length === unidades.length
                            ? 'Todas as lojas'
                            : unidades
                              .filter(u => getLojasSelecionadas('cmv').includes(String(u.id)))
                              .map(u => u.nome)
                              .join(', ')
                          }
                        </button>
                        {dropdownCmvLojasAberto && (
                          <div
                            className="dropdown-lojas-modal"
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              width: '100%',
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                              zIndex: 1001,
                              maxHeight: 260,
                              overflowY: 'auto',
                              padding: 8,
                              pointerEvents: 'auto',
                              minWidth: 180,
                              maxWidth: '100vw',
                              boxSizing: 'border-box',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                              <input
                                type="checkbox"
                                checked={getLojasSelecionadas('cmv').length === unidades.length}
                                ref={el => {
                                  if (el) el.indeterminate = getLojasSelecionadas('cmv').length > 0 && getLojasSelecionadas('cmv').length < unidades.length;
                                }}
                                onChange={e => handleSelectAllLojas('cmv', e.target.checked)}
                              />
                              Todas as lojas
                            </label>
                            {unidades.map(loja => (
                              <label key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                                <input
                                  type="checkbox"
                                  checked={getLojasSelecionadas('cmv').includes(String(loja.id))}
                                  onChange={e => handleSelectLoja('cmv', String(loja.id), e.target.checked)}
                                />
                                {getLojaCode(loja.nome)}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Gráfico de CMV */}
                    <div>
                      <ChartCard
                        title=""
                        type="line"
                        formatType="percentage"
                        onHover={setHoveredCmvIndex}
                        chartData={(() => {
                          // Cores para as lojas - Paleta mais distinta e contrastante
                          const cores = getChartColors();
                          // Filtrar CMV conforme seleção do modal
                          let cmvFiltrado = modalCmvData;
                          if (cmvModalPeriodo !== 'all') {
                            cmvFiltrado = cmvFiltrado.filter(item => item.ano_mes === cmvModalPeriodo);
                          }
                          // Se loja específica, filtra só ela
                          let lojasParaMostrar: typeof unidades = [];
                          // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                          const idsLegenda = [...new Set(modalCmvData.filter(item => {
                            if (cmvModalPeriodo !== 'all') {
                              return item.ano_mes === cmvModalPeriodo;
                            }
                            return true;
                          }).map(item => item.unidade_negocio))];
                          const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                          if (getLojasSelecionadas('cmv').length === 0) {
                            // Se nenhuma loja está selecionada, não mostrar nenhuma
                            lojasParaMostrar = [];
                          } else if (getLojasSelecionadas('cmv').length === unidades.length) {
                            // Se todas as lojas estão selecionadas, mostrar todas
                            lojasParaMostrar = lojasLegenda;
                          } else {
                            // Se algumas lojas estão selecionadas, mostrar apenas elas
                            lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('cmv').includes(String(u.id)));
                          }
                          // Montar labels (meses)
                          const meses = [...new Set(cmvFiltrado.map(item => item.ano_mes))].sort();

                          // Garantir que há pelo menos dois pontos para formar uma linha
                          const { labels: chartLabels } = ensureLineChart(meses, meses.map(() => 0));

                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja, idx) => {
                            // Para cada mês, pegar o valor da loja
                            const data = chartLabels.map(mes => {
                              const item = cmvFiltrado.find(c => c.ano_mes === mes && String(c.unidade_negocio) === String(loja.id));
                              if (!item) return 0;
                              // Calcular CMV como percentual
                              const cmvPercentual = item.valor_venda > 0 ? (item.valor_custo / item.valor_venda) * 100 : 0;
                              return cmvPercentual;
                            });

                            // Se há apenas um ponto, duplicar para criar uma linha
                            const finalData = data.length === 1 ? [data[0], data[0]] : data;

                            // A cor é baseada no índice da loja na lista de lojas para mostrar
                            const cor = cores[idx % cores.length];
                            return {
                              label: getLojaCode(loja.nome),
                              data: finalData,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 8,
                              pointHoverBorderWidth: 3,
                              hoverBorderWidth: 4,
                            };
                          });
                          return {
                            labels: chartLabels as string[],
                            datasets,
                          };
                        })()}
                        onBarClick={handleFaturamentoBarClick}
                      />
                      {/* Legenda personalizada para o gráfico de CMV */}
                      {(() => {
                        // Cores para as lojas - Paleta mais distinta e contrastante
                        const cores = getChartColors();
                        // Mesma lógica de lojasParaMostrar do gráfico
                        let lojasParaMostrar: typeof unidades = [];
                        // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                        const idsLegenda = [...new Set(modalCmvData.filter(item => {
                          if (cmvModalPeriodo !== 'all') {
                            return item.ano_mes === cmvModalPeriodo;
                          }
                          return true;
                        }).map(item => item.unidade_negocio))];
                        const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                        if (getLojasSelecionadas('cmv').length === 0) {
                          // Se nenhuma loja está selecionada, não mostrar nenhuma
                          lojasParaMostrar = [];
                        } else if (getLojasSelecionadas('cmv').length === unidades.length) {
                          // Se todas as lojas estão selecionadas, mostrar todas
                          lojasParaMostrar = lojasLegenda;
                        } else {
                          // Se algumas lojas estão selecionadas, mostrar apenas elas
                          lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('cmv').includes(String(u.id)));
                        }
                        if (lojasParaMostrar.length > 1) {
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                              {lojasParaMostrar.map((loja, idx) => (
                                <div key={loja.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  opacity: hoveredCmvIndex === null || hoveredCmvIndex === idx ? 1 : 0.3,
                                  transform: hoveredCmvIndex === idx ? 'scale(1.05)' : 'scale(1)',
                                  transition: 'all 0.2s ease-in-out',
                                  fontWeight: hoveredCmvIndex === idx ? 'bold' : 'normal',
                                  cursor: 'pointer'
                                }}
                                  onMouseEnter={() => setHoveredCmvIndex(idx)}
                                  onMouseLeave={() => setHoveredCmvIndex(null)}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: hoveredCmvIndex === idx ? 22 : 18,
                                    height: hoveredCmvIndex === idx ? 6 : 4,
                                    background: cores[idx % cores.length],
                                    borderRadius: 2,
                                    marginRight: 6,
                                    transition: 'all 0.2s ease-in-out'
                                  }}></span>
                                  <span style={{
                                    fontSize: hoveredCmvIndex === idx ? 15 : 14,
                                    transition: 'all 0.2s ease-in-out'
                                  }}>{getLojaCode(loja.nome)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal do Gráfico de Margem Bruta */}
              {showMargemBrutaChart && (
                <div className="modal-overlay" onClick={() => setShowMargemBrutaChart(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Margem Bruta por Loja</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => openHelpModal('margemBruta')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          title="Ajuda sobre este gráfico"
                        >
                          <Info size={20} />
                        </button>
                        <button onClick={() => setShowMargemBrutaChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
                      </div>
                    </div>
                    {/* Filtros do modal de Margem Bruta */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <select
                        value={margemBrutaModalPeriodo}
                        onChange={e => setMargemBrutaModalPeriodo(e.target.value)}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      >
                        <option value="all">Todos os períodos</option>
                        {availablePeriods.map(periodo => (
                          <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
                        ))}
                      </select>
                      <div className="dropdown-lojas-modal" style={{ position: 'relative', minWidth: 180, maxWidth: '100vw', width: '100%' }}>
                        <button
                          type="button"
                          className="dropdown-lojas-modal"
                          onClick={() => setDropdownMargemBrutaLojasAberto((open) => !open)}
                          style={{
                            width: '100%',
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #222',
                            background: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 16,
                            marginBottom: 0,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: '100vw',
                            minWidth: 180
                          }}
                        >
                          {getLojasSelecionadas('margemBruta').length === 0 || getLojasSelecionadas('margemBruta').length === unidades.length
                            ? 'Todas as lojas'
                            : unidades
                              .filter(u => getLojasSelecionadas('margemBruta').includes(String(u.id)))
                              .map(u => u.nome)
                              .join(', ')
                          }
                        </button>
                        {dropdownMargemBrutaLojasAberto && (
                          <div
                            className="dropdown-lojas-modal"
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              width: '100%',
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                              zIndex: 1001,
                              maxHeight: 260,
                              overflowY: 'auto',
                              padding: 8,
                              pointerEvents: 'auto',
                              minWidth: 180,
                              maxWidth: '100vw',
                              boxSizing: 'border-box',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                              <input
                                type="checkbox"
                                checked={getLojasSelecionadas('margemBruta').length === unidades.length}
                                ref={el => {
                                  if (el) el.indeterminate = getLojasSelecionadas('margemBruta').length > 0 && getLojasSelecionadas('margemBruta').length < unidades.length;
                                }}
                                onChange={e => handleSelectAllLojas('margemBruta', e.target.checked)}
                              />
                              Todas as lojas
                            </label>
                            {unidades.map(loja => (
                              <label key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                                <input
                                  type="checkbox"
                                  checked={getLojasSelecionadas('margemBruta').includes(String(loja.id))}
                                  onChange={e => handleSelectLoja('margemBruta', String(loja.id), e.target.checked)}
                                />
                                {getLojaCode(loja.nome)}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Gráfico de Margem Bruta */}
                    <div>
                      <ChartCard
                        title=""
                        type="line"
                        onHover={setHoveredMargemBrutaIndex}
                        chartData={(() => {
                          // Cores para as lojas - Paleta mais distinta e contrastante
                          const cores = getChartColors();
                          // Filtrar dados conforme seleção do modal
                          let dadosFiltrados = modalCmvData; // Usar modalCmvData para calcular margem bruta
                          if (margemBrutaModalPeriodo !== 'all') {
                            dadosFiltrados = dadosFiltrados.filter(item => item.ano_mes === margemBrutaModalPeriodo);
                          }
                          // Se loja específica, filtra só ela
                          let lojasParaMostrar: typeof unidades = [];
                          // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                          const idsLegenda = [...new Set(modalCmvData.filter(item => {
                            if (margemBrutaModalPeriodo !== 'all') {
                              return item.ano_mes === margemBrutaModalPeriodo;
                            }
                            return true;
                          }).map(item => item.unidade_negocio))];
                          const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                          if (getLojasSelecionadas('margemBruta').length === 0) {
                            // Se nenhuma loja está selecionada, não mostrar nenhuma
                            lojasParaMostrar = [];
                          } else if (getLojasSelecionadas('margemBruta').length === unidades.length) {
                            // Se todas as lojas estão selecionadas, mostrar todas
                            lojasParaMostrar = lojasLegenda;
                          } else {
                            // Se algumas lojas estão selecionadas, mostrar apenas elas
                            lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('margemBruta').includes(String(u.id)));
                          }
                          // Montar labels (meses)
                          const meses = [...new Set(dadosFiltrados.map(item => item.ano_mes))].sort();

                          // Garantir que há pelo menos dois pontos para formar uma linha
                          const { labels: chartLabels } = ensureLineChart(meses, meses.map(() => 0));

                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja, idx) => {
                            // Para cada mês, pegar o valor da loja
                            const data = chartLabels.map(mes => {
                              const item = dadosFiltrados.find(c => c.ano_mes === mes && String(c.unidade_negocio) === String(loja.id));
                              if (!item) return 0;
                              // Calcular margem bruta como percentual (100% - CMV%)
                              const cmvPercentual = item.valor_venda > 0 ? (item.valor_custo / item.valor_venda) * 100 : 0;
                              const margemBruta = 100 - cmvPercentual;
                              return margemBruta;
                            });

                            // Se há apenas um ponto, duplicar para criar uma linha
                            const finalData = data.length === 1 ? [data[0], data[0]] : data;

                            // A cor é baseada no índice da loja na lista de lojas para mostrar
                            const cor = cores[idx % cores.length];
                            return {
                              label: getLojaCode(loja.nome),
                              data: finalData,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 8,
                              pointHoverBorderWidth: 3,
                              hoverBorderWidth: 4,
                            };
                          });
                          return {
                            labels: chartLabels as string[],
                            datasets,
                          };
                        })()}
                        onBarClick={handleFaturamentoBarClick}
                      />
                      {/* Legenda personalizada para o gráfico de Margem Bruta */}
                      {(() => {
                        // Cores para as lojas - Paleta mais distinta e contrastante
                        const cores = getChartColors();
                        // Mesma lógica de lojasParaMostrar do gráfico
                        let lojasParaMostrar: typeof unidades = [];
                        // Sempre monta lojasParaMostrar na ordem da legenda (todas as lojas presentes nos dados filtrados)
                        const idsLegenda = [...new Set(modalCmvData.filter(item => {
                          if (margemBrutaModalPeriodo !== 'all') {
                            return item.ano_mes === margemBrutaModalPeriodo;
                          }
                          return true;
                        }).map(item => item.unidade_negocio))];
                        const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                        if (getLojasSelecionadas('margemBruta').length === 0) {
                          // Se nenhuma loja está selecionada, não mostrar nenhuma
                          lojasParaMostrar = [];
                        } else if (getLojasSelecionadas('margemBruta').length === unidades.length) {
                          // Se todas as lojas estão selecionadas, mostrar todas
                          lojasParaMostrar = lojasLegenda;
                        } else {
                          // Se algumas lojas estão selecionadas, mostrar apenas elas
                          lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('margemBruta').includes(String(u.id)));
                        }
                        if (lojasParaMostrar.length > 1) {
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                              {lojasParaMostrar.map((loja, idx) => (
                                <div key={loja.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  opacity: hoveredMargemBrutaIndex === null || hoveredMargemBrutaIndex === idx ? 1 : 0.3,
                                  transform: hoveredMargemBrutaIndex === idx ? 'scale(1.05)' : 'scale(1)',
                                  transition: 'all 0.2s ease-in-out',
                                  fontWeight: hoveredMargemBrutaIndex === idx ? 'bold' : 'normal',
                                  cursor: 'pointer'
                                }}
                                  onMouseEnter={() => setHoveredMargemBrutaIndex(idx)}
                                  onMouseLeave={() => setHoveredMargemBrutaIndex(null)}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: hoveredMargemBrutaIndex === idx ? 22 : 18,
                                    height: hoveredMargemBrutaIndex === idx ? 6 : 4,
                                    background: cores[idx % cores.length],
                                    borderRadius: 2,
                                    marginRight: 6,
                                    transition: 'all 0.2s ease-in-out'
                                  }}></span>
                                  <span style={{
                                    fontSize: hoveredMargemBrutaIndex === idx ? 15 : 14,
                                    transition: 'all 0.2s ease-in-out'
                                  }}>{getLojaCode(loja.nome)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal do Gráfico de Dias de Estoque */}
              {showDiasEstoqueModal && (
                <div className="modal-overlay" onClick={() => setShowDiasEstoqueModal(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Média Dias de Estoque por Lojas</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => openHelpModal('diasEstoque')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          title="Ajuda sobre esta análise"
                        >
                          <Info size={20} />
                        </button>
                        <button onClick={() => setShowDiasEstoqueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
                      </div>
                    </div>
                    <div>
                      <ChartCard
                        title=""
                        type="bar"
                        chartData={chartData.diasEstoqueChartData as any}
                        formatType="days"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Projeção de Faturamento */}
              {/**
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">Projeção de Faturamento Mês Vigente</div>
                  </div>
                  <div className="projection-list">
                    {unidades.slice(0, 6).map((unidade) => (
                      <div key={unidade.id} className="projection-item">
                        <div className="projection-store">{getLojaCode(unidade.nome)}</div>
                        <div className="projection-value">R$ 0,00</div>
                      </div>
                    ))}
                  </div>
                </div>
                **/}





            </>
          ) : (
            // Dashboard de Colaboradores
            <div className="colaboradores-dashboard">
              {/* Campo de Pesquisa de Colaborador */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Pesquisar Colaborador</div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Digite o nome do colaborador..."
                          value={searchCollaborator}
                          onChange={(e) => handleSearchCollaborator(e.target.value)}
                          className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchCollaborator && (
                          <button
                            onClick={() => {
                              setSearchCollaborator('');
                              setSelectedCollaborator(null);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Limpar pesquisa"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <User size={20} />
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      </div>


      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Importar Planilha Excel</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <ExcelImporter onImportComplete={handleImportComplete} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Quantidade de Vendas por Colaborador */}
      {showQuantidadeVendasModal && (
        <div className="modal-overlay" onClick={() => setShowQuantidadeVendasModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                {showQuantidadeVendasModalView ? 'Quantidade de Vendas por Colaborador' : 'Ticket Médio por Colaborador'}
                <span className="text-xs text-blue-600 ml-2">
                  (Clique no nome para filtrar)
                </span>
                {selectedCollaborator && (
                  <span className="text-xs text-green-600 ml-2">
                    (Filtrado por colaborador)
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => openHelpModal(showQuantidadeVendasModalView ? 'totalColaboradores' : 'ticketMedio')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  title="Ajuda sobre esta análise"
                >
                  <Info size={20} />
                </button>
                <button
                  onClick={() => setShowQuantidadeVendasModalView(!showQuantidadeVendasModalView)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: 12
                  }}
                  title={showQuantidadeVendasModalView ? "Ver Ticket Médio" : "Ver Quantidade de Vendas"}
                >
                  <ArrowLeftRight size={14} />
                </button>
                <button onClick={() => setShowQuantidadeVendasModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
              </div>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%' }}>
                {/* Coluna 1: Lista de Colaboradores */}
                <div>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                    {showQuantidadeVendasModalView ? 'Quantidade de Vendas por Colaborador' : 'Ticket Médio por Colaborador'}
                  </h3>
                  <div className="colaboradores-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {showQuantidadeVendasModalView ? (
                      // Modo Quantidade de Vendas
                      colaboradoresMetrics.colaboradoresPorQuantidade?.map((colaborador: ColaboradorMetricsAcumulador, index: number) => (
                        <div key={colaborador.user_id} className="colaborador-item">
                          <div className="colaborador-info">
                            <span
                              className="colaborador-name cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleCollaboratorClick(colaborador.user_id)}
                              title="Clique para filtrar por este colaborador"
                            >
                              {capitalizeName(colaborador.user_name)} ({colaborador.user_id})
                            </span>
                            <span className="colaborador-value">
                              {colaborador.total_itens.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="colaborador-bar-container">
                            <div
                              className="colaborador-bar-fill"
                              style={{
                                width: `${Math.min((colaborador.total_itens / 3000) * 100, 100)}%`,
                                background: index < 5 ? 'linear-gradient(90deg, #10b981, #22c55e)' :
                                  index < 10 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                    'linear-gradient(90deg, #dc2626, #ef4444)'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Modo Ticket Médio
                      colaboradoresMetrics.ticketMedioPorColaborador?.map((colaborador: ColaboradorMetricsAcumulador) => (
                        <div key={colaborador.user_id} className="colaborador-item">
                          <div className="colaborador-info">
                            <span
                              className="colaborador-name cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleCollaboratorClick(colaborador.user_id)}
                              title="Clique para filtrar por este colaborador"
                            >
                              {capitalizeName(colaborador.user_name)} ({colaborador.user_id}) - LOJA {colaborador.unidade_negocio}
                            </span>
                            <span className="colaborador-value">
                              R$ {colaborador.ticket_medio.toFixed(2)}
                            </span>
                          </div>
                          <div className="colaborador-bar-container">
                            <div
                              className="colaborador-bar-fill"
                              style={{
                                width: `${Math.min((colaborador.ticket_medio / 50) * 100, 100)}%`,
                                background: 'linear-gradient(90deg, #10b981, #22c55e)'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coluna 2: Ticket Médio por Loja */}
                <div>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                    Ticket Médio por Loja
                  </h3>
                  <div className="lojas-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {colaboradoresMetrics.lojasPorTicket?.map((loja: LojaMetricsAcumulador) => (
                      <div key={loja.loja_id} className="loja-item">
                        <div className="loja-info">
                          <span className="loja-name">LOJA {loja.loja_id}</span>
                          <span className="loja-value">R$ {loja.ticket_medio.toFixed(2)}</span>
                        </div>
                        <div className="loja-bar-container">
                          <div
                            className="loja-bar-fill"
                            style={{
                              width: `${Math.min((loja.ticket_medio / 100) * 100, 100)}%`,
                              background: 'linear-gradient(90deg, #dc2626, #ef4444)'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lista de Colaboradores */}
      {showColaboradoresListModal && (
        <div className="modal-overlay" onClick={() => setShowColaboradoresListModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>Lista de Colaboradores por Loja</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => openHelpModal('totalColaboradores')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  title="Ajuda sobre esta análise"
                >
                  <Info size={20} />
                </button>
                <button onClick={() => setShowColaboradoresListModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '0 16px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Buscar por nome ou ID do colaborador..."
                  value={colaboradoresListSearch}
                  onChange={(e) => setColaboradoresListSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <select
                  value={colaboradoresListLojaFilter}
                  onChange={(e) => setColaboradoresListLojaFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 14
                  }}
                >
                  <option value="all">Todas as lojas</option>
                  {(() => {
                    const colaboradoresPorLoja = getColaboradoresPorLoja();
                    return Object.keys(colaboradoresPorLoja)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(lojaId => (
                        <option key={lojaId} value={lojaId}>
                          LOJA {lojaId} ({colaboradoresPorLoja[lojaId].length} colaboradores)
                        </option>
                      ));
                  })()}
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 16px 16px' }}>
              {(() => {
                const colaboradoresFiltrados = getColaboradoresFiltrados();
                const lojasOrdenadas = Object.keys(colaboradoresFiltrados).sort((a, b) => parseInt(a) - parseInt(b));

                if (lojasOrdenadas.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#6b7280',
                      fontSize: 16
                    }}>
                      Nenhum colaborador encontrado com os filtros aplicados.
                    </div>
                  );
                }

                return lojasOrdenadas.map(lojaId => (
                  <div key={lojaId} style={{ marginBottom: 24, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 16
                    }}>
                      LOJA {lojaId} - {colaboradoresFiltrados[lojaId].length} colaborador{colaboradoresFiltrados[lojaId].length !== 1 ? 'es' : ''}
                    </div>
                    <div style={{ padding: '12px 16px', background: '#f9fafb' }}>
                      {colaboradoresFiltrados[lojaId].map((colaborador, index) => (
                        <div key={colaborador.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: index < colaboradoresFiltrados[lojaId].length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}>
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#3b82f6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            marginRight: 12
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleColaboradorDetailsClick(colaborador.id)}>
                            <div style={{ fontWeight: 500, color: '#374151' }}>
                              {capitalizeName(colaborador.nome)}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              ID: {colaborador.id}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Colaboradores/Empresas */}
      {showColaboradoresModal && (
        <div className="modal-overlay" onClick={() => setShowColaboradoresModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>Análise de venda e estoque</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => openHelpModal('colaboradores')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  title="Ajuda sobre esta análise"
                >
                  <Info size={20} />
                </button>
                <button
                  onClick={() => setShowColaboradoresModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  title="Ver Faturamento"
                >
                  <BarChart3 size={22} />
                </button>
                <button onClick={() => setShowColaboradoresModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
              </div>
            </div>
            {/* Filtros do modal de colaboradores/empresas */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div className="dropdown-lojas-modal" style={{ position: 'relative', minWidth: 180, maxWidth: '100vw', width: '100%' }}>
                <button
                  type="button"
                  className="dropdown-lojas-modal"
                  onClick={() => setDropdownColabLojasAberto((open) => !open)}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #222',
                    background: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 16,
                    marginBottom: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: '100vw',
                    minWidth: 180
                  }}
                >
                  {getLojasSelecionadas('colaboradores').length === 0 || getLojasSelecionadas('colaboradores').length === unidades.length
                    ? 'Todas as lojas'
                    : unidades
                      .filter(u => getLojasSelecionadas('colaboradores').includes(String(u.id)))
                      .map(u => u.nome)
                      .join(', ')
                  }
                </button>
                {dropdownColabLojasAberto && (
                  <div
                    className="dropdown-lojas-modal"
                    style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      width: '100%',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      zIndex: 1001,
                      maxHeight: 260,
                      overflowY: 'auto',
                      padding: 8,
                      pointerEvents: 'auto',
                      minWidth: 180,
                      maxWidth: '100vw',
                      boxSizing: 'border-box',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                      <input
                        type="checkbox"
                        checked={getLojasSelecionadas('colaboradores').length === unidades.length}
                        ref={el => {
                          if (el) el.indeterminate = getLojasSelecionadas('colaboradores').length > 0 && getLojasSelecionadas('colaboradores').length < unidades.length;
                        }}
                        onChange={e => handleSelectAllLojas('colaboradores', e.target.checked)}
                      />
                      Todas as lojas
                    </label>
                    {unidades.map(loja => (
                      <label key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, wordBreak: 'break-word' }}>
                        <input
                          type="checkbox"
                          checked={getLojasSelecionadas('colaboradores').includes(String(loja.id))}
                          onChange={e => handleSelectLoja('colaboradores', String(loja.id), e.target.checked)}
                        />
                        {getLojaCode(loja.nome)}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>


            {/* Listagens de estoque lado a lado */}
            <div style={{ marginTop: 32 }}>
              {/* Barra de pesquisa única */}
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Buscar por produto, valor ou unidade..."
                  value={searchEstoque}
                  onChange={e => setSearchEstoque(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* Listagem de Valor de Estoque à esquerda */}
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div className="chart-card" style={{ height: '100%', margin: 0 }}>
                    <div className="chart-header">
                      <div className="chart-title">
                        Valor de Estoque
                      </div>
                      <div className="chart-actions">
                        <div
                          className="chart-action"
                          onClick={() => openHelpModal('estoque')}
                          style={{ cursor: 'pointer' }}
                          title="Ajuda sobre esta análise"
                        >
                          <Info size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Dica sobre a funcionalidade */}
                    <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '8px' }}>
                      💡 Dica: Clique em um produto para ver suas vendas no gráfico de análise • Duplo-clique para ver detalhes completos
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      {/* Visualização em barras (valor) */}
                      <div className="product-list">
                        {(() => {
                          const { items: estoquePaginado, currentPage: currentPageAjustada } = getEstoqueFiltradoEPaginado();
                          
                          // Ajustar página atual se necessário
                          if (currentPageAjustada !== currentPage) {
                            setCurrentPage(currentPageAjustada);
                          }

                          return estoquePaginado.map((item) => {
                            const maxValor = Math.max(...estoquePaginado.map((e: any) => (e.quantidade || 0) * (e.valor_estoque || 0)));
                            const percentualBarra = maxValor > 0 ? (item.valorTotalItem / maxValor) * 100 : 0;

                            return (
                              <div
                                key={item.id}
                                className={`product-bar-item${selectedProduct === item.produto_nome ? ' active' : ''}`}
                                title={`${item.produto_nome || 'Produto'}
Quantidade: ${item.quantidade || 0}
Preço Unitário: R$ ${(item.valor_estoque || 0).toLocaleString('pt-BR')}
                                Valor Total: R$ ${Math.round(item.valorTotalItem).toLocaleString('pt-BR')}`}
                                onClick={() => {
                                  setSelectedProduct(item.produto_nome);
                                  openProdutoDetalhesModal(item);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '8px 0',
                                  borderBottom: '1px solid #f3f4f6',
                                  transition: 'background-color 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#111827',
                                    flex: '1',
                                    minWidth: '0',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.produto_nome || 'Produto'} ({item.unidade_id || 'N/A'})
                                  </div>
                                  <div style={{
                                    position: 'relative',
                                    height: '20px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    flex: '2',
                                    minWidth: '100px'
                                  }}>
                                    <div
                                      style={{
                                        width: `${Math.max(percentualBarra, 5)}%`,
                                        height: '100%',
                                        backgroundColor: '#dc2626',
                                        borderRadius: '4px',
                                        transition: 'all 0.3s ease'
                                      }}
                                    ></div>
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    backgroundColor: 'white',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    minWidth: '80px',
                                    textAlign: 'right'
                                  }}>
                                    R$ {Math.round(item.valorTotalItem).toLocaleString('pt-BR')}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      
                      {/* Componente de Paginação */}
                      {(() => {
                        const { totalItems, totalPages } = getEstoqueFiltradoEPaginado();
                        
                        if (totalPages > 1) {
                          return (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              padding: '16px',
                              borderTop: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc'
                            }}>
                              <TotalItemsDisplay
                                
                                
                                
                                totalItems={totalItems}
                                
                                
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Listagem de Quantidade de Estoque à direita */}
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div className="chart-card" style={{ height: '100%', margin: 0 }}>
                    <div className="chart-header">
                      <div className="chart-title">
                        Quantidade de Estoque
                        <span className="text-sm text-blue-600 ml-2">
                          • Quantidade
                        </span>
                      </div>
                      <div className="chart-actions">
                        <div
                          className="chart-action"
                          onClick={() => openHelpModal('estoque')}
                          style={{ cursor: 'pointer' }}
                          title="Ajuda sobre esta análise"
                        >
                          <Info size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Dica sobre a funcionalidade */}
                    <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '8px' }}>
                      💡 Dica: Clique em um produto para ver suas vendas no gráfico de análise • Duplo-clique para ver detalhes completos
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      {/* Visualização em barras horizontais com quantidade em destaque */}
                      <div className="product-list">
                        {(() => {
                          const { items: estoquePaginado, currentPage: currentPageAjustada } = getEstoqueFiltradoEPaginado();
                          
                          // Ajustar página atual se necessário
                          if (currentPageAjustada !== currentPage) {
                            setCurrentPage(currentPageAjustada);
                          }

                                                      return estoquePaginado.map((item) => {
                              const maxQuantidade = Math.max(...estoquePaginado.map((e: any) => e.quantidade || 0));
                              const percentualBarra = maxQuantidade > 0 ? ((item.quantidade || 0) / maxQuantidade) * 100 : 0;

                              return (
                                <div
                                  key={item.id}
                                  className={`product-bar-item${selectedProduct === item.produto_nome ? ' active' : ''}`}
                                  title={`${item.produto_nome || 'Produto'}\nQuantidade: ${item.quantidade || 0}\nPreço Unitário: R$ ${(item.valor_estoque || 0).toLocaleString('pt-BR')}\nValor Total: R$ ${Math.round(item.valorTotalItem).toLocaleString('pt-BR')}`}
                                  onClick={() => {
                                    setSelectedProduct(item.produto_nome);
                                    openProdutoDetalhesModal(item);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                                    <div style={{
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      flex: '1',
                                      minWidth: '0',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {item.produto_nome || 'Produto'} ({item.unidade_id || 'N/A'})
                                    </div>
                                    <div style={{
                                      position: 'relative',
                                      height: '20px',
                                      backgroundColor: '#f8f9fa',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      flex: '2',
                                      minWidth: '100px'
                                    }}>
                                      <div
                                        style={{
                                          width: `${Math.max(percentualBarra, 5)}%`,
                                          height: '100%',
                                          backgroundColor: '#10b981',
                                          background: 'linear-gradient(90deg, #10b981, #22c55e)',
                                          borderRadius: '4px',
                                          transition: 'all 0.3s ease',
                                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                                        }}
                                      ></div>
                                    </div>
                                    <div style={{
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      color: '#059669',
                                      backgroundColor: '#ecfdf5',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      border: '1px solid #10b981',
                                      minWidth: '60px',
                                      textAlign: 'right',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}>
                                      <PackageIcon size={8} />
                                      {Math.round(item.quantidade || 0)} un
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                      
                      {/* Componente de Paginação */}
                      {(() => {
                        const { totalItems, totalPages } = getEstoqueFiltradoEPaginado();
                        
                        if (totalPages > 1) {
                          return (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              padding: '16px',
                              borderTop: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc'
                            }}>
                              <TotalItemsDisplay
                                
                                
                                
                                totalItems={totalItems}
                                
                                
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Colaborador */}
      {showColaboradorDetailsModal && selectedColaboradorDetails && (
        <div className="modal-overlay" onClick={() => setShowColaboradorDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 600, fontSize: 18 }}>Detalhes do Colaborador</span>
              <button onClick={() => setShowColaboradorDetailsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Informações do Colaborador */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginRight: '16px'
                  }}>
                    {capitalizeName(selectedColaboradorDetails.user_name).charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                      {capitalizeName(selectedColaboradorDetails.user_name)}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                      ID: {selectedColaboradorDetails.user_id} | Loja: {selectedColaboradorDetails.unidade_negocio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas do Colaborador */}
              {(() => {
                const metrics = getColaboradorMetrics(selectedColaboradorDetails.user_id);
                if (!metrics) return <div>Nenhum dado encontrado para este colaborador.</div>;

                return (
                  <div>
                    {/* Cards de Métricas Principais */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <DollarSign size={16} color="#0ea5e9" />
                          <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500', color: '#0c4a6e' }}>Total de Vendas</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0c4a6e' }}>
                          R$ {metrics.totalVendas.toLocaleString('pt-BR', {})}
                        </div>
                      </div>

                      <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <ShoppingCart size={16} color="#22c55e" />
                          <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500', color: '#166534' }}>Ticket Médio</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                          R$ {metrics.ticketMedio.toLocaleString('pt-BR', {})}
                        </div>
                      </div>

                      <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <Package size={16} color="#f59e0b" />
                          <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500', color: '#92400e' }}>Quantidade de Vendas</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                          {metrics.quantidadeVendas}
                        </div>
                      </div>

                      <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <TrendingUp size={16} color="#ef4444" />
                          <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500', color: '#991b1b' }}>Margem Bruta</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                          {metrics.margemBruta.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Métricas Detalhadas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Resumo Financeiro</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Total de Itens Vendidos:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{metrics.totalItens.toLocaleString('pt-BR')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Total de Descontos:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>R$ {metrics.totalDescontos.toLocaleString('pt-BR', {})}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Total de Custos:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>R$ {metrics.totalCusto.toLocaleString('pt-BR', {})}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Total de Lucro:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>R$ {metrics.totalLucro.toLocaleString('pt-BR', {})}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Percentuais</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Margem Bruta:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{metrics.margemBruta.toFixed(1)}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Percentual de Desconto:</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{metrics.percentualDesconto.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vendas por Mês */}
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Vendas por Mês</h4>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {/* Botões de visualização */}
                          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e5e7eb', borderRadius: '6px', padding: '2px' }}>
                            <button
                              onClick={() => setColaboradorDetailsViewType('cards')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                backgroundColor: colaboradorDetailsViewType === 'cards' ? '#3b82f6' : 'transparent',
                                color: colaboradorDetailsViewType === 'cards' ? 'white' : '#6b7280',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Caixas
                            </button>
                            <button
                              onClick={() => setColaboradorDetailsViewType('chart')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                backgroundColor: colaboradorDetailsViewType === 'chart' ? '#3b82f6' : 'transparent',
                                color: colaboradorDetailsViewType === 'chart' ? 'white' : '#6b7280',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Gráfico
                            </button>
                          </div>
                          <select
                            value={colaboradorDetailsPeriodoFilter}
                            onChange={(e) => setColaboradorDetailsPeriodoFilter(e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">Todos os meses</option>
                            {Object.keys(metrics.vendasPorMes)
                              .sort((a, b) => a.localeCompare(b))
                              .map(mes => (
                                <option key={mes} value={mes}>
                                  {new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {colaboradorDetailsViewType === 'cards' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          {Object.entries(metrics.vendasPorMes)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .filter(([mes]) => colaboradorDetailsPeriodoFilter === 'all' || mes === colaboradorDetailsPeriodoFilter)
                            .map(([mes, dados]) => {
                              const dadosVendas = dados as VendasPorMes;

                              return (
                                <div key={mes} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                    {new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>Vendas:</span>
                                      <span style={{ fontWeight: '500', color: '#374151' }}>R$ {dadosVendas.valor_venda.toLocaleString('pt-BR', {})}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>Itens:</span>
                                      <span style={{ fontWeight: '500', color: '#374151' }}>{dadosVendas.itens_vendidos.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>Lucro:</span>
                                      <span style={{ fontWeight: '500', color: '#374151' }}>R$ {dadosVendas.valor_lucro.toLocaleString('pt-BR', {})}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div style={{ height: '400px', position: 'relative', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', padding: '20px' }}>
                          {(() => {
                            const chartData = getColaboradorChartData(metrics.vendasPorMes);
                            const filteredData = {
                              ...chartData,
                              labels: chartData.labels.filter((_: string, index: number) => {
                                const mes = Object.keys(metrics.vendasPorMes).sort()[index];
                                return colaboradorDetailsPeriodoFilter === 'all' || mes === colaboradorDetailsPeriodoFilter;
                              }),
                              datasets: chartData.datasets.map(dataset => ({
                                ...dataset,
                                data: dataset.data.filter((_, index) => {
                                  const mes = Object.keys(metrics.vendasPorMes).sort()[index];
                                  return colaboradorDetailsPeriodoFilter === 'all' || mes === colaboradorDetailsPeriodoFilter;
                                })
                              }))
                            };

                            // Aplicar ensureLineChart aos dados filtrados para garantir linhas retas
                            const finalData = {
                              ...filteredData,
                              labels: filteredData.labels.length === 1 ? [filteredData.labels[0], filteredData.labels[0]] : filteredData.labels,
                              datasets: filteredData.datasets.map(dataset => ({
                                ...dataset,
                                data: dataset.data.length === 1 ? [dataset.data[0], dataset.data[0]] : dataset.data
                              }))
                            };

                            const options = {
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top' as const,
                                  labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                      size: 12
                                    }
                                  }
                                },
                                tooltip: {
                                  mode: 'index' as const,
                                  intersect: false,
                                  callbacks: {
                                    label: function (context: TooltipItem<'line'>) {
                                      let label = context.dataset.label || '';
                                      if (label) {
                                        label += ': ';
                                      }
                                      if (context.parsed.y !== null) {
                                        if (label.includes('R$')) {
                                          label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', {});
                                        } else {
                                          label += context.parsed.y.toLocaleString('pt-BR');
                                        }
                                      }
                                      return label;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: 'Meses'
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                  }
                                },
                                y: {
                                  type: 'linear' as const,
                                  display: true,
                                  position: 'left' as const,
                                  title: {
                                    display: true,
                                    text: 'Valores (R$)'
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                  },
                                  ticks: {
                                    callback: function (value: string | number) {
                                      return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                    }
                                  }
                                },
                                y1: {
                                  type: 'linear' as const,
                                  display: false,
                                  position: 'right' as const,
                                  grid: {
                                    drawOnChartArea: false,
                                  },
                                }
                              },
                              interaction: {
                                mode: 'nearest' as const,
                                axis: 'x' as const,
                                intersect: false,
                              }
                            };

                            return <Line data={finalData} options={options as any} />;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal do Ranking de Maior Tempo no Estoque */}
      {showMaiorTempoEstoqueModal && (
        <div className="modal-overlay" onClick={() => setShowMaiorTempoEstoqueModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>Ranking - Maior Tempo no Estoque</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => openHelpModal('maiorTempoEstoque')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  title="Ajuda sobre este ranking"
                >
                  <Info size={20} />
                </button>
                <button
                  onClick={() => setShowMaiorTempoEstoqueModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
                  Produtos com maior tempo em estoque (Top 50)
                </p>
                {(selectedMonth || (filters.periodo !== 'all')) && (
                  <p style={{ color: '#3b82f6', fontSize: 12 }}>
                    Filtrado: {selectedMonth || filters.periodo}
                  </p>
                )}
              </div>

              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {(() => {
                  const produtosRankeados = getProdutosRankeadosPorTempoEstoque();

                  if (produtosRankeados.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                        Nenhum produto encontrado para os filtros aplicados.
                      </div>
                    );
                  }

                  return (
                    <div className="product-list">
                      {produtosRankeados.map((produto, index) => (
                        <div key={`${produto.produto_nome}-${produto.fabricante}`} className="product-item">
                          <div className="product-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: index < 3 ? '#ef4444' : '#f59e0b',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="product-name">{produto.produto_nome}</div>
                                <div className="product-code">{produto.fabricante}</div>
                              </div>
                            </div>
                          </div>
                          <div className="product-amount">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <div style={{
                                color: produto.dias_estoque > 90 ? '#ef4444' : produto.dias_estoque > 60 ? '#f59e0b' : '#10b981',
                                fontWeight: 'bold',
                                fontSize: 16
                              }}>
                                {produto.dias_estoque} dias
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                Qtd: {Math.round(produto.quantidade).toLocaleString('pt-BR')}
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                R$ {produto.valor_estoque.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      {showProdutoDetalhesModal && produtoSelecionadoDetalhes && (
        <div className="modal-overlay" onClick={() => setShowProdutoDetalhesModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontWeight: 600, fontSize: 20, color: '#1e293b' }}>Detalhes do Produto</span>
              <button
                onClick={() => setShowProdutoDetalhesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#ef4444' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Identificação do Produto */}
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {produtoSelecionadoDetalhes.produto_nome?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                    {produtoSelecionadoDetalhes.produto_nome || 'Produto'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                    ID: {produtoSelecionadoDetalhes.id || 'N/A'} | Fabricante: {produtoSelecionadoDetalhes.fabricante || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Cards de Métricas Principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>📦</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#0c4a6e' }}>Quantidade em Estoque</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0c4a6e' }}>
                    {Math.round(produtoSelecionadoDetalhes.quantidade || 0).toLocaleString('pt-BR')} unidades
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>💰</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b' }}>Preço Unitário</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                    R$ {(produtoSelecionadoDetalhes.valor_estoque || 0).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>💎</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b' }}>Valor Total</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                    R$ {Math.round((produtoSelecionadoDetalhes.quantidade || 0) * (produtoSelecionadoDetalhes.valor_estoque || 0)).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>📅</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#166534' }}>Dias em Estoque</span>
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: (produtoSelecionadoDetalhes.dias_estoque || 0) > 90 ? '#ef4444' : 
                           (produtoSelecionadoDetalhes.dias_estoque || 0) > 60 ? '#f59e0b' : '#166534'
                  }}>
                    {(produtoSelecionadoDetalhes.dias_estoque || 0)} dias
                  </div>
                </div>
              </div>

              {/* Informações Detalhadas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Informações de Vendas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Última Venda:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{(produtoSelecionadoDetalhes.ultima_venda_dias || 0)} dias atrás</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Última Compra:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{(produtoSelecionadoDetalhes.ultima_compra_dias || 0)} dias atrás</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Informações Adicionais</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Unidade:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {getLojaCode(produtoSelecionadoDetalhes.unidades?.nome || '') || produtoSelecionadoDetalhes.unidade_id || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Período:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{produtoSelecionadoDetalhes.ano_mes || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuda */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content help-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>{getHelpContent(helpModalType).title}</span>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                dangerouslySetInnerHTML={{ __html: getHelpContent(helpModalType).content }}
                className="help-modal-content"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
