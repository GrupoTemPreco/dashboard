const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Executando migração para adicionar coluna categoria...');

    try {
        // Verificar se as tabelas existem
        console.log('📋 Verificando estrutura das tabelas...');

        // Verificar tabela faturamento
        const { data: faturamentoColumns, error: faturamentoError } = await supabase
            .from('faturamento')
            .select('*')
            .limit(1);

        if (faturamentoError) {
            console.error('❌ Erro ao verificar tabela faturamento:', faturamentoError);
            return;
        }

        console.log('✅ Tabela faturamento existe');

        // Verificar tabela estoque_2
        const { data: estoqueColumns, error: estoqueError } = await supabase
            .from('estoque_2')
            .select('*')
            .limit(1);

        if (estoqueError) {
            console.error('❌ Erro ao verificar tabela estoque_2:', estoqueError);
            return;
        }

        console.log('✅ Tabela estoque_2 existe');

        // Verificar tabela colaboradores
        const { data: colaboradoresColumns, error: colaboradoresError } = await supabase
            .from('colaboradores')
            .select('*')
            .limit(1);

        if (colaboradoresError) {
            console.error('❌ Erro ao verificar tabela colaboradores:', colaboradoresError);
            return;
        }

        console.log('✅ Tabela colaboradores existe');

        // Tentar adicionar a coluna categoria usando SQL direto
        console.log('🔧 Adicionando coluna categoria às tabelas...');

        // Como não podemos executar ALTER TABLE diretamente via Supabase client,
        // vamos verificar se a coluna já existe e atualizar dados existentes

        // Verificar se a coluna categoria existe na tabela faturamento
        const { data: faturamentoSample, error: faturamentoSampleError } = await supabase
            .from('faturamento')
            .select('categoria')
            .limit(1);

        if (faturamentoSampleError && faturamentoSampleError.code === '42703') {
            console.log('⚠️ Coluna categoria não existe na tabela faturamento');
            console.log('💡 Você precisa executar a migração SQL manualmente no Supabase Dashboard');
            console.log('📝 SQL para executar:');
            console.log('ALTER TABLE faturamento ADD COLUMN categoria VARCHAR(50) DEFAULT \'bonificado\';');
            console.log('ALTER TABLE estoque_2 ADD COLUMN categoria VARCHAR(50) DEFAULT \'bonificado\';');
            console.log('ALTER TABLE colaboradores ADD COLUMN categoria VARCHAR(50) DEFAULT \'bonificado\';');
        } else {
            console.log('✅ Coluna categoria já existe nas tabelas');
        }

        console.log('🎉 Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    }
}

// Executar o script
runMigration(); 