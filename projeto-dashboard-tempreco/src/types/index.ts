export interface DashboardFilters {
  periodo: string;
  unidade: string;
  categoria: string;
  searchCollaborator: string;
}

export interface Faturamento {
  id: number;
  data: string;
  valor: number;
  unidade_id: number;
  unidade_negocio: number;
  categoria: string;
  ano_mes: string;
  valor_venda: number;
  valor_custo: number;
  percentual_lucro: number;
  percentual_custo: number;
  itens_vendidos: number;
}

export interface Estoque2 {
  id: number;
  produto: string;
  produto_nome: string;
  quantidade: number;
  unidade_id: number;
  categoria: string;
  dias_estoque: number;
  ultima_venda_dias: number;
  ultima_compra_dias: number;
  ano_mes: string;
  valor_estoque: number;
  fabricante: string;
  unidades?: {
    nome: string;
  };
  apelido_unidade?: string;
  curva_qtd?: string;
}

export interface Unidade {
  id: number;
  nome: string;
  codigo: string;
}

export interface Colaborador {
  id: string;
  user_id: string;
  user_name: string;
  nome: string;
  unidade_id: number;
  unidade_negocio: number;
  cargo: string;
  ano_mes: string;
  valor_venda: number;
  valor_custo: number;
  valor_desconto: number;
  valor_lucro: number;
  itens_vendidos: number;
} 