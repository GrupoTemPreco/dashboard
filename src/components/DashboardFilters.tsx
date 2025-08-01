import React from 'react';
import { Filter, Calendar, Building } from 'lucide-react';
import { DashboardFilters as FilterType } from '../types';

interface DashboardFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  unidades: { id: number; nome: string; codigo: string }[];
  availablePeriods?: { value: string; label: string }[];
  setSelectedMonth?: (mes: string | null) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  unidades,
  availablePeriods = []
  // setSelectedMonth
}) => {
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

  const handleFilterChange = (key: keyof FilterType, value: string) => {
    console.log('🎛️ Mudança de filtro no componente:', key, 'valor:', value);
    console.log('🎛️ Tipo do valor:', typeof value);
    console.log('🎛️ Valor é string?', typeof value === 'string');
    console.log('🎛️ Valor é number?', !isNaN(parseInt(value, 10)));
    console.log('🎛️ Valor convertido para número:', parseInt(value, 10));
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Usar apenas períodos disponíveis nos dados, excluindo qualquer coisa de 2024
  const periodos = [
    { value: 'all', label: 'Todos os períodos' },
    ...availablePeriods.filter(periodo =>
      periodo.value !== '2024-12' &&
      !periodo.value.includes('2024') &&
      !periodo.label.toLowerCase().includes('dezembro')
    )
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4" />
        Filtros
      </h3>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Período
          </label>
          <select
            value={filters.periodo}
            onChange={(e) => {
              console.log('🎛️ Select onChange - valor selecionado:', e.target.value);
              console.log('🎛️ Opções disponíveis:', periodos);
              handleFilterChange('periodo', e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {periodos.map(periodo => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="inline h-4 w-4 mr-1" />
            Unidade
          </label>
          <select
            value={filters.unidade}
            onChange={(e) => handleFilterChange('unidade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todas as unidades</option>
            {unidades.map(unidade => (
              <option key={unidade.id} value={unidade.id}>
                {getLojaCode(unidade.nome)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={filters.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todas as categorias</option>
            <option value="bonificado">Bonificado</option>
                            <option value="medicamentos">Medicamentos</option>
            <option value="perfumaria">Perfumaria</option>
            <option value="oficinais">Oficinais</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;