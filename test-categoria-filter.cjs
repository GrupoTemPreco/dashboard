// Teste da função applyCategoriaFilter
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para aplicar filtro de categoria (copiada do useSupabase.ts)
const applyCategoriaFilter = (query, categoria) => {
  console.log('🔍 applyCategoriaFilter - categoria recebida:', categoria);
  console.log('🔍 applyCategoriaFilter - tipo da categoria:', typeof categoria);
  
  if (categoria === 'perfumaria') {
    console.log('🔍 applyCategoriaFilter - aplicando filtro para perfumaria');
    return query.or('classificacao_principal.ilike.%perfumaria%,classificacao_principal.ilike.%cosmeticos%,classificacao_principal.ilike.%beleza%,classificacao_principal.ilike.%cuidado%');
  } else {
    console.log('🔍 applyCategoriaFilter - aplicando filtro para outras categorias');
    const categoriaMap = {
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
    console.log('🔍 applyCategoriaFilter - categorias para buscar:', categoriasParaBuscar);
    
    if (categoriasParaBuscar.length > 0) {
      const orConditions = categoriasParaBuscar.map(cat => 
        `classificacao_principal.ilike.%${cat}%`
      );
      console.log('🔍 applyCategoriaFilter - condições OR:', orConditions);
      return query.or(orConditions.join(','));
    }
  }
  console.log('🔍 applyCategoriaFilter - retornando query sem modificação');
  return query;
};

async function testCategoriaFilter() {
  console.log('🧪 Testando filtro de categoria...');
  
  try {
    // Teste 1: Buscar todos os dados sem filtro
    console.log('\n📊 Teste 1: Todos os dados');
    const { data: todosDados, error: error1 } = await supabase
      .from('estoque_2')
      .select('*');
    
    if (error1) {
      console.error('❌ Erro ao buscar todos os dados:', error1);
      return;
    }
    
    console.log(`✅ Total de registros: ${todosDados.length}`);
    console.log('📋 Classificações encontradas:', [...new Set(todosDados.map(item => item.classificacao_principal))]);
    
    // Teste 2: Filtro de categoria 'bonificado'
    console.log('\n📊 Teste 2: Filtro categoria "bonificado"');
    let query = supabase.from('estoque_2').select('*');
    query = applyCategoriaFilter(query, 'bonificado');
    
    const { data: dadosBonificado, error: error2 } = await query;
    
    if (error2) {
      console.error('❌ Erro ao buscar dados bonificado:', error2);
      return;
    }
    
    console.log(`✅ Registros com categoria bonificado: ${dadosBonificado.length}`);
    console.log('📋 Produtos bonificados:', dadosBonificado.map(item => item.produto_nome));
    
    // Teste 3: Filtro de categoria 'perfumaria'
    console.log('\n📊 Teste 3: Filtro categoria "perfumaria"');
    query = supabase.from('estoque_2').select('*');
    query = applyCategoriaFilter(query, 'perfumaria');
    
    const { data: dadosPerfumaria, error: error3 } = await query;
    
    if (error3) {
      console.error('❌ Erro ao buscar dados perfumaria:', error3);
      return;
    }
    
    console.log(`✅ Registros com categoria perfumaria: ${dadosPerfumaria.length}`);
    console.log('📋 Produtos perfumaria:', dadosPerfumaria.map(item => item.produto_nome));
    
    // Teste 4: Filtro de categoria 'oficinais'
    console.log('\n📊 Teste 4: Filtro categoria "oficinais"');
    query = supabase.from('estoque_2').select('*');
    query = applyCategoriaFilter(query, 'oficinais');
    
    const { data: dadosOficinais, error: error4 } = await query;
    
    if (error4) {
      console.error('❌ Erro ao buscar dados oficinais:', error4);
      return;
    }
    
    console.log(`✅ Registros com categoria oficinais: ${dadosOficinais.length}`);
    console.log('📋 Produtos oficinais:', dadosOficinais.map(item => item.produto_nome));
    
    console.log('\n🎉 Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

testCategoriaFilter(); 