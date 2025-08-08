import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Faturamento, VendaItem, Unidade, Colaborador } from '../types';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // Teste de conexão inicial
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔌 useSupabase - Testando conexão inicial...');
      try {
        // Teste 1: Unidades
        const { data: unidadesData, error: unidadesError } = await supabase
          .from('unidades')
          .select('*')
          .limit(1);
        
        if (unidadesError) {
          console.error('❌ useSupabase - Erro na tabela unidades:', unidadesError);
        } else {
          console.log('✅ useSupabase - Tabela unidades OK, dados:', unidadesData?.length || 0);
        }

        // Teste 2: Estoque_2
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_2')
          .select('*')
          .limit(1);
        
        if (estoqueError) {
          console.error('❌ useSupabase - Erro na tabela estoque_2:', estoqueError);
        } else {
          console.log('✅ useSupabase - Tabela estoque_2 OK, dados:', estoqueData?.length || 0);
        }

        // Teste 3: Faturamento
        const { data: faturamentoData, error: faturamentoError } = await supabase
          .from('faturamento')
          .select('*')
          .limit(1);
        
        if (faturamentoError) {
          console.error('❌ useSupabase - Erro na tabela faturamento:', faturamentoError);
        } else {
          console.log('✅ useSupabase - Tabela faturamento OK, dados:', faturamentoData?.length || 0);
        }

        console.log('✅ useSupabase - Conexão inicial OK');
      } catch (err) {
        console.error('❌ useSupabase - Erro geral na conexão inicial:', err);
      }
    };
    
    testConnection();
  }, []);

  const fetchFaturamento = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 fetchFaturamento - Iniciando busca...');
      console.log('🔍 fetchFaturamento - filtros recebidos:', filters);
      console.log('🔍 fetchFaturamento - Verificando conexão Supabase...');
      
      // Verificar se o cliente Supabase está disponível
      if (!supabase) {
        throw new Error('Cliente Supabase não está disponível');
      }
      
      console.log('🔍 fetchFaturamento - Cliente Supabase OK');

      // Teste simples primeiro - buscar todos os dados sem filtros
      const { error: _testError } = await supabase
        .from('faturamento')
        .select('*')
        .limit(5);

      let query = supabase
        .from('faturamento')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('ano_mes', { ascending: true });

      if (filters.unidade && filters.unidade !== 'all') {
        console.log('🔍 Aplicando filtro de unidade:', filters.unidade);
        query = query.eq('unidade_negocio', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        console.log('🔍 Aplicando filtro de período:', filters.periodo);
        query = query.eq('ano_mes', filters.periodo);
      }

      // Temporariamente desabilitado até a coluna categoria ser criada no banco
      // if (filters.categoria && filters.categoria !== 'all') {
      //   console.log('🔍 Aplicando filtro de categoria:', filters.categoria);
      //   query = query.eq('categoria', filters.categoria);
      // }

      const { data, error } = await query;

      if (error) throw error;
      console.log('🔍 Dados retornados do fetchFaturamento:', data?.length, 'registros');
      console.log('🔍 Meses nos dados retornados:', [...new Set(data?.map(item => item.ano_mes) || [])]);
      return data as Faturamento[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar faturamento');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Função auxiliar para aplicar filtro de categoria
  const applyCategoriaFilter = (query: any, categoria: string) => {
    if (categoria === 'perfumaria') {
      // Para perfumaria, usar termos principais para evitar query muito longa
      return query.or('classificacao_principal.ilike.%perfumaria%,classificacao_principal.ilike.%cosmeticos%,classificacao_principal.ilike.%beleza%,classificacao_principal.ilike.%cuidado%');
    } else {
      // Para outras categorias, usar mapeamento específico
      const categoriaMap: { [key: string]: string[] } = {
        'bonificado': [
          'bonificado', 
          'bonificado oneroso',
          'antibiotico',
          'generico',
          'generico oneroso',
          'psicotropicos'
        ],
        'medicamentos': [
          'antibiotico',
          'anticoncepcional',
          'cartelados',
          'controlado etico',
          'éticos geral'
        ],
        'oficinais': [
          'oficinais',
          'oficial',
          'oficinais linha eletro',
          'oficinais linha geral',
          'produtos naturais'
        ]
      };

      const categoriasParaBuscar = categoriaMap[categoria] || [];
      if (categoriasParaBuscar.length > 0) {
        const orConditions = categoriasParaBuscar.map(cat => 
          `classificacao_principal.ilike.%${cat}%`
        );
        return query.or(orConditions.join(','));
      }
    }
    return query;
  };

  const fetchEstoque = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 fetchEstoque - Iniciando busca de estoque...');
      console.log('🔍 fetchEstoque - Verificando conexão Supabase...');
      
      // Verificar se o cliente Supabase está disponível
      if (!supabase) {
        throw new Error('Cliente Supabase não está disponível');
      }
      
      console.log('🔍 fetchEstoque - Cliente Supabase OK');
      console.log('🔍 Filtros recebidos:', filters);
      console.log('🔍 Filtro unidade específico:', filters.unidade);
      console.log('🔍 Tipo do filtro unidade:', typeof filters.unidade);
      console.log('🔍 Filtro unidade é string?', typeof filters.unidade === 'string');
      console.log('🔍 Filtro unidade é number?', typeof filters.unidade === 'number');
      console.log('🔍 Filtro unidade é "all"?', filters.unidade === 'all');
      console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔍 Supabase Key configurado:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

      let query = supabase
        .from('estoque_2')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('valor_estoque', { ascending: false })
        .order('produto_nome', { ascending: true });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        console.log('🔍 Aplicando filtro de unidade:', filters.unidade);
        console.log('🔍 Tipo do filtro unidade antes da query:', typeof filters.unidade);
        
        // Converter para número se for string
        const unidadeId = typeof filters.unidade === 'string' ? parseInt(filters.unidade, 10) : filters.unidade;
        console.log('🔍 unidadeId convertido:', unidadeId);
        console.log('🔍 unidadeId é válido?', !isNaN(unidadeId));
        
        if (!isNaN(unidadeId)) {
          query = query.eq('unidade_id', unidadeId);
          console.log('🔍 Query após aplicar filtro de unidade:', query);
        } else {
          console.log('❌ Erro: unidade_id inválido:', filters.unidade);
        }
      } else {
        console.log('🔍 NÃO aplicando filtro de unidade - valor:', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        console.log('🔍 Aplicando filtro de período:', filters.periodo);
        query = query.eq('ano_mes', filters.periodo);
      }

      // Filtro de busca universal (se fornecido)
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        console.log('🔍 Aplicando filtro de busca universal:', searchTerm);
        // Busca apenas no nome do produto por enquanto
        query = query.ilike('produto_nome', `%${searchTerm}%`);
      }

      // Filtro de categoria baseado na Classificação Principal
      if (filters.categoria && filters.categoria !== 'all') {
        console.log('🔍 Aplicando filtro de categoria:', filters.categoria);
        query = applyCategoriaFilter(query, filters.categoria);
      }

      // Buscar total de registros primeiro (sem paginação)
      let countQuery = supabase
        .from('estoque_2')
        .select('*', { count: 'exact', head: true });

      // Aplicar os mesmos filtros para a contagem
      if (filters.unidade && filters.unidade !== 'all') {
        console.log('🔍 Aplicando filtro de unidade na contagem:', filters.unidade);
        const unidadeId = typeof filters.unidade === 'string' ? parseInt(filters.unidade, 10) : filters.unidade;
        console.log('🔍 unidadeId para contagem:', unidadeId);
        if (!isNaN(unidadeId)) {
          countQuery = countQuery.eq('unidade_id', unidadeId);
        }
      }

      if (filters.periodo && filters.periodo !== 'all') {
        countQuery = countQuery.eq('ano_mes', filters.periodo);
      }

      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        countQuery = countQuery.ilike('produto_nome', `%${searchTerm}%`);
      }

      // Aplicar filtro de categoria na contagem também
      if (filters.categoria && filters.categoria !== 'all') {
        console.log('🔍 Aplicando filtro de categoria na contagem:', filters.categoria);
        countQuery = applyCategoriaFilter(countQuery, filters.categoria);
      }

      console.log('🔍 Executando countQuery...');
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('❌ Erro na contagem:', countError);
        throw countError;
      }

      console.log('🔍 Total de registros encontrados:', totalCount);

      // CORREÇÃO: Se não há filtros específicos, retornar TODOS os dados sem paginação
      if (!filters.unidade || filters.unidade === 'all') {
        console.log('🔍 Buscando TODOS os dados sem paginação...');
        
        // Teste adicional: query simples sem joins
        console.log('🔍 Teste adicional - Query simples sem joins...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('estoque_2')
          .select('*')
          .limit(5);
        
        if (simpleError) {
          console.error('❌ Erro na query simples:', simpleError);
        } else {
          console.log('🔍 Query simples retornou:', simpleData?.length || 0, 'registros');
          console.log('🔍 Primeiros registros da query simples:', simpleData?.slice(0, 2));
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro na consulta estoque_2:', error);
          throw error;
        }

        console.log('🔍 Dados retornados do fetchEstoque (TODOS):', data?.length, 'registros');
        console.log('🔍 Primeiros 3 registros para debug:', data?.slice(0, 3).map(item => ({
          id: item.id,
          produto_nome: item.produto_nome,
          unidade_id: item.unidade_id,
          quantidade: item.quantidade
        })));

        return {
          data: data || [],
          totalCount: data?.length || 0,
          currentPage: 1,
          totalPages: 1,
          pageSize: data?.length || 0
        };
      }

      // Aplicar paginação apenas se houver filtros específicos
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 1000; // Aumentar pageSize para 1000
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      console.log('🔍 Executando query com paginação...');
      console.log('🔍 Query final:', query);
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro na consulta estoque_2:', error);
        throw error;
      }

      console.log('🔍 Dados retornados do fetchEstoque:', data?.length, 'registros');
      console.log('🔍 Primeiros 3 registros para debug:', data?.slice(0, 3).map(item => ({
        id: item.id,
        produto_nome: item.produto_nome,
        unidade_id: item.unidade_id,
        quantidade: item.quantidade
      })));

      // Retornar com total real do banco
      return {
        data: data || [],
        totalCount: totalCount || 0,
        currentPage: page,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
        pageSize
      };
    } catch (err) {
      console.error('❌ Erro em fetchEstoque:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar estoque_2');
      return {
        data: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
        pageSize: filters.pageSize || 1000
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstoque2 = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 fetchEstoque2 - Iniciando busca de estoque...');
      console.log('🔍 Filtros recebidos:', filters);

      let query = supabase
        .from('estoque_2')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('valor_estoque', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        console.log('🔍 Aplicando filtro de unidade:', filters.unidade);
        query = query.eq('unidade_id', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        console.log('🔍 Aplicando filtro de período:', filters.periodo);
        query = query.eq('ano_mes', filters.periodo);
      }

      // Filtro de categoria baseado na Classificação Principal
      if (filters.categoria && filters.categoria !== 'all') {
        console.log('🔍 Aplicando filtro de categoria:', filters.categoria);
        query = applyCategoriaFilter(query, filters.categoria);
      }

      console.log('🔍 Executando query...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro na consulta estoque_2:', error);
        throw error;
      }

      console.log('🔍 Dados retornados do fetchEstoque2:', data?.length, 'registros');
      console.log('🔍 Primeiros 3 registros:', data?.slice(0, 3));
      console.log('🔍 Todos os produtos encontrados:', data?.map(item => item.produto_nome));

      return data;
    } catch (err) {
      console.error('❌ Erro em fetchEstoque2:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar estoque_2');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Unidade[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar unidades');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVendasPorItem = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('vendas_item')
        .select(`
          *,
          produtos(nome, fabricante),
          unidades(nome, codigo)
        `)
        .gte('ano_mes', '2025-01') // Excluir dezembro 2024 e anteriores
        .order('valor_venda', { ascending: false });

      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_id', filters.unidade);
      }

      if (filters.periodo) {
        query = query.eq('ano_mes', filters.periodo);
      }

      // Temporariamente desabilitado até a coluna categoria ser criada no banco
      // if (filters.categoria && filters.categoria !== 'all') {
      //   query = query.eq('categoria', filters.categoria);
      // }

      const { data, error } = await query;

      if (error) throw error;
      return data as VendaItem[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar vendas por item');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCMV = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      // CMV é calculado a partir dos dados de faturamento
      // Não precisamos de uma tabela separada
      let query = supabase
        .from('faturamento')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('ano_mes', { ascending: true });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_negocio', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        query = query.eq('ano_mes', filters.periodo);
      }

      // Temporariamente desabilitado até a coluna categoria ser criada no banco
      // if (filters.categoria && filters.categoria !== 'all') {
      //   query = query.eq('categoria', filters.categoria);
      // }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados de CMV');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchColaboradores = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('colaboradores')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('ano_mes', { ascending: true });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_negocio', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        query = query.eq('ano_mes', filters.periodo);
      }

      // Temporariamente desabilitado até a coluna categoria ser criada no banco
      // if (filters.categoria && filters.categoria !== 'all') {
      //   query = query.eq('categoria', filters.categoria);
      // }

      if (filters.user_id && filters.user_id !== 'all') {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Colaborador[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar colaboradores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    supabase,
    fetchFaturamento,
    fetchEstoque,
    fetchEstoque2,
    fetchUnidades,
    fetchVendasPorItem,
    fetchCMV,
    fetchColaboradores
  };
};