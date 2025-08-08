const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se o arquivo .env.local existe e contém:');
  console.error('VITE_SUPABASE_URL=...');
  console.error('VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function limparEstoque() {
  console.log('🧹 Iniciando limpeza da tabela estoque_2...');
  
  try {
    // Verificar quantos registros existem
    const { count, error: countError } = await supabase
      .from('estoque_2')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Registros encontrados na tabela estoque_2: ${count}`);
    
    if (count === 0) {
      console.log('✅ Tabela já está vazia!');
      return;
    }
    
    // Confirmar limpeza
    console.log('⚠️ ATENÇÃO: Isso vai deletar TODOS os registros da tabela estoque_2!');
    console.log('Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');
    
    // Aguardar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Deletar todos os registros
    const { error: deleteError } = await supabase
      .from('estoque_2')
      .delete()
      .neq('id', 0); // Deletar todos os registros
    
    if (deleteError) {
      console.error('❌ Erro ao deletar registros:', deleteError);
      return;
    }
    
    console.log('✅ Todos os registros foram deletados com sucesso!');
    
    // Verificar se a tabela está vazia
    const { count: countAfter, error: countAfterError } = await supabase
      .from('estoque_2')
      .select('*', { count: 'exact', head: true });
    
    if (countAfterError) {
      console.error('❌ Erro ao verificar tabela após limpeza:', countAfterError);
      return;
    }
    
    console.log(`📊 Registros restantes na tabela estoque_2: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('🎉 Tabela estoque_2 limpa com sucesso!');
      console.log('✅ Agora você pode importar a planilha com dados limpos.');
    } else {
      console.log('⚠️ Ainda existem registros na tabela. Verifique as permissões RLS.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparEstoque();
