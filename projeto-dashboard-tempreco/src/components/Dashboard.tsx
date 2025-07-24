import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  User,
  Upload,
  X,
  Filter,
  Search,
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
import { DashboardFilters as FilterType, Faturamento, Estoque2, Unidade, Colaborador } from '../types';
import '../styles/dashboard.css';

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
  const [cmvData, setCmvData] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [estoqueViewType, setEstoqueViewType] = useState<'bars' | 'list'>('bars');
  const [activeDashboard, setActiveDashboard] = useState<'geral' | 'colaboradores'>('geral');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [searchCollaborator, setSearchCollaborator] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchQuantity, setSearchQuantity] = useState('');
  const [showFaturamentoChart, setShowFaturamentoChart] = useState(false);
  const [showCMVChart, setShowCMVChart] = useState(false);
  const [cmvModalLoja, setCmvModalLoja] = useState('all');
  const [cmvModalPeriodo, setCmvModalPeriodo] = useState('all');
  const [faturamentoModalLoja, setFaturamentoModalLoja] = useState('all');
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
  // Estado para alternar entre Ticket Médio e Quantidade de Vendas
  const [showQuantidadeVendas, setShowQuantidadeVendas] = useState(false);
  const [showColaboradoresModal, setShowColaboradoresModal] = useState(false);
  const [colabModalPeriodo, setColabModalPeriodo] = useState('all');
  const [colabModalLojasSelecionadas, setColabModalLojasSelecionadas] = useState<string[]>([]);
  const [dropdownColabLojasAberto, setDropdownColabLojasAberto] = useState(false);
  const [colabTab, setColabTab] = useState<'tipo1' | 'tipo2'>('tipo1');
  const [showColaboradoresListModal, setShowColaboradoresListModal] = useState(false);
  const [colaboradoresListSearch, setColaboradoresListSearch] = useState('');
  const [colaboradoresListLojaFilter, setColaboradoresListLojaFilter] = useState('all');
  const [showQuantidadeVendasModal, setShowQuantidadeVendasModal] = useState(false);
  const [showQuantidadeVendasModalView, setShowQuantidadeVendasModalView] = useState(false);
  const [showDiasEstoqueModal, setShowDiasEstoqueModal] = useState(false);

  const { loading, error, fetchFaturamento, fetchEstoque, fetchUnidades, fetchCMV, fetchColaboradores } = useSupabase();

  // Estados para dados completos dos modais (sem filtros)
  const [modalFaturamentoData, setModalFaturamentoData] = useState<Faturamento[]>([]);
  const [modalCmvData, setModalCmvData] = useState<Faturamento[]>([]);
  const [modalColaboradoresData, setModalColaboradoresData] = useState<Colaborador[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
  }, [filters.periodo, filters.unidade]);

  // Resetar filtro se o período selecionado não existir nos dados ou for de 2024
  useEffect(() => {
    const availablePeriods = getAvailablePeriods();
    const periodExists = availablePeriods.some(p => p.value === filters.periodo);

    if ((filters.periodo !== 'all' && !periodExists && availablePeriods.length > 0) ||
      (filters.periodo && filters.periodo.includes('2024'))) {
      // Se o período selecionado não existe ou é de 2024, resetar para 'all'
      handleFiltersChange({
        ...filters,
        periodo: 'all'
      });
    }
  }, [faturamento]);

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
  }, [selectedMonth, filters.unidade]);

  const loadData = async () => {
    console.log('🔄 Carregando dados com filtros:', filters);
    const [faturamentoData, estoqueData, unidadesData, cmvDataResult, colaboradoresData] = await Promise.all([
      fetchFaturamento(filters),
      fetchEstoque(filters), // Usar fetchEstoque com filtros
      fetchUnidades(),
      fetchCMV(filters),
      fetchColaboradores(filters)
    ]);

    console.log('📊 Dados carregados - faturamento:', faturamentoData.length, 'estoque:', estoqueData.length);
    setFaturamento(faturamentoData);
    setEstoque(estoqueData);
    setUnidades(unidadesData);
    setCmvData(cmvDataResult);
    setColaboradores(colaboradoresData);
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    loadData(); // Recarregar dados após importação
  };

  // Função para carregar dados completos para os modais (sem filtros)
  const loadModalData = async () => {
    console.log('🔄 Carregando dados completos para os modais');
    const [faturamentoData, cmvData, colaboradoresData] = await Promise.all([
      fetchFaturamento({ periodo: 'all', unidade: 'all' }),
      fetchCMV({ periodo: 'all', unidade: 'all' }),
      fetchColaboradores({ periodo: 'all', unidade: 'all' })
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
  const handleFiltersChange = (newFilters: FilterType) => {
    console.log('🎛️ Mudança de filtros:', newFilters);
    setFilters(newFilters);
  };

  // Função para alternar visualização do estoque
  const toggleEstoqueView = () => {
    setEstoqueViewType(prev => prev === 'bars' ? 'list' : 'bars');
  };

  // Função para alternar entre Ticket Médio e Quantidade de Vendas
  const toggleColaboradorView = () => {
    setShowQuantidadeVendas(!showQuantidadeVendas);
  };

  const calculateMetrics = () => {
    console.log('🧮 Calculando métricas - selectedMonth:', selectedMonth, 'filters.periodo:', filters.periodo);

    // Garantir sincronização entre selectedMonth e filters.periodo
    const mesParaFiltrar = selectedMonth || (filters.periodo !== 'all' ? filters.periodo : null);
    console.log('🎯 Mês para filtrar:', mesParaFiltrar);

    // Se há um mês selecionado, calcular métricas apenas para esse mês
    let dadosParaCalculo = faturamento;
    let estoqueParaCalculo = estoque;

    // Mapear mês para faixa de dias (definido fora do if para evitar erro de escopo)
    const mesParaDias = {
      '2025-01': { min: 0, max: 31 },    // Janeiro
      '2025-02': { min: 31, max: 59 },   // Fevereiro
      '2025-03': { min: 59, max: 90 },   // Março
      '2025-04': { min: 90, max: 120 },  // Abril
      '2025-05': { min: 120, max: 151 }, // Maio
      '2025-06': { min: 151, max: 181 }, // Junho
      '2025-07': { min: 181, max: 212 }, // Julho
      '2025-08': { min: 212, max: 243 }, // Agosto
      '2025-09': { min: 243, max: 273 }, // Setembro
      '2025-10': { min: 273, max: 304 }, // Outubro
      '2025-11': { min: 304, max: 334 }, // Novembro
      '2025-12': { min: 334, max: 365 }  // Dezembro
    };

    if (mesParaFiltrar) {
      console.log('📊 Filtrando dados para o mês:', mesParaFiltrar);
      console.log('📊 Dados de faturamento disponíveis:', faturamento.map(item => item.ano_mes));
      dadosParaCalculo = faturamento.filter(item => item.ano_mes === mesParaFiltrar);
      console.log('📊 Dados de faturamento filtrados:', dadosParaCalculo.length);
      console.log('📊 Primeiros dados filtrados:', dadosParaCalculo.slice(0, 3));

      if (selectedProduct) {
        estoqueParaCalculo = estoque.filter(item => item.ano_mes === mesParaFiltrar && item.produto_nome === selectedProduct);
      } else {
        estoqueParaCalculo = estoque.filter(item => {
          const ultimaVendaDias = item.ultima_venda_dias || 0;
          const ultimaCompraDias = item.ultima_compra_dias || 0;
          const diasEstoque = item.dias_estoque || 0;
          const faixaDias = mesParaDias[mesParaFiltrar as keyof typeof mesParaDias];
          if (!faixaDias) return true;
          return (
            (ultimaVendaDias >= faixaDias.min && ultimaVendaDias <= faixaDias.max) ||
            (ultimaCompraDias >= faixaDias.min && ultimaCompraDias <= faixaDias.max) ||
            (diasEstoque >= faixaDias.min && diasEstoque <= faixaDias.max)
          );
        });
      }
    }

    // Filtrar por produto selecionado (caso não tenha sido filtrado acima)
    let estoqueParaCalculoProduto = estoqueParaCalculo;
    if (selectedProduct && (!mesParaFiltrar)) {
      estoqueParaCalculoProduto = estoqueParaCalculo.filter(item => item.produto_nome === selectedProduct);
    }
    if (selectedProduct && mesParaFiltrar) {
      estoqueParaCalculoProduto = estoqueParaCalculo.filter(item => item.produto_nome === selectedProduct);
      if (estoqueParaCalculoProduto.length === 0) {
        // Se não houver dados para o produto, usar o geral do mês/unidade
        estoqueParaCalculoProduto = estoqueParaCalculo;
      }
    }

    // Fallback: se não houver dados para o produto/mês/unidade, mostrar 0 ou N/A
    const diasEstoque = estoqueParaCalculoProduto.length > 0
      ? estoqueParaCalculoProduto.reduce((acc, item) => acc + (item.dias_estoque || 0), 0) / estoqueParaCalculoProduto.length
      : 0;
    // (Removido: agora calculado acima com estoqueParaCalculoProduto)

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
    const valorTotalEstoque = estoqueParaCalculoProduto.reduce((acc, item) => {
      const valorItem = (item.quantidade || 0) * (item.valor_estoque || 0);
      return acc + valorItem;
    }, 0);

    console.log('Dias no Estoque:', diasEstoque);
    console.log('Maior Tempo no Estoque:', estoqueParaCalculoProduto.length > 0 ? estoqueParaCalculoProduto[0] : 'N/A');

    return {
      faturamentoTotal: totalVenda,
      valorTotalEstoque: valorTotalEstoque,
      diasEstoque: Math.round(diasEstoque),
      mediaMargemBruta,
      margemBrutaReal,
      cmvTotal,
      cmvPercent,
      produtoMaiorTempo: estoqueParaCalculoProduto.length > 0 ? estoqueParaCalculoProduto[0] : null
    };
  };

  // Função para calcular cores baseadas nos valores
  const getMetricColor = (value: number, type: 'faturamento' | 'cmv' | 'margem') => {
    switch (type) {
      case 'faturamento':
        // Verde para faturamento alto, amarelo para médio, vermelho para baixo
        if (value > 1000000) return '#10b981'; // Verde
        if (value > 500000) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho

      case 'cmv':
        // Vermelho para CMV alto (mau), amarelo para médio, verde para baixo (bom)
        if (value > 70) return '#ef4444'; // Vermelho
        if (value > 50) return '#f59e0b'; // Amarelo
        return '#10b981'; // Verde

      case 'margem':
        // Verde para margem alta (boa), amarelo para média, vermelho para baixa
        if (value > 30) return '#10b981'; // Verde
        if (value > 15) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho

      default:
        return '#6b7280'; // Cinza padrão
    }
  };

  const generateChartData = () => {
    // Dados para gráfico de faturamento por mês
    const faturamentoPorMes = faturamento.reduce((acc, item) => {
      const mes = item.ano_mes;
      if (!acc[mes]) acc[mes] = 0;
      acc[mes] += item.valor_venda;
      return acc;
    }, {} as { [key: string]: number });

    // Criar cores dinâmicas baseadas na seleção
    const labels = Object.keys(faturamentoPorMes).sort();
    const backgroundColor = labels.map(label => {
      if (selectedMonth === label) {
        return 'rgba(59, 130, 246, 0.9)'; // Azul para selecionado
      } else if (selectedMonth) {
        return 'rgba(220, 38, 38, 0.3)'; // Vermelho claro para filtrados
      } else {
        return 'rgba(220, 38, 38, 0.8)'; // Vermelho normal
      }
    }) as string[];

    const borderColor = labels.map(label => {
      if (selectedMonth === label) {
        return 'rgba(59, 130, 246, 1)'; // Azul para selecionado
      } else if (selectedMonth) {
        return 'rgba(220, 38, 38, 0.5)'; // Vermelho claro para filtrados
      } else {
        return 'rgba(220, 38, 38, 1)'; // Vermelho normal
      }
    }) as string[];

    const faturamentoChartData = {
      labels,
      datasets: [
        {
          label: 'Faturamento',
          data: Object.values(faturamentoPorMes),
          backgroundColor,
          borderColor,
          borderWidth: 2,
        },
      ],
    };

    // Dados para gráfico de vendas por loja
    const vendasPorLoja = faturamento.reduce((acc, item) => {
      const loja = item.unidades?.nome || 'Loja Desconhecida';
      if (!acc[loja]) acc[loja] = 0;
      acc[loja] += item.valor_venda;
      return acc;
    }, {} as { [key: string]: number });

    const vendasLojaChartData = {
      labels: Object.keys(vendasPorLoja),
      datasets: [
        {
          label: 'Vendas por Loja',
          data: Object.values(vendasPorLoja),
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
      const loja = item.unidades?.nome || 'Loja Desconhecida';
      if (!acc[loja]) acc[loja] = [];
      acc[loja].push(item.dias_estoque);
      return acc;
    }, {} as { [key: string]: number[] });

    const mediaDiasEstoquePorLoja = Object.keys(diasEstoquePorLoja).reduce((acc, loja) => {
      const media = diasEstoquePorLoja[loja].reduce((sum, dias) => sum + dias, 0) / diasEstoquePorLoja[loja].length;
      acc[loja] = Math.round(media);
      return acc;
    }, {} as { [key: string]: number });

    const diasEstoqueChartData = {
      labels: Object.keys(mediaDiasEstoquePorLoja),
      datasets: [
        {
          label: 'Média Dias de Estoque',
          data: Object.values(mediaDiasEstoquePorLoja),
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Dados para gráfico de CMV por loja
    const cmvPorLoja = faturamento.reduce((acc, item) => {
      const loja = item.unidades?.nome || 'Loja Desconhecida';
      if (!acc[loja]) acc[loja] = [];
      acc[loja].push(item.percentual_custo);
      return acc;
    }, {} as { [key: string]: number[] });

    const mediaCmvPorLoja = Object.keys(cmvPorLoja).reduce((acc, loja) => {
      const media = cmvPorLoja[loja].reduce((sum, cmv) => sum + cmv, 0) / cmvPorLoja[loja].length;
      acc[loja] = Math.round(media * 10) / 10;
      return acc;
    }, {} as { [key: string]: number });

    const cmvChartData = {
      labels: Object.keys(mediaCmvPorLoja),
      datasets: [
        {
          label: 'CMV (%)',
          data: Object.values(mediaCmvPorLoja),
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
  };

  // Obter meses e anos disponíveis para os filtros
  const getAvailablePeriods = () => {
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
  };

  const metrics = calculateMetrics();
  const chartData = generateChartData();
  const availablePeriods = getAvailablePeriods();

  // Função utilitária para checar se há dados para o produto selecionado no mês/unidade
  const hasProductData = () => {
    if (!selectedProduct) return true;
    // Verifica se existe algum item de estoque para o produto filtrado
    return estoque.some(item => {
      const unidadeOk = filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade);
      const mesOk = !selectedMonth || item.ano_mes === selectedMonth;
      return item.produto_nome === selectedProduct && unidadeOk && mesOk;
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
  const calculateColaboradoresMetrics = () => {
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
    }, {} as Record<string, any>);

    // Calcular ticket médio para cada colaborador (total_venda / total_itens)
    Object.values(ticketMedioPorColaborador).forEach((colaborador: any) => {
      colaborador.ticket_medio = colaborador.total_itens > 0 ? colaborador.total_venda / colaborador.total_itens : 0;
    });

    // Ordenar por ticket médio (do maior para o menor)
    const ticketMedioOrdenado = Object.values(ticketMedioPorColaborador)
      .sort((a: any, b: any) => b.ticket_medio - a.ticket_medio);

    // Se um colaborador específico foi selecionado, mostrar apenas ele
    const ticketMedioFinal = selectedCollaborator
      ? ticketMedioOrdenado.filter((item: any) => item.user_id === selectedCollaborator)
      : ticketMedioOrdenado; // Todos os colaboradores se nenhum colaborador selecionado

    // Calcular quantidade de vendas por colaborador
    const quantidadeVendasPorColaborador = dadosColaboradores.reduce((acc, item) => {
      const key = item.user_name || 'Colaborador Desconhecido';
      if (!acc[key]) {
        acc[key] = {
          user_name: key,
          user_id: item.user_id,
          total_itens: 0,
          total_venda: 0,
          ticket_medio: 0
        };
      }
      acc[key].total_itens += item.itens_vendidos || 0;
      acc[key].total_venda += item.valor_venda || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calcular ticket médio para cada colaborador (total_venda / total_itens)
    Object.values(quantidadeVendasPorColaborador).forEach((colaborador: any) => {
      colaborador.ticket_medio = colaborador.total_itens > 0 ? colaborador.total_venda / colaborador.total_itens : 0;
    });

    // Ordenar por quantidade de vendas
    const colaboradoresPorQuantidade = Object.values(quantidadeVendasPorColaborador)
      .sort((a: any, b: any) => b.total_itens - a.total_itens);

    // Se um colaborador específico foi selecionado, mostrar apenas ele
    const quantidadeVendasFinal = selectedCollaborator
      ? colaboradoresPorQuantidade.filter((colaborador: any) => colaborador.user_id === selectedCollaborator)
      : colaboradoresPorQuantidade; // Todos se nenhum colaborador selecionado

    // Calcular ticket médio por loja (valor_venda / itens_vendidos)
    const ticketMedioPorLoja = dadosColaboradores.reduce((acc, item) => {
      const lojaId = item.unidade_negocio;
      if (!acc[lojaId]) {
        acc[lojaId] = {
          loja_id: lojaId,
          total_venda: 0,
          total_itens: 0,
          ticket_medio: 0
        };
      }
      acc[lojaId].total_venda += item.valor_venda || 0;
      acc[lojaId].total_itens += item.itens_vendidos || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calcular ticket médio para cada loja (total_venda / total_itens)
    Object.values(ticketMedioPorLoja).forEach((loja: any) => {
      loja.ticket_medio = loja.total_itens > 0 ? loja.total_venda / loja.total_itens : 0;
    });

    // Ordenar lojas por ticket médio
    const lojasPorTicket = Object.values(ticketMedioPorLoja)
      .sort((a: any, b: any) => b.ticket_medio - a.ticket_medio);

    // Calcular margem bruta por loja
    const margemBrutaPorLoja = dadosColaboradores.reduce((acc, item) => {
      const lojaId = item.unidade_negocio;
      if (!acc[lojaId]) {
        acc[lojaId] = {
          loja_id: lojaId,
          total_venda: 0,
          total_custo: 0,
          margem_bruta: 0
        };
      }
      acc[lojaId].total_venda += item.valor_venda || 0;
      acc[lojaId].total_custo += item.valor_custo || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calcular margem bruta para cada loja
    Object.values(margemBrutaPorLoja).forEach((loja: any) => {
      loja.margem_bruta = loja.total_venda > 0 ? ((loja.total_venda - loja.total_custo) / loja.total_venda) * 100 : 0;
    });

    // Ordenar lojas por margem bruta
    const lojasPorMargem = Object.values(margemBrutaPorLoja)
      .sort((a: any, b: any) => b.margem_bruta - a.margem_bruta);

    return {
      ticketMedioPorColaborador: ticketMedioFinal, // Usar ticketMedioFinal que já inclui a filtragem
      colaboradoresPorQuantidade: quantidadeVendasFinal, // Usar quantidadeVendasFinal que já inclui a filtragem
      lojasPorTicket,
      lojasPorMargem
    };
  };

  const colaboradoresMetrics = calculateColaboradoresMetrics();

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
    }, {} as Record<string, Array<{ id: string, nome: string, loja: string }>>);

    // Ordenar por ID da loja (menor para maior) e dentro de cada loja, ordenar por nome
    return Object.keys(colaboradoresPorLoja)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .reduce((acc, lojaId) => {
        acc[lojaId] = colaboradoresPorLoja[lojaId].sort((a: { id: string, nome: string, loja: string }, b: { id: string, nome: string, loja: string }) =>
          a.nome.localeCompare(b.nome, 'pt-BR')
        );
        return acc;
      }, {} as Record<string, Array<{ id: string, nome: string, loja: string }>>);
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
    const resultado = {} as Record<string, Array<{ id: string, nome: string, loja: string }>>;

    lojasParaMostrar.forEach(lojaId => {
      const colaboradoresFiltrados = colaboradoresPorLoja[lojaId].filter(colaborador =>
        colaborador.nome.toLowerCase().includes(colaboradoresListSearch.toLowerCase()) ||
        colaborador.id.toLowerCase().includes(colaboradoresListSearch.toLowerCase())
      );

      if (colaboradoresFiltrados.length > 0) {
        resultado[lojaId] = colaboradoresFiltrados;
      }
    });

    return resultado;
  };

  // Filtro para Valor de Estoque
  const estoqueComValor = estoque
    .filter(item =>
      (filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade)) &&
      (!selectedMonth || item.ano_mes === selectedMonth)
    )
    .map(item => ({
      ...item,
      valorTotalItem: (item.quantidade || 0) * (item.valor_estoque || 0)
    }));
  const estoqueFiltradoPorValor = estoqueComValor.filter(item => {
    const busca = searchValue.toLowerCase();
    return (
      item.produto_nome?.toLowerCase().includes(busca) ||
      item.valorTotalItem.toLocaleString('pt-BR').includes(busca)
    );
  });

  // Filtro para Quantidade de Estoque
  const estoqueFiltradoPorUnidade = estoqueComValor.filter(item => {
    const busca = searchQuantity.toLowerCase();
    return (
      item.unidades?.nome?.toLowerCase().includes(busca) ||
      item.apelido_unidade?.toLowerCase().includes(busca) ||
      item.produto_nome?.toLowerCase().includes(busca)
    );
  });

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
                  style={{ '--metric-color': getMetricColor(metrics.faturamentoTotal, 'faturamento'), cursor: 'pointer' } as React.CSSProperties}
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
                        R$ {metrics.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    </div>
                    <div className="metric-icon">
                      <Clock size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card maior-tempo">
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
                    </div>
                    <div className="metric-icon">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card margem-bruta" style={{ '--metric-color': getMetricColor(metrics.mediaMargemBruta, 'margem'), cursor: 'pointer' } as React.CSSProperties} onClick={() => {
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

                <div className="metric-card cmv" style={{ '--metric-color': getMetricColor(metrics.cmvPercent, 'cmv'), cursor: 'pointer' } as React.CSSProperties} onClick={() => {
                  resetModalFilters('cmv');
                  setShowCMVChart(true);
                }} title="Clique para ver o gráfico de CMV">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">CMV</div>
                      <div className="metric-value">{metrics.cmvPercent.toFixed(1)}%</div>
                      <div className="metric-subtitle">Valor Absoluto</div>
                      <div className="metric-subvalue">
                        R$ {metrics.cmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="metric-subtitle">Valor Total no Estoque</div>
                      <div className="metric-subvalue">
                        R$ {metrics.valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <Package size={20} />
                    </div>
                  </div>
                </div>

                {/* Cards de Métricas de Colaboradores - Adicionados ao Dashboard Geral */}
                <div
                  className="metric-card faturamento"
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
                    </div>
                    <div className="metric-icon">
                      <Users size={20} />
                    </div>
                  </div>
                </div>

                <div
                  className="metric-card dias-estoque"
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
                    </div>
                    <div className="metric-icon">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="metric-card maior-tempo">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Total de Vendas</div>
                      <div className="metric-value">
                        {colaboradores.reduce((acc, c) => acc + c.itens_vendidos, 0).toLocaleString('pt-BR')}
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
                                {loja.nome}
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
                        data={(() => {
                          // Cores para as lojas
                          const cores = [
                            '#3b82f6', // azul
                            '#ef4444', // vermelho
                            '#10b981', // verde
                            '#f59e0b', // amarelo
                            '#6366f1', // roxo
                            '#f472b6', // rosa
                            '#0ea5e9', // azul claro
                            '#a3e635', // verde limão
                            '#f97316', // laranja
                            '#64748b', // cinza
                          ];
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
                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja) => {
                            // Para cada mês, pegar o valor da loja
                            const data = meses.map(mes => {
                              const item = faturamentoFiltrado.find(f => f.ano_mes === mes && String(f.unidade_negocio) === String(loja.id));
                              return item ? item.valor_venda : 0;
                            });
                            // A cor é baseada no índice da loja na legenda
                            const idxLegenda = lojasLegenda.findIndex(l => l.id === loja.id);
                            const cor = cores[idxLegenda % cores.length];
                            return {
                              label: loja.nome,
                              data,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                            };
                          });
                          return {
                            labels: meses,
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
                        // Cores para as lojas (deve ser igual ao array usado no gráfico)
                        const cores = [
                          '#3b82f6', // azul
                          '#ef4444', // vermelho
                          '#10b981', // verde
                          '#f59e0b', // amarelo
                          '#6366f1', // roxo
                          '#f472b6', // rosa
                          '#0ea5e9', // azul claro
                          '#a3e635', // verde limão
                          '#f97316', // laranja
                          '#64748b', // cinza
                        ];
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
                                <div key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ display: 'inline-block', width: 18, height: 4, background: cores[idx % cores.length], borderRadius: 2, marginRight: 6 }}></span>
                                  <span style={{ fontSize: 14 }}>{loja.nome}</span>
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
                    <div className="modal-header">
                      <span style={{ fontWeight: 600, fontSize: 18 }}>CMV por Loja (Menor = Melhor)</span>
                      <button onClick={() => setShowCMVChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
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
                                {loja.nome}
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
                        data={(() => {
                          // Cores para as lojas
                          const cores = [
                            '#3b82f6', // azul
                            '#ef4444', // vermelho
                            '#10b981', // verde
                            '#f59e0b', // amarelo
                            '#6366f1', // roxo
                            '#f472b6', // rosa
                            '#0ea5e9', // azul claro
                            '#a3e635', // verde limão
                            '#f97316', // laranja
                            '#64748b', // cinza
                          ];
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
                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja) => {
                            // Para cada mês, pegar o valor da loja
                            const data = meses.map(mes => {
                              const item = cmvFiltrado.find(c => c.ano_mes === mes && String(c.unidade_negocio) === String(loja.id));
                              if (!item) return 0;
                              // Calcular CMV como percentual
                              const cmvPercentual = item.valor_venda > 0 ? (item.valor_custo / item.valor_venda) * 100 : 0;
                              return cmvPercentual;
                            });
                            // A cor é baseada no índice da loja na legenda
                            const idxLegenda = lojasLegenda.findIndex(l => l.id === loja.id);
                            const cor = cores[idxLegenda % cores.length];
                            return {
                              label: loja.nome,
                              data,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                            };
                          });
                          return {
                            labels: meses,
                            datasets,
                          };
                        })()}
                        onBarClick={handleFaturamentoBarClick}
                      />
                      {/* Legenda personalizada para o gráfico de CMV */}
                      {(() => {
                        // Cores para as lojas (deve ser igual ao array usado no gráfico)
                        const cores = [
                          '#3b82f6', // azul
                          '#ef4444', // vermelho
                          '#10b981', // verde
                          '#f59e0b', // amarelo
                          '#6366f1', // roxo
                          '#f472b6', // rosa
                          '#0ea5e9', // azul claro
                          '#a3e635', // verde limão
                          '#f97316', // laranja
                          '#64748b', // cinza
                        ];
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
                                <div key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ display: 'inline-block', width: 18, height: 4, background: cores[idx % cores.length], borderRadius: 2, marginRight: 6 }}></span>
                                  <span style={{ fontSize: 14 }}>{loja.nome}</span>
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
                    <div className="modal-header">
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Margem Bruta por Loja</span>
                      <button onClick={() => setShowMargemBrutaChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
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
                                {loja.nome}
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
                        data={(() => {
                          // Cores para as lojas
                          const cores = [
                            '#3b82f6', // azul
                            '#ef4444', // vermelho
                            '#10b981', // verde
                            '#f59e0b', // amarelo
                            '#6366f1', // roxo
                            '#f472b6', // rosa
                            '#0ea5e9', // azul claro
                            '#a3e635', // verde limão
                            '#f97316', // laranja
                            '#64748b', // cinza
                          ];
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
                          // Montar datasets: um para cada loja
                          const datasets = lojasParaMostrar.map((loja) => {
                            // Para cada mês, pegar o valor da loja
                            const data = meses.map(mes => {
                              const item = dadosFiltrados.find(c => c.ano_mes === mes && String(c.unidade_negocio) === String(loja.id));
                              if (!item) return 0;
                              // Calcular margem bruta como percentual (100% - CMV%)
                              const cmvPercentual = item.valor_venda > 0 ? (item.valor_custo / item.valor_venda) * 100 : 0;
                              const margemBruta = 100 - cmvPercentual;
                              return margemBruta;
                            });
                            // A cor é baseada no índice da loja na legenda
                            const idxLegenda = lojasLegenda.findIndex(l => l.id === loja.id);
                            const cor = cores[idxLegenda % cores.length];
                            return {
                              label: loja.nome,
                              data,
                              borderColor: cor,
                              backgroundColor: cor,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                            };
                          });
                          return {
                            labels: meses,
                            datasets,
                          };
                        })()}
                        onBarClick={handleFaturamentoBarClick}
                      />
                      {/* Legenda personalizada para o gráfico de Margem Bruta */}
                      {(() => {
                        // Cores para as lojas (deve ser igual ao array usado no gráfico)
                        const cores = [
                          '#3b82f6', // azul
                          '#ef4444', // vermelho
                          '#10b981', // verde
                          '#f59e0b', // amarelo
                          '#6366f1', // roxo
                          '#f472b6', // rosa
                          '#0ea5e9', // azul claro
                          '#a3e635', // verde limão
                          '#f97316', // laranja
                          '#64748b', // cinza
                        ];
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
                                <div key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ display: 'inline-block', width: 18, height: 4, background: cores[idx % cores.length], borderRadius: 2, marginRight: 6 }}></span>
                                  <span style={{ fontSize: 14 }}>{loja.nome}</span>
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
                    <div className="modal-header">
                      <span style={{ fontWeight: 600, fontSize: 18 }}>Média Dias de Estoque por Lojas</span>
                      <button onClick={() => setShowDiasEstoqueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
                    </div>
                    <div>
                      <ChartCard
                        title=""
                        type="bar"
                        data={chartData.diasEstoqueChartData}
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
                        <div className="projection-store">{unidade.nome}</div>
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
            <div className="modal-header">
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
                      colaboradoresMetrics.colaboradoresPorQuantidade?.map((colaborador: any, index: number) => (
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
                      colaboradoresMetrics.ticketMedioPorColaborador?.map((colaborador: any, index: number) => (
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
                    {colaboradoresMetrics.lojasPorTicket?.map((loja: any) => (
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
            <div className="modal-header">
              <span style={{ fontWeight: 600, fontSize: 18 }}>Lista de Colaboradores por Loja</span>
              <button onClick={() => setShowColaboradoresListModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
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
                          <div>
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
              <select
                value={colabModalPeriodo}
                onChange={e => setColabModalPeriodo(e.target.value)}
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
                        {loja.nome}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>


            {/* Gráfico e tabela lado a lado */}
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* Gráfico à esquerda */}
                <div style={{ flex: 2, minWidth: 300 }}>
                  <ChartCard
                    title=""
                    type="line"
                    data={(() => {
                      // Cores para as lojas
                      const cores = [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#f472b6', '#0ea5e9', '#a3e635', '#f97316', '#64748b',
                      ];
                      // Filtrar colaboradores conforme seleção do modal
                      let colaboradoresFiltrados = modalColaboradoresData;
                      if (colabModalPeriodo !== 'all') {
                        colaboradoresFiltrados = colaboradoresFiltrados.filter(item => item.ano_mes === colabModalPeriodo);
                      }
                      // Lojas presentes
                      const idsLegenda = [...new Set(colaboradoresFiltrados.map(item => item.unidade_negocio))];
                      const lojasLegenda = unidades.filter(u => idsLegenda.includes(u.id));
                      let lojasParaMostrar: typeof unidades = [];
                      if (getLojasSelecionadas('colaboradores').length === 0) {
                        // Se nenhuma loja está selecionada, não mostrar nenhuma
                        lojasParaMostrar = [];
                      } else if (getLojasSelecionadas('colaboradores').length === unidades.length) {
                        // Se todas as lojas estão selecionadas, mostrar todas
                        lojasParaMostrar = lojasLegenda;
                      } else {
                        // Se algumas lojas estão selecionadas, mostrar apenas elas
                        lojasParaMostrar = lojasLegenda.filter(u => getLojasSelecionadas('colaboradores').includes(String(u.id)));
                      }
                      // Montar labels (meses)
                      const meses = [...new Set(colaboradoresFiltrados.map(item => item.ano_mes))].sort();
                      // Montar datasets: um para cada loja
                      const datasets = lojasParaMostrar.map((loja) => {
                        // Para cada mês, pegar o valor da loja
                        const data = meses.map(mes => {
                          const item = colaboradoresFiltrados.find(f => f.ano_mes === mes && String(f.unidade_negocio) === String(loja.id));
                          return item ? item.valor_venda : 0;
                        });
                        // A cor é baseada no índice da loja na legenda
                        const idxLegenda = lojasLegenda.findIndex(l => l.id === loja.id);
                        const cor = cores[idxLegenda % cores.length];
                        return {
                          label: loja.nome,
                          data,
                          borderColor: cor,
                          backgroundColor: cor,
                          fill: false,
                          tension: 0.3,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        };
                      });
                      return {
                        labels: meses,
                        datasets,
                      };
                    })()}
                  />
                  {/* Legenda personalizada para o gráfico de colaboradores/empresas */}
                  {(() => {
                    const cores = [
                      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#f472b6', '#0ea5e9', '#a3e635', '#f97316', '#64748b',
                    ];
                    let lojasParaMostrar: typeof unidades = [];
                    if (getLojasSelecionadas('colaboradores').length === 0) {
                      // Se nenhuma loja está selecionada, não mostrar nenhuma
                      lojasParaMostrar = [];
                    } else if (getLojasSelecionadas('colaboradores').length === unidades.length) {
                      // Se todas as lojas estão selecionadas, mostrar todas
                      const ids = [...new Set(modalColaboradoresData.filter(item => {
                        if (colabModalPeriodo !== 'all') {
                          return item.ano_mes === colabModalPeriodo;
                        }
                        return true;
                      }).map(item => item.unidade_negocio))];
                      lojasParaMostrar = unidades.filter(u => ids.includes(u.id));
                    } else {
                      // Se algumas lojas estão selecionadas, mostrar apenas elas
                      lojasParaMostrar = unidades.filter(u => getLojasSelecionadas('colaboradores').includes(String(u.id)));
                    }
                    if (lojasParaMostrar.length > 1) {
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                          {lojasParaMostrar.map((loja, idx) => (
                            <div key={loja.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ display: 'inline-block', width: 18, height: 4, background: cores[idx % cores.length], borderRadius: 2, marginRight: 6 }}></span>
                              <span style={{ fontSize: 14 }}>{loja.nome}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                {/* Card completo de valor de estoque à direita */}
                <div style={{ flex: 1, minWidth: 280, maxWidth: 400 }}>
                  <div className="chart-card" style={{ height: '100%', margin: 0 }}>
                    <div className="chart-header">
                      <div className="chart-title">
                        {estoqueViewType === 'bars' ? 'Valor de Estoque' : 'Quantidade de Estoque'}
                        {estoqueViewType === 'list' && (
                          <span className="text-sm text-blue-600 ml-2">
                            • Quantidade
                          </span>
                        )}
                      </div>
                      <div className="chart-actions">
                        <div className="chart-action">
                          <Info size={16} />
                        </div>
                        <div
                          className="chart-action"
                          onClick={toggleEstoqueView}
                          title={`Alternar para visualização ${estoqueViewType === 'bars' ? 'quantidade' : 'valor'}`}
                          style={{
                            backgroundColor: estoqueViewType === 'list' ? '#3b82f6' : 'transparent',
                            color: estoqueViewType === 'list' ? 'white' : 'inherit'
                          }}
                        >
                          <User size={16} />
                        </div>
                      </div>
                    </div>

                    {estoqueViewType === 'bars' && (
                      <input
                        type="text"
                        placeholder="Buscar por valor ou nome do produto..."
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        style={{ marginBottom: 12, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    )}
                    {estoqueViewType === 'list' && (
                      <input
                        type="text"
                        placeholder="Buscar por unidade/empresa..."
                        value={searchQuantity}
                        onChange={e => setSearchQuantity(e.target.value)}
                        style={{ marginBottom: 12, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    )}

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      {estoqueViewType === 'bars' ? (
                        // Visualização em barras (padrão) - MODAL
                        <div className="product-list">
                          {(() => {
                            // Filtrar estoque conforme lojas e período selecionados do modal
                            let estoqueFiltrado = estoqueComValor;
                            if (colabModalPeriodo !== 'all') {
                              estoqueFiltrado = estoqueFiltrado.filter(item => item.ano_mes === colabModalPeriodo);
                            }
                            if (getLojasSelecionadas('colaboradores').length > 0 && getLojasSelecionadas('colaboradores').length !== unidades.length) {
                              estoqueFiltrado = estoqueFiltrado.filter(item => getLojasSelecionadas('colaboradores').includes(String(item.unidade_id)));
                            }
                            // Aplicar filtro de busca
                            const estoqueFiltradoPorBusca = estoqueFiltrado.filter(item => {
                              const busca = searchValue.toLowerCase();
                              return (
                                item.produto_nome?.toLowerCase().includes(busca) ||
                                item.valorTotalItem.toLocaleString('pt-BR').includes(busca)
                              );
                            });

                            return estoqueFiltradoPorBusca
                              .sort((a, b) => b.valorTotalItem - a.valorTotalItem) // Ordenar do maior para o menor
                              .map((item, index) => {
                                const maxValor = Math.max(...estoqueFiltrado.map(e => (e.quantidade || 0) * (e.valor_estoque || 0)));
                                const percentualBarra = maxValor > 0 ? (item.valorTotalItem / maxValor) * 100 : 0;

                                return (
                                  <div
                                    key={item.id}
                                    className={`product-bar-item${selectedProduct === item.produto_nome ? ' active' : ''}`}
                                    title={`${item.produto_nome || 'Produto'}
Quantidade: ${item.quantidade || 0}
Preço Unitário: R$ ${(item.valor_estoque || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Total: R$ ${item.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    onClick={() => setSelectedProduct(item.produto_nome)}
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
                                        R$ {item.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                      ) : (
                        // Visualização em barras horizontais com quantidade em destaque
                        <div className="product-list">
                          {(() => {
                            // Filtrar estoque conforme lojas e período selecionados do modal
                            let estoqueFiltrado = estoqueComValor;
                            if (colabModalPeriodo !== 'all') {
                              estoqueFiltrado = estoqueFiltrado.filter(item => item.ano_mes === colabModalPeriodo);
                            }
                            if (getLojasSelecionadas('colaboradores').length > 0 && getLojasSelecionadas('colaboradores').length !== unidades.length) {
                              estoqueFiltrado = estoqueFiltrado.filter(item => getLojasSelecionadas('colaboradores').includes(String(item.unidade_id)));
                            }
                            // Aplicar filtro de busca
                            const estoqueFiltradoPorBusca = estoqueFiltrado.filter(item => {
                              const busca = searchQuantity.toLowerCase();
                              return (
                                item.unidades?.nome?.toLowerCase().includes(busca) ||
                                item.apelido_unidade?.toLowerCase().includes(busca) ||
                                item.produto_nome?.toLowerCase().includes(busca)
                              );
                            });

                            return estoqueFiltradoPorBusca
                              .sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0)) // Ordenar por quantidade (maior para menor)
                              .map((item, index) => {
                                const maxQuantidade = Math.max(...estoqueFiltrado.map(e => e.quantidade || 0));
                                const percentualBarra = maxQuantidade > 0 ? ((item.quantidade || 0) / maxQuantidade) * 100 : 0;

                                return (
                                  <div
                                    key={item.id}
                                    className={`product-bar-item${selectedProduct === item.produto_nome ? ' active' : ''}`}
                                    title={`${item.produto_nome || 'Produto'}\nQuantidade: ${item.quantidade || 0}\nPreço Unitário: R$ ${(item.valor_estoque || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nValor Total: R$ ${item.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    onClick={() => setSelectedProduct(item.produto_nome)}
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
                                        {item.quantidade || 0} un
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;