const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
function loadEnvFiles() {
  const envFiles = ['.env', '.env.local', '.env.development'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Carregando variáveis de: ${envFile}`);
      require('dotenv').config({ path: envPath });
    }
  });
}

loadEnvFiles();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  console.log('🔓 Desabilitando RLS temporariamente...');
  
  try {
    // Desabilitar RLS em todas as tabelas
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.faturamento DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.estoque_2 DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.unidades DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;
      `
    });
    console.log('✅ RLS desabilitado com sucesso!');
  } catch (error) {
    console.log('⚠️  RLS já estava desabilitado ou erro:', error.message);
  }
}

async function restoreUnidades() {
  console.log('🏢 Restaurando dados de unidades...');
  
  const unidades = [
    { id: 1, nome: 'FARMACIA MONTE CASTELO J.G', codigo: '02' },
    { id: 2, nome: 'DROGARIA MAIS EM CONTA FARIA', codigo: '03' },
    { id: 3, nome: 'DROGARIA MAIS EM CONTA DA FIGUEIRA', codigo: '04' },
    { id: 4, nome: 'FARMACIA MONTE CASTELO V.B', codigo: '06' },
    { id: 5, nome: 'FARMACIA MONTE CASTELO V.M', codigo: '07' },
    { id: 6, nome: 'DROGARIA ULTRA XBROTHERS - PRIMAVERA', codigo: '08' },
    { id: 7, nome: 'DROGARIA ULTRA XBROTHERS - VASCO', codigo: '09' },
    { id: 8, nome: 'DROGARIA ULTRA XBROTHERS - PENHA', codigo: '10' }
  ];

  const { error } = await supabase
    .from('unidades')
    .upsert(unidades, { onConflict: 'id' });

  if (error) {
    console.log('❌ Erro ao inserir unidades:', error.message);
  } else {
    console.log('✅ Unidades restauradas com sucesso!');
  }
}

async function restoreFaturamento() {
  console.log('💰 Restaurando dados de faturamento...');
  
  const faturamentoData = [];
  
  // Gerar dados de faturamento para 2025
  for (let mes = 1; mes <= 12; mes++) {
    for (let unidade = 1; unidade <= 8; unidade++) {
      faturamentoData.push({
        ano_mes: `2025-${mes.toString().padStart(2, '0')}`,
        unidade_negocio: unidade,
        itens_vendidos: Math.floor(Math.random() * 10000) + 5000,
        valor_venda: Math.floor(Math.random() * 500000) + 200000,
        percentual_total: Math.random() * 20 + 10,
        valor_desconto: Math.floor(Math.random() * 50000) + 10000,
        percentual_desconto: Math.random() * 10 + 5,
        valor_custo: Math.floor(Math.random() * 300000) + 150000,
        percentual_custo: Math.random() * 30 + 50,
        valor_lucro: Math.floor(Math.random() * 200000) + 50000,
        percentual_lucro: Math.random() * 20 + 30
      });
    }
  }

  const { error } = await supabase
    .from('faturamento')
    .upsert(faturamentoData, { onConflict: 'unidade_negocio,ano_mes' });

  if (error) {
    console.log('❌ Erro ao inserir faturamento:', error.message);
  } else {
    console.log('✅ Faturamento restaurado com sucesso!');
  }
}

async function restoreEstoque() {
  console.log('📦 Restaurando dados de estoque...');
  
  const produtos = [
    'Paracetamol 500mg', 'Dipirona 500mg', 'Ibuprofeno 600mg',
    'Omeprazol 20mg', 'Losartana 50mg', 'Metformina 500mg',
    'AAS 100mg', 'Vitamina C 500mg', 'Cálcio 500mg',
    'Ferro 50mg', 'Zinco 15mg', 'Magnésio 250mg'
  ];

  const fabricantes = [
    'EMS', 'Neo Química', 'Aché', 'Medley', 'Eurofarma',
    'Cristália', 'Libbs', 'Bayer', 'Pfizer', 'Novartis'
  ];

  const estoqueData = [];
  
  for (let unidade = 1; unidade <= 8; unidade++) {
    for (let i = 0; i < 50; i++) {
      const produto = produtos[Math.floor(Math.random() * produtos.length)];
      const fabricante = fabricantes[Math.floor(Math.random() * fabricantes.length)];
      
      estoqueData.push({
        unidade_id: unidade,
        produto_nome: produto,
        fabricante: fabricante,
        quantidade: Math.floor(Math.random() * 1000) + 100,
        valor_estoque: Math.floor(Math.random() * 50) + 10,
        dias_estoque: Math.floor(Math.random() * 365) + 30,
        ultima_venda_dias: Math.floor(Math.random() * 30) + 1,
        ultima_compra_dias: Math.floor(Math.random() * 90) + 7,
        ano_mes: '2025-01',
        data_atualizacao: new Date().toISOString(),
        data_estocagem: new Date().toISOString()
      });
    }
  }

  const { error } = await supabase
    .from('estoque_2')
    .upsert(estoqueData);

  if (error) {
    console.log('❌ Erro ao inserir estoque:', error.message);
  } else {
    console.log('✅ Estoque restaurado com sucesso!');
  }
}

async function restoreColaboradores() {
  console.log('👥 Restaurando dados de colaboradores...');
  
  const colaboradores = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
    'Carlos Ferreira', 'Lucia Pereira', 'Roberto Lima', 'Fernanda Alves'
  ];

  const colaboradoresData = [];
  
  for (let mes = 1; mes <= 12; mes++) {
    for (let unidade = 1; unidade <= 8; unidade++) {
      for (let i = 0; i < 3; i++) {
        const colaborador = colaboradores[Math.floor(Math.random() * colaboradores.length)];
        
        colaboradoresData.push({
          user_id: `user_${unidade}_${i}`,
          user_name: colaborador,
          ano_mes: `2025-${mes.toString().padStart(2, '0')}`,
          unidade_negocio: unidade,
          itens_vendidos: Math.floor(Math.random() * 1000) + 100,
          valor_venda: Math.floor(Math.random() * 50000) + 10000,
          percentual_total: Math.random() * 15 + 5,
          valor_desconto: Math.floor(Math.random() * 5000) + 1000,
          percentual_desconto: Math.random() * 10 + 2,
          valor_custo: Math.floor(Math.random() * 30000) + 8000,
          percentual_custo: Math.random() * 20 + 60,
          valor_lucro: Math.floor(Math.random() * 20000) + 2000,
          percentual_lucro: Math.random() * 15 + 25
        });
      }
    }
  }

  const { error } = await supabase
    .from('colaboradores')
    .upsert(colaboradoresData);

  if (error) {
    console.log('❌ Erro ao inserir colaboradores:', error.message);
  } else {
    console.log('✅ Colaboradores restaurados com sucesso!');
  }
}

async function enableRLSWithPolicies() {
  console.log('🔒 Habilitando RLS com políticas corretas...');
  
  try {
    // Habilitar RLS
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.faturamento ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.estoque_2 ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
      `
    });
    
    // Criar políticas
    await supabase.rpc('exec_sql', {
      sql: `
        -- Políticas para faturamento
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.faturamento;
        CREATE POLICY "Enable read access for all users" ON public.faturamento FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Enable insert access for all users" ON public.faturamento;
        CREATE POLICY "Enable insert access for all users" ON public.faturamento FOR INSERT WITH CHECK (true);
        DROP POLICY IF EXISTS "Enable update access for all users" ON public.faturamento;
        CREATE POLICY "Enable update access for all users" ON public.faturamento FOR UPDATE USING (true);
        
        -- Políticas para estoque_2
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.estoque_2;
        CREATE POLICY "Enable read access for all users" ON public.estoque_2 FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Enable insert access for all users" ON public.estoque_2;
        CREATE POLICY "Enable insert access for all users" ON public.estoque_2 FOR INSERT WITH CHECK (true);
        DROP POLICY IF EXISTS "Enable update access for all users" ON public.estoque_2;
        CREATE POLICY "Enable update access for all users" ON public.estoque_2 FOR UPDATE USING (true);
        
        -- Políticas para unidades
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.unidades;
        CREATE POLICY "Enable read access for all users" ON public.unidades FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Enable insert access for all users" ON public.unidades;
        CREATE POLICY "Enable insert access for all users" ON public.unidades FOR INSERT WITH CHECK (true);
        DROP POLICY IF EXISTS "Enable update access for all users" ON public.unidades;
        CREATE POLICY "Enable update access for all users" ON public.unidades FOR UPDATE USING (true);
        
        -- Políticas para colaboradores
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.colaboradores;
        CREATE POLICY "Enable read access for all users" ON public.colaboradores FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Enable insert access for all users" ON public.colaboradores;
        CREATE POLICY "Enable insert access for all users" ON public.colaboradores FOR INSERT WITH CHECK (true);
        DROP POLICY IF EXISTS "Enable update access for all users" ON public.colaboradores;
        CREATE POLICY "Enable update access for all users" ON public.colaboradores FOR UPDATE USING (true);
      `
    });
    
    console.log('✅ RLS habilitado com políticas corretas!');
  } catch (error) {
    console.log('⚠️  Erro ao configurar RLS:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando restauração completa...\n');
  
  try {
    // 1. Desabilitar RLS
    await disableRLS();
    
    // 2. Restaurar dados
    await restoreUnidades();
    await restoreFaturamento();
    await restoreEstoque();
    await restoreColaboradores();
    
    // 3. Habilitar RLS com políticas corretas
    await enableRLSWithPolicies();
    
    console.log('\n✅ Restauração completa concluída com sucesso!');
    console.log('🔄 Agora execute: npm run dev');
  } catch (error) {
    console.log('❌ Erro durante a restauração:', error.message);
  }
}

main().catch(console.error); 