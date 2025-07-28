import React from 'react';

interface DashboardFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  unidades?: any[];
  availablePeriods?: any[];
  setSelectedMonth?: (month: string | null) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filters, onFiltersChange, unidades = [], availablePeriods = [], setSelectedMonth }) => {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg shadow">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Período
        </label>
        <select
          value={filters.periodo}
          onChange={(e) => onFiltersChange({ ...filters, periodo: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="all">Todos</option>
          <option value="month">Mês Atual</option>
          <option value="quarter">Trimestre</option>
          <option value="year">Ano</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unidade
        </label>
        <select
          value={filters.unidade}
          onChange={(e) => onFiltersChange({ ...filters, unidade: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="all">Todas</option>
          {unidades.map(unidade => (
            <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoria
        </label>
        <select
          value={filters.categoria}
          onChange={(e) => onFiltersChange({ ...filters, categoria: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="all">Todas</option>
        </select>
      </div>
    </div>
  );
};

export default DashboardFilters; 