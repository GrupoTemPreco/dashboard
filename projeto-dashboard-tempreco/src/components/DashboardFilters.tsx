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
  availablePeriods = [],
  setSelectedMonth
}) => {
  const handleFilterChange = (key: keyof FilterType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Usar períodos disponíveis se fornecidos, senão usar padrão
  const periodos = availablePeriods.length > 0
    ? [
      ...availablePeriods,
      { value: 'all', label: 'Todos os períodos' }
    ]
    : [
      { value: '2025-01', label: 'Janeiro 2025' },
      { value: '2025-02', label: 'Fevereiro 2025' },
      { value: '2025-03', label: 'Março 2025' },
      { value: '2025-04', label: 'Abril 2025' },
      { value: '2025-05', label: 'Maio 2025' },
      { value: '2025-06', label: 'Junho 2025' },
      { value: '2025-07', label: 'Julho 2025' },
      { value: 'all', label: 'Todos os períodos' }
    ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5" />
        Filtros
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Período
          </label>
          <select
            value={filters.periodo}
            onChange={(e) => {
              handleFilterChange('periodo', e.target.value);
              if (typeof setSelectedMonth === 'function') {
                setSelectedMonth(e.target.value === 'all' ? null : e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periodos.map(periodo => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="inline h-4 w-4 mr-1" />
            Unidade
          </label>
          <select
            value={filters.unidade}
            onChange={(e) => handleFilterChange('unidade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas as unidades</option>
            {unidades.map(unidade => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome}
              </option>
            ))}
          </select>
        </div>
        {/* Filtro de categoria removido conforme solicitado */}
      </div>
    </div>
  );
};

export default DashboardFilters;