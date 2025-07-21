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
  X as XIcon,
  Package as PackageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ChartCard from './ChartCard';
import ExcelImporter from './ExcelImporter';
import DashboardFilters from './DashboardFilters';
import { useSupabase } from '../hooks/useSupabase';
import { DashboardFilters as FilterType, Faturamento, Estoque2, Unidade } from '../types';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterType>({
    periodo: 'all',
    unidade: 'all',
    categoria: 'all'
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

  const { loading, error, fetchFaturamento, fetchEstoque, fetchUnidades, fetchCMV, fetchColaboradores } = useSupabase();

  useEffect(() => {
    loadData();
  }, []);

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
    const [faturamentoData, estoqueData, unidadesData, cmvDataResult, colaboradoresData] = await Promise.all([
      fetchFaturamento(filters),
      fetchEstoque(),
      fetchUnidades(),
      fetchCMV(filters),
      fetchColaboradores(filters)
    ]);

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

  // Função para lidar com clique no gráfico de faturamento
  const handleFaturamentoBarClick = (mes: string) => {
    setSelectedMonth(selectedMonth === mes ? null : mes);
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedMonth(null);
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
    setFilters(newFilters);
    // Limpar seleção quando mudar filtros
    setSelectedMonth(null);
  };

  // Função para alternar visualização do estoque
  const toggleEstoqueView = () => {
    setEstoqueViewType(prev => prev === 'bars' ? 'list' : 'bars');
  };

  const calculateMetrics = () => {
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

    if (selectedMonth) {
      dadosParaCalculo = faturamento.filter(item => item.ano_mes === selectedMonth);
      if (selectedProduct) {
        estoqueParaCalculo = estoque.filter(item => item.ano_mes === selectedMonth && item.produto_nome === selectedProduct);
      } else {
        estoqueParaCalculo = estoque.filter(item => {
          const ultimaVendaDias = item.ultima_venda_dias || 0;
          const ultimaCompraDias = item.ultima_compra_dias || 0;
          const diasEstoque = item.dias_estoque || 0;
          const faixaDias = mesParaDias[selectedMonth as keyof typeof mesParaDias];
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
    if (selectedProduct && (!selectedMonth)) {
      estoqueParaCalculoProduto = estoqueParaCalculo.filter(item => item.produto_nome === selectedProduct);
    }
    if (selectedProduct && selectedMonth) {
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
    const meses = [...new Set(faturamento.map(item => item.ano_mes))].sort();
    return meses.map(mes => ({
      value: mes,
      label: format(new Date(mes + '-01'), 'MMMM yyyy', { locale: ptBR })
    }));
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
            {selectedMonth && (
              <div className="flex items-center gap-2 mt-2">
                <Filter size={16} className="text-blue-600" />
                <span className="text-sm text-gray-600">
                  Mês selecionado: {selectedMonth}
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
                <div className="metric-card faturamento" style={{ '--metric-color': getMetricColor(metrics.faturamentoTotal, 'faturamento') } as React.CSSProperties}>
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

                <div className="metric-card dias-estoque">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">
                        Dias no Estoque
                        {selectedMonth && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Filtrado: {selectedMonth})
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
                        {selectedMonth && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Filtrado: {selectedMonth})
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

                <div className="metric-card margem-bruta" style={{ '--metric-color': getMetricColor(metrics.mediaMargemBruta, 'margem') } as React.CSSProperties}>
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

                <div className="metric-card cmv" style={{ '--metric-color': getMetricColor(metrics.cmvPercent, 'cmv') } as React.CSSProperties}>
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
              </div>

              {/* Charts Grid */}
              <div className="charts-grid">
                {/* Faturamento Chart */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">Faturamento</div>
                    <div className="chart-actions">
                      <div className="chart-action">
                        <Info size={16} />
                      </div>
                    </div>
                  </div>
                  <ChartCard
                    title=""
                    type="bar"
                    data={chartData.faturamentoChartData}
                    onBarClick={handleFaturamentoBarClick}
                    getTooltipExtra={(label) => {
                      // label é o ano_mes (ex: '2025-06')
                      if (!selectedProduct) return undefined;
                      const estoqueDoProduto = estoque.filter(item => item.ano_mes === label && item.produto_nome === selectedProduct && (filters.unidade === 'all' || String(item.unidade_id) === String(filters.unidade)));
                      if (estoqueDoProduto.length === 0) return 'Sem dados de estoque';
                      const mediaDias = Math.round(estoqueDoProduto.reduce((acc, item) => acc + (item.dias_estoque || 0), 0) / estoqueDoProduto.length);
                      return `Dias no estoque: ${mediaDias}`;
                    }}
                  />
                </div>

                {/* Valor de Estoque */}
                <div className="chart-card">
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

                  {estoqueViewType === 'bars' ? (
                    // Visualização em barras (padrão)
                    <div className="product-list">
                      {estoqueFiltradoPorValor
                        .sort((a, b) => b.valorTotalItem - a.valorTotalItem) // Ordenar do maior para o menor
                        .map((item, index) => {
                          const maxValor = Math.max(...estoqueComValor.map(e => (e.quantidade || 0) * (e.valor_estoque || 0)));
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
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="bar-label">
                                {item.produto_nome || 'Produto'} ({item.unidade_id || 'N/A'})
                              </div>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${percentualBarra}%`,
                                    minWidth: '20px'
                                  }}
                                ></div>
                                <div className="bar-value">
                                  R$ {item.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    // Visualização em barras horizontais com quantidade em destaque
                    <div className="product-list">
                      {estoqueFiltradoPorUnidade
                        .sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0)) // Ordenar por quantidade (maior para menor)
                        .map((item, index) => {
                          const maxQuantidade = Math.max(...estoqueComValor.map(e => e.quantidade || 0));
                          const percentualBarra = maxQuantidade > 0 ? ((item.quantidade || 0) / maxQuantidade) * 100 : 0;

                          return (
                            <div
                              key={item.id}
                              className={`product-bar-item${selectedProduct === item.produto_nome ? ' active' : ''}`}
                              title={`${item.produto_nome || 'Produto'}\nQuantidade: ${item.quantidade || 0}\nPreço Unitário: R$ ${(item.valor_estoque || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nValor Total: R$ ${item.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              onClick={() => setSelectedProduct(item.produto_nome)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="bar-label">
                                {item.produto_nome || 'Produto'} ({item.unidade_id || 'N/A'})
                              </div>
                              <div className="bar-container">
                                <div
                                  className="bar-fill quantidade-estoque-bar"
                                  style={{
                                    width: `${percentualBarra}%`,
                                    minWidth: '20px'
                                  }}
                                ></div>
                                <div className="bar-value quantidade-estoque-value">
                                  <PackageIcon size={12} className="mr-1" />
                                  {item.quantidade || 0} un
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div className="charts-grid">
                {/* Resumo Vendas */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Resumo Vendas por Loja
                      {selectedMonth && (
                        <span className="text-sm text-blue-600 ml-2">
                          • {selectedMonth}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="vendas-vertical-list">
                    {(() => {
                      // Calcular faturamento anual por loja (100%)
                      const faturamentoAnualPorLoja = faturamento.reduce((acc, item) => {
                        const lojaId = item.unidade_negocio;
                        if (!acc[lojaId]) {
                          acc[lojaId] = {
                            loja_id: lojaId,
                            valor_anual: 0,
                            itens_anual: 0
                          };
                        }

                        acc[lojaId].valor_anual += item.valor_venda || 0;
                        acc[lojaId].itens_anual += item.itens_vendidos || 0;

                        return acc;
                      }, {} as Record<string, any>);

                      // Calcular faturamento do mês selecionado por loja
                      const faturamentoMesPorLoja = selectedMonth
                        ? faturamento.filter(item => item.ano_mes === selectedMonth).reduce((acc, item) => {
                          const lojaId = item.unidade_negocio;
                          if (!acc[lojaId]) {
                            acc[lojaId] = {
                              loja_id: lojaId,
                              valor_mes: 0,
                              itens_mes: 0
                            };
                          }

                          acc[lojaId].valor_mes += item.valor_venda || 0;
                          acc[lojaId].itens_mes += item.itens_vendidos || 0;

                          return acc;
                        }, {} as Record<string, any>)
                        : {};

                      // Combinar dados e ordenar
                      const lojasCompletas = Object.keys(faturamentoAnualPorLoja).map(lojaId => {
                        const anual = faturamentoAnualPorLoja[lojaId];
                        const mes = faturamentoMesPorLoja[lojaId] || { valor_mes: 0, itens_mes: 0 };

                        return {
                          loja_id: lojaId,
                          valor_anual: anual.valor_anual,
                          valor_mes: mes.valor_mes,
                          itens_anual: anual.itens_anual,
                          itens_mes: mes.itens_mes,
                          percentual_mes: anual.valor_anual > 0 ? (mes.valor_mes / anual.valor_anual) * 100 : 0
                        };
                      }).sort((a, b) => b.valor_anual - a.valor_anual);

                      return lojasCompletas.map((loja, index) => {
                        const maxValorAnual = Math.max(...lojasCompletas.map(l => l.valor_anual));
                        const percentualBarraAnual = maxValorAnual > 0 ? (loja.valor_anual / maxValorAnual) * 100 : 0;
                        const percentualBarraMes = percentualBarraAnual * (loja.percentual_mes / 100);

                        // Calcular altura real da barra em pixels (150px é a altura máxima)
                        const alturaBarraMes = (percentualBarraMes / 100) * 150;
                        const alturaBarraAnual = (percentualBarraAnual / 100) * 150;

                        // Usar a altura da barra que está sendo mostrada
                        const alturaBarraAtual = selectedMonth ? alturaBarraMes : alturaBarraAnual;

                        // Calcular posição do número (acima do final da barra)
                        // Barras mais altas = números mais altos
                        const posicaoNumero = Math.max(150 - alturaBarraAtual - 45, 5);



                        return (
                          <div
                            key={loja.loja_id}
                            className="venda-vertical-item"
                            title={`Loja ${loja.loja_id}
${selectedMonth ? `Período: ${selectedMonth}` : 'Total Geral'}
Faturamento Anual: R$ ${loja.valor_anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${selectedMonth ? `Faturamento ${selectedMonth}: R$ ${loja.valor_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
${selectedMonth ? `Percentual: ${loja.percentual_mes.toFixed(1)}%` : ''}
Itens Anuais: ${loja.itens_anual}`}
                          >
                            <div className="venda-vertical-bar-container">
                              {/* Barra do ano (100%) - mais clara */}
                              <div
                                className="venda-vertical-bar-fill venda-vertical-bar-anual"
                                style={{
                                  height: `${percentualBarraAnual}%`,
                                  minHeight: '20px'
                                }}
                              ></div>
                              {/* Barra do mês selecionado - mais escura */}
                              {selectedMonth && (
                                <div
                                  className="venda-vertical-bar-fill venda-vertical-bar-mes"
                                  style={{
                                    height: `${percentualBarraMes}%`,
                                    minHeight: '20px'
                                  }}
                                ></div>
                              )}
                              <div
                                className="venda-vertical-value"
                                style={{
                                  top: `${posicaoNumero}px`
                                }}
                              >
                                {selectedMonth
                                  ? `R$ ${loja.valor_mes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                                  : `R$ ${loja.valor_anual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                                }
                              </div>
                            </div>
                            <div className="venda-vertical-label">
                              Loja {loja.loja_id}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

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
              </div>

              <div className="charts-grid">
                {/* Média Dias de Estoque */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Média Dias de Estoque por Lojas
                      {selectedMonth && (
                        <span className="text-sm text-blue-600 ml-2">
                          • Filtrado: {selectedMonth}
                        </span>
                      )}
                    </div>
                    <div className="chart-actions">
                      <div className="chart-action">
                        <Info size={16} />
                      </div>
                    </div>
                  </div>
                  <ChartCard
                    title=""
                    type="bar"
                    data={chartData.diasEstoqueChartData}
                    formatType="days"
                  />
                </div>

                {/* CMV */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      CMV por Loja (Menor = Melhor)
                      {selectedMonth && (
                        <span className="text-sm text-blue-600 ml-2">
                          • Filtrado: {selectedMonth}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="cmv-list">
                    {(() => {
                      // Agrupar por loja e calcular totais
                      const cmvFiltrado = selectedMonth
                        ? cmvData.filter(item => item.ano_mes === selectedMonth)
                        : cmvData;
                      const cmvPorLoja = cmvFiltrado.reduce((acc, item) => {
                        const unidadeId = item.unidade_negocio;
                        if (!acc[unidadeId]) {
                          acc[unidadeId] = {
                            unidade_negocio: unidadeId,
                            valor_venda_total: 0,
                            valor_custo_total: 0,
                            itens_vendidos_total: 0,
                            percentual_custo_medio: 0,
                            periodos: []
                          };
                        }

                        acc[unidadeId].valor_venda_total += item.valor_venda || 0;
                        acc[unidadeId].valor_custo_total += item.valor_custo || 0;
                        acc[unidadeId].itens_vendidos_total += item.itens_vendidos || 0;
                        acc[unidadeId].periodos.push(item.ano_mes);

                        return acc;
                      }, {} as Record<string, any>);

                      // Calcular CMV médio por loja
                      const lojasComCMV = Object.values(cmvPorLoja).map((loja: any) => ({
                        ...loja,
                        percentual_custo_medio: loja.valor_venda_total > 0
                          ? (loja.valor_custo_total / loja.valor_venda_total) * 100
                          : 0
                      }));

                      // Ordenar do menor CMV para o maior (quanto menor melhor)
                      return lojasComCMV
                        .sort((a, b) => a.percentual_custo_medio - b.percentual_custo_medio)
                        .map((loja, index) => (
                          <div
                            key={loja.unidade_negocio}
                            className="cmv-item hover:bg-gray-50 transition-colors duration-200 rounded-lg p-3"
                            title={`Loja ${loja.unidade_negocio}
${selectedMonth ? `Período: ${selectedMonth}` : 'Total Geral'}
Valor de Venda: R$ ${loja.valor_venda_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor de Custo: R$ ${loja.valor_custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
CMV: ${loja.percentual_custo_medio.toFixed(1)}%
Itens Vendidos: ${loja.itens_vendidos_total}
${!selectedMonth ? `Períodos: ${loja.periodos.join(', ')}` : ''}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="cmv-percentage font-bold text-gray-900">
                                Loja {loja.unidade_negocio}: {loja.percentual_custo_medio.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-600">
                                R$ {loja.valor_venda_total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {selectedMonth ? selectedMonth : 'Total Geral'} • {loja.itens_vendidos_total} itens
                            </div>
                            <div className="relative mt-2">
                              <div
                                className="cmv-bar h-3 rounded-full transition-all duration-300 ease-out"
                                style={{
                                  width: `${Math.min(loja.percentual_custo_medio, 100)}%`,
                                  background: index < 3
                                    ? 'linear-gradient(90deg, #10b981, #22c55e)'
                                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
                                  boxShadow: index < 3
                                    ? '0 2px 4px rgba(16, 185, 129, 0.3)'
                                    : '0 2px 4px rgba(220, 38, 38, 0.3)'
                                }}
                              ></div>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Dashboard de Colaboradores
            <div className="colaboradores-dashboard">
              {/* Métricas de Colaboradores */}
              <div className="metrics-grid">
                <div className="metric-card faturamento">
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

                <div className="metric-card dias-estoque">
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

                <div className="metric-card margem-bruta">
                  <div className="metric-header">
                    <div>
                      <div className="metric-title">Faturamento Total</div>
                      <div className="metric-value">
                        R$ {colaboradores.reduce((acc, c) => acc + c.valor_venda, 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="metric-icon">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>

                {/* Campo de Pesquisa de Colaborador */}
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

              {/* Gráficos de Colaboradores */}
              <div className="charts-grid">
                {/* Campanha 2 para 3 - Ticket Médio por Colaborador */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Ticket Médio por Colaborador
                    </div>
                  </div>
                  <div className="colaboradores-list">
                    {colaboradoresMetrics.ticketMedioPorColaborador?.map((colaborador: any, index: number) => (
                      <div key={colaborador.user_id} className="colaborador-item">
                        <div className="colaborador-info">
                          <span className="colaborador-name">
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
                              width: `${Math.min((colaborador.ticket_medio / 100) * 100, 100)}%`,
                              background: index < 5 ? 'linear-gradient(90deg, #10b981, #22c55e)' :
                                index < 10 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                  'linear-gradient(90deg, #dc2626, #ef4444)'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Médio por Loja */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Ticket Médio por Loja
                    </div>
                  </div>
                  <div className="lojas-list">
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
                              width: `${Math.min((loja.ticket_medio / 100) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Margem Bruta por Loja */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Margem Bruta por Loja
                    </div>
                  </div>
                  <div className="lojas-list">
                    {colaboradoresMetrics.lojasPorMargem?.map((loja: any) => (
                      <div key={loja.loja_id} className="loja-item">
                        <div className="loja-info">
                          <span className="loja-name">LOJA {loja.loja_id}</span>
                          <span className="loja-value">{loja.margem_bruta.toFixed(1)}%</span>
                        </div>
                        <div className="loja-bar-container">
                          <div
                            className="loja-bar-fill"
                            style={{
                              width: `${Math.min(loja.margem_bruta, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantidade de Vendas por Colaborador */}
                <div className="chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      Quantidade de Vendas por Colaborador
                      <span className="text-xs text-blue-600 ml-2">
                        (Clique no nome para filtrar)
                      </span>
                      {selectedCollaborator && (
                        <span className="text-xs text-green-600 ml-2">
                          (Filtrado por colaborador)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="colaboradores-list">
                    {colaboradoresMetrics.colaboradoresPorQuantidade?.map((colaborador: any, index: number) => (
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
                    ))}
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
    </div>
  );
};


export default Dashboard;