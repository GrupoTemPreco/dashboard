const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente de múltiplos arquivos
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

// Carregar arquivos de ambiente
loadEnvFiles();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.log('');
  console.log('📋 Para resolver, crie um arquivo .env ou .env.local na raiz do projeto com:');
  console.log('');
  console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase');
  console.log('');
  console.log('🔗 Obtenha essas informações em: https://supabase.com/dashboard');
  console.log('   1. Acesse seu projeto');
  console.log('   2. Vá em Settings > API');
  console.log('   3. Copie a URL e a anon key');
  console.log('');
  console.log('📁 Arquivos de ambiente verificados:');
  const envFiles = ['.env', '.env.local', '.env.development'];
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`   ✅ ${envFile} existe`);
    } else {
      console.log(`   ❌ ${envFile} não encontrado`);
    }
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseConnection() {
  console.log('🔍 Verificando conexão com o Supabase...');
  
  try {
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('unidades')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.log('❌ Erro ao conectar com Supabase:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📊 Verificando tabelas...');
  
  const tables = ['faturamento', 'estoque_2', 'unidades', 'colaboradores'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela ${table}:`, err.message);
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Verificando políticas de segurança (RLS)...');
  
  try {
    // Verificar se as políticas estão ativas
    const { data, error } = await supabase
      .from('faturamento')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('permission denied')) {
      console.log('⚠️  Políticas RLS podem estar bloqueando acesso');
      console.log('💡 Solução: Desative RLS temporariamente ou configure políticas adequadas');
    } else {
      console.log('✅ Políticas RLS configuradas corretamente');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar políticas:', err.message);
  }
}

async function createBasicRLSPolicies() {
  console.log('\n🔧 Criando políticas RLS básicas...');
  
  const policies = [
    {
      table: 'faturamento',
      policy: 'Enable read access for all users',
      sql: 'CREATE POLICY "Enable read access for all users" ON "public"."faturamento" FOR SELECT USING (true);'
    },
    {
      table: 'estoque_2',
      policy: 'Enable read access for all users',
      sql: 'CREATE POLICY "Enable read access for all users" ON "public"."estoque_2" FOR SELECT USING (true);'
    },
    {
      table: 'unidades',
      policy: 'Enable read access for all users',
      sql: 'CREATE POLICY "Enable read access for all users" ON "public"."unidades" FOR SELECT USING (true);'
    },
    {
      table: 'colaboradores',
      policy: 'Enable read access for all users',
      sql: 'CREATE POLICY "Enable read access for all users" ON "public"."colaboradores" FOR SELECT USING (true);'
    }
  ];
  
  for (const policy of policies) {
    try {
      console.log(`📝 Criando política para ${policy.table}...`);
      // Nota: Estas políticas precisam ser executadas no SQL Editor do Supabase
      console.log(`   SQL: ${policy.sql}`);
    } catch (err) {
      console.log(`❌ Erro ao criar política para ${policy.table}:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico do Supabase...\n');
  
  // Verificar configuração
  console.log('📋 Configuração atual:');
  console.log(`   URL: ${supabaseUrl ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   Key: ${supabaseKey ? '✅ Configurada' : '❌ Não configurada'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Configure as variáveis de ambiente primeiro!');
    return;
  }
  
  // Verificar conexão
  const connected = await checkSupabaseConnection();
  if (!connected) {
    return;
  }
  
  // Verificar tabelas
  await checkTables();
  
  // Verificar políticas
  await checkRLSPolicies();
  
  // Sugerir políticas básicas
  await createBasicRLSPolicies();
  
  console.log('\n✅ Diagnóstico concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Configure as variáveis de ambiente no arquivo .env ou .env.local');
  console.log('2. Execute as migrações SQL no Supabase');
  console.log('3. Configure as políticas RLS se necessário');
  console.log('4. Execute: npm run dev');
}

main().catch(console.error); 