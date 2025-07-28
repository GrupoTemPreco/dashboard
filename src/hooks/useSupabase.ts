import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Faturamento, VendaItem, Unidade, Colaborador } from '../types';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFaturamento = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 fetchFaturamento - filtros recebidos:', filters);

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
        .gte('ano_mes', '2025-01') // Excluir dezembro 2024 e anteriores
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

  const fetchEstoque = useCallback(async (filters: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('estoque_2')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .gte('ano_mes', '2025-01') // Excluir dezembro 2024 e anteriores
        .order('valor_estoque', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_id', filters.unidade);
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar estoque_2');
      return [];
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

      // Temporariamente desabilitado até a coluna categoria ser criada no banco
      // if (filters.categoria && filters.categoria !== 'all') {
      //   console.log('🔍 Aplicando filtro de categoria:', filters.categoria);
      //   query = query.eq('categoria', filters.categoria);
      // }

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
      let query = supabase
        .from('faturamento')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .gte('ano_mes', '2025-01') // Excluir dezembro 2024 e anteriores
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar CMV');
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
        .gte('ano_mes', '2025-01') // Excluir dezembro 2024 e anteriores
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