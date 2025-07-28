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

// Dados de exemplo para faturamento com categorias
const faturamentoData = [
    { unidade_id: 2, unidade_negocio: 2, ano_mes: '2025-01', itens_vendidos: 150, valor_venda: 15000, percentual_total: 25, valor_desconto: 1500, percentual_desconto: 10, valor_custo: 9000, percentual_custo: 60, valor_lucro: 4500, percentual_lucro: 30, categoria: 'bonificado' },
    { unidade_id: 3, unidade_negocio: 3, ano_mes: '2025-01', itens_vendidos: 200, valor_venda: 25000, percentual_total: 30, valor_desconto: 2500, percentual_desconto: 10, valor_custo: 15000, percentual_custo: 60, valor_lucro: 7500, percentual_lucro: 30, categoria: 'etico' },
    { unidade_id: 4, unidade_negocio: 4, ano_mes: '2025-01', itens_vendidos: 180, valor_venda: 18000, percentual_total: 22, valor_desconto: 1800, percentual_desconto: 10, valor_custo: 10800, percentual_custo: 60, valor_lucro: 5400, percentual_lucro: 30, categoria: 'perfumaria' },
    { unidade_id: 6, unidade_negocio: 6, ano_mes: '2025-01', itens_vendidos: 120, valor_venda: 12000, percentual_total: 15, valor_desconto: 1200, percentual_desconto: 10, valor_custo: 7200, percentual_custo: 60, valor_lucro: 3600, percentual_lucro: 30, categoria: 'oficinais' },
    { unidade_id: 7, unidade_negocio: 7, ano_mes: '2025-01', itens_vendidos: 100, valor_venda: 10000, percentual_total: 12, valor_desconto: 1000, percentual_desconto: 10, valor_custo: 6000, percentual_custo: 60, valor_lucro: 3000, percentual_lucro: 30, categoria: 'bonificado' },
    { unidade_id: 8, unidade_negocio: 8, ano_mes: '2025-01', itens_vendidos: 80, valor_venda: 8000, percentual_total: 10, valor_desconto: 800, percentual_desconto: 10, valor_custo: 4800, percentual_custo: 60, valor_lucro: 2400, percentual_lucro: 30, categoria: 'etico' },

    // Dados para fevereiro
    { unidade_id: 2, unidade_negocio: 2, ano_mes: '2025-02', itens_vendidos: 160, valor_venda: 16000, percentual_total: 25, valor_desconto: 1600, percentual_desconto: 10, valor_custo: 9600, percentual_custo: 60, valor_lucro: 4800, percentual_lucro: 30, categoria: 'bonificado' },
    { unidade_id: 3, unidade_negocio: 3, ano_mes: '2025-02', itens_vendidos: 220, valor_venda: 27000, percentual_total: 30, valor_desconto: 2700, percentual_desconto: 10, valor_custo: 16200, percentual_custo: 60, valor_lucro: 8100, percentual_lucro: 30, categoria: 'etico' },
    { unidade_id: 4, unidade_negocio: 4, ano_mes: '2025-02', itens_vendidos: 190, valor_venda: 19000, percentual_total: 22, valor_desconto: 1900, percentual_desconto: 10, valor_custo: 11400, percentual_custo: 60, valor_lucro: 5700, percentual_lucro: 30, categoria: 'perfumaria' },
    { unidade_id: 6, unidade_negocio: 6, ano_mes: '2025-02', itens_vendidos: 130, valor_venda: 13000, percentual_total: 15, valor_desconto: 1300, percentual_desconto: 10, valor_custo: 7800, percentual_custo: 60, valor_lucro: 3900, percentual_lucro: 30, categoria: 'oficinais' },
    { unidade_id: 7, unidade_negocio: 7, ano_mes: '2025-02', itens_vendidos: 110, valor_venda: 11000, percentual_total: 12, valor_desconto: 1100, percentual_desconto: 10, valor_custo: 6600, percentual_custo: 60, valor_lucro: 3300, percentual_lucro: 30, categoria: 'bonificado' },
    { unidade_id: 8, unidade_negocio: 8, ano_mes: '2025-02', itens_vendidos: 90, valor_venda: 9000, percentual_total: 10, valor_desconto: 900, percentual_desconto: 10, valor_custo: 5400, percentual_custo: 60, valor_lucro: 2700, percentual_lucro: 30, categoria: 'etico' }
];

// Dados de exemplo para colaboradores com categorias
const colaboradoresData = [
    { user_id: 'user1', user_name: 'João Silva', ano_mes: '2025-01', unidade_negocio: 2, itens_vendidos: 75, valor_venda: 7500, percentual_total: 25, valor_desconto: 750, percentual_desconto: 10, valor_custo: 4500, percentual_custo: 60, valor_lucro: 2250, percentual_lucro: 30, categoria: 'bonificado' },
    { user_id: 'user2', user_name: 'Maria Santos', ano_mes: '2025-01', unidade_negocio: 3, itens_vendidos: 100, valor_venda: 12500, percentual_total: 30, valor_desconto: 1250, percentual_desconto: 10, valor_custo: 7500, percentual_custo: 60, valor_lucro: 3750, percentual_lucro: 30, categoria: 'etico' },
    { user_id: 'user3', user_name: 'Pedro Costa', ano_mes: '2025-01', unidade_negocio: 4, itens_vendidos: 90, valor_venda: 9000, percentual_total: 22, valor_desconto: 900, percentual_desconto: 10, valor_custo: 5400, percentual_custo: 60, valor_lucro: 2700, percentual_lucro: 30, categoria: 'perfumaria' },
    { user_id: 'user4', user_name: 'Ana Oliveira', ano_mes: '2025-01', unidade_negocio: 6, itens_vendidos: 60, valor_venda: 6000, percentual_total: 15, valor_desconto: 600, percentual_desconto: 10, valor_custo: 3600, percentual_custo: 60, valor_lucro: 1800, percentual_lucro: 30, categoria: 'oficinais' },
    { user_id: 'user5', user_name: 'Carlos Lima', ano_mes: '2025-01', unidade_negocio: 7, itens_vendidos: 50, valor_venda: 5000, percentual_total: 12, valor_desconto: 500, percentual_desconto: 10, valor_custo: 3000, percentual_custo: 60, valor_lucro: 1500, percentual_lucro: 30, categoria: 'bonificado' },
    { user_id: 'user6', user_name: 'Lucia Ferreira', ano_mes: '2025-01', unidade_negocio: 8, itens_vendidos: 40, valor_venda: 4000, percentual_total: 10, valor_desconto: 400, percentual_desconto: 10, valor_custo: 2400, percentual_custo: 60, valor_lucro: 1200, percentual_lucro: 30, categoria: 'etico' }
];

async function insertCategorizedData() {
    console.log('🚀 Iniciando inserção de dados categorizados...');

    try {
        // Inserir dados de faturamento
        console.log('📊 Inserindo dados de faturamento...');
        const { data: faturamentoInserido, error: faturamentoError } = await supabase
            .from('faturamento')
            .insert(faturamentoData)
            .select();

        if (faturamentoError) {
            console.error('❌ Erro ao inserir faturamento:', faturamentoError);
            return;
        }

        console.log(`✅ ${faturamentoInserido.length} registros de faturamento inseridos`);

        // Inserir dados de colaboradores
        console.log('👥 Inserindo dados de colaboradores...');
        const { data: colaboradoresInserido, error: colaboradoresError } = await supabase
            .from('colaboradores')
            .insert(colaboradoresData)
            .select();

        if (colaboradoresError) {
            console.error('❌ Erro ao inserir colaboradores:', colaboradoresError);
            return;
        }

        console.log(`✅ ${colaboradoresInserido.length} registros de colaboradores inseridos`);

        console.log('🎉 Dados categorizados inseridos com sucesso!');

        // Mostrar alguns dados inseridos
        console.log('\n📋 Exemplo de dados inseridos:');
        console.log('Faturamento:', faturamentoInserido.slice(0, 3));
        console.log('Colaboradores:', colaboradoresInserido.slice(0, 3));

    } catch (error) {
        console.error('❌ Erro durante a inserção de dados:', error);
    }
}

// Executar o script
insertCategorizedData(); 