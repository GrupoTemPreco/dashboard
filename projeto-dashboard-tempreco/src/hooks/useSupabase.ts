import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Faturamento, VendaItem, Unidade, Estoque, Estoque2, Colaborador } from '../types';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFaturamento = async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Teste simples primeiro - buscar todos os dados sem filtros
      const { error: testError } = await supabase
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
        query = query.eq('unidade_negocio', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        query = query.eq('ano_mes', filters.periodo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Faturamento[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar faturamento');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEstoque = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('estoque_2')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('valor_estoque', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estoque_2');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEstoque2 = async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('estoque_2')
        .select(`
          *,
          unidades(nome, codigo)
        `)
        .order('valor_estoque', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_id', filters.unidade);
      }

      if (filters.periodo && filters.periodo !== 'all') {
        query = query.eq('ano_mes', filters.periodo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estoque_2');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
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
  };

  const fetchVendasPorItem = async (filters: any = {}) => {
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
        .order('valor_venda', { ascending: false });

      if (filters.unidade && filters.unidade !== 'all') {
        query = query.eq('unidade_id', filters.unidade);
      }

      if (filters.periodo) {
        query = query.eq('ano_mes', filters.periodo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as VendaItem[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar vendas por item');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCMV = async (filters: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
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

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar CMV');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchColaboradores = async (filters: any = {}) => {
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
  };

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