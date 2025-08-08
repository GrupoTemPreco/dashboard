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

async function checkDataInTables() {
  console.log('🔍 Verificando dados nas tabelas...\n');
  
  const tables = ['faturamento', 'estoque_2', 'unidades', 'colaboradores'];
  
  for (const table of tables) {
    try {
      console.log(`📊 Verificando tabela: ${table}`);
      
      // Contar registros
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ Erro ao contar ${table}:`, countError.message);
        continue;
      }
      
      console.log(`   📈 Total de registros: ${count}`);
      
      // Buscar alguns registros de exemplo
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (error) {
        console.log(`❌ Erro ao buscar dados de ${table}:`, error.message);
      } else {
        console.log(`   📋 Primeiros registros:`);
        if (data && data.length > 0) {
          data.forEach((row, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(row).substring(0, 100)}...`);
          });
        } else {
          console.log(`      ⚠️  Nenhum registro encontrado`);
        }
      }
      
      console.log('');
    } catch (err) {
      console.log(`❌ Erro ao verificar ${table}:`, err.message);
    }
  }
}

async function checkRLSStatus() {
  console.log('🔒 Verificando status do RLS...\n');
  
  try {
    // Verificar se conseguimos acessar dados com RLS ativo
    const { data, error } = await supabase
      .from('faturamento')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro de acesso:', error.message);
      if (error.message.includes('permission denied')) {
        console.log('💡 RLS pode estar bloqueando o acesso');
      }
    } else {
      console.log('✅ Acesso aos dados funcionando');
      console.log(`📊 Dados encontrados: ${data?.length || 0} registros`);
    }
  } catch (err) {
    console.log('❌ Erro ao verificar RLS:', err.message);
  }
}

async function main() {
  console.log('🚀 Verificando dados e configurações...\n');
  
  await checkDataInTables();
  await checkRLSStatus();
  
  console.log('✅ Verificação concluída!');
}

main().catch(console.error); 