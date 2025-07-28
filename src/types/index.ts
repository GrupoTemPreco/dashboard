export interface Unidade {
  id: number;
  nome: string;
  codigo: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Faturamento {
  id: number;
  unidade_id: number;
  unidade_negocio: number;
  ano_mes: string;
  itens_vendidos: number;
  valor_venda: number;
  percentual_total: number;
  valor_desconto: number;
  percentual_desconto: number;
  valor_custo: number;
  percentual_custo: number;
  valor_lucro: number;
  percentual_lucro: number;
  categoria?: string;
  created_at: string;
  updated_at: string;
  unidades?: Unidade;
}

export interface Produto {
  id: number;
  nome: string;
  codigo_barras: string;
  fabricante: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Estoque {
  id: number;
  unidade_id: number;
  produto_nome: string;
  fabricante: string;
  quantidade: number;
  valor_estoque: number;
  dias_estoque: number;
  data_atualizacao: string;
  created_at: string;
  updated_at: string;
  unidades?: Unidade;
}

export interface Estoque2 {
  id: number;
  unidade_id: number;
  produto_nome: string;
  fabricante: string;
  quantidade: number;
  valor_estoque: number;
  dias_estoque: number;
  data_atualizacao: string;
  data_estocagem: string;
  ano_mes: string; // YYYY-MM para filtro por mês
  necessidade: string;
  estoque_confirmado: number;
  comprar: number;
  curva_qtd: string;
  media_venda_mensal: number;
  estoque_final_dias: number;
  classificacao_principal: string;
  preco_venda_medio: number;
  ultima_venda_dias: number;
  transferencia_confirmada: number;
  comprar_dias: number;
  necessidade_dias: number;
  ultima_compra_dias: number;
  apelido_unidade: string;
  fornecedor_ultima_compra: string;
  media_venda_diaria: number;
  qtd_demanda: number;
  estoque_minimo: number;
  origem_estoque_minimo: string;
  custo: number;
  custo_medio: number;
  curva_valor: string;
  custo_x_necessidade: number;
  custo_x_estoque: number;
  ruptura_venda: number;
  necessidade_qtd: number;
  percentual_suprida_qtd: number;
  compra_confirmada: number;
  encomenda: number;
  categoria?: string;
  created_at: string;
  updated_at: string;
  unidades?: Unidade;
}

export interface VendaItem {
  id: number;
  produto_id: number;
  unidade_id: number;
  ano_mes: string;
  quantidade_vendida: number;
  valor_venda: number;
  valor_custo: number;
  valor_lucro: number;
  margem_bruta: number;
  created_at: string;
  updated_at: string;
  produtos?: Produto;
  unidades?: Unidade;
}

export interface DashboardFilters {
  periodo: string;
  unidade: string;
  categoria: string;
  searchCollaborator: string;
}

export interface DashboardMetrics {
  faturamento_total: number;
  dias_estoque: number;
  maior_tempo_estoque: string;
  media_margem_bruta: number;
  cmv: number;
  valor_total_estoque: number;
}

export interface Colaborador {
  id: number;
  user_id: string;
  user_name: string;
  ano_mes: string;
  unidade_negocio: number;
  itens_vendidos: number;
  valor_venda: number;
  percentual_total: number;
  valor_desconto: number;
  percentual_desconto: number;
  valor_custo: number;
  percentual_custo: number;
  valor_lucro: number;
  percentual_lucro: number;
  categoria?: string;
  created_at: string;
  updated_at: string;
  unidades?: Unidade;
}