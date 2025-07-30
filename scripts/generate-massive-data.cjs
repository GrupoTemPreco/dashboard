const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de exemplo para produtos farmacêuticos
const produtos = [
  'WEGOVY 2,4MG+4AG NOVOFLEX PEN 2,4MG/0,75ML',
  'WEGOVY 1,7MG+4AG NOVOFLEX PEN 1,7MG/0,75ML',
  'RYBELSUS 7MG CX 30 COMP REVESTIDOS',
  'RYBELSUS 14MG CX 30 COMP REVESTIDOS',
  'GLYXAMBI 25/5 MG C/30 COMP REVESTIDOS',
  'TRELEGY 100+62 5+25MCG 30 CAPS',
  'TRESIBA FLEXTOUCH 100U C/5 CANETAS',
  'OZEMPIC 2MG/1,5ML PEN 2MG/1,5ML',
  'JARDIANCE 25MG CX 30 COMP REVESTIDOS',
  'XARELTO 20MG CX 30 COMP REVESTIDOS',
  'ELIQUIS 5MG CX 60 COMP REVESTIDOS',
  'PRADAXA 150MG CX 60 CAPS DURAS',
  'XARELTO 15MG CX 30 COMP REVESTIDOS',
  'ELIQUIS 2,5MG CX 60 COMP REVESTIDOS',
  'PRADAXA 110MG CX 60 CAPS DURAS',
  'JARDIANCE 10MG CX 30 COMP REVESTIDOS',
  'OZEMPIC 1MG/1,5ML PEN 1MG/1,5ML',
  'TRESIBA FLEXTOUCH 200U C/5 CANETAS',
  'TRELEGY 100+62 5+25MCG 60 CAPS',
  'GLYXAMBI 12,5/5 MG C/30 COMP REVESTIDOS'
];

const fabricantes = [
  'NOVO NORDISK',
  'SANOFI',
  'BOEHRINGER INGELHEIM',
  'BAYER',
  'PFIZER',
  'JANSSEN',
  'MERCK',
  'ASTRAZENECA',
  'ROCHE',
  'LILLY'
];

const unidades = [
  { id: 1, nome: 'Farmácia Central', apelido: 'CENTRAL' },
  { id: 2, nome: 'Farmácia Norte', apelido: 'NORTE' },
  { id: 3, nome: 'Farmácia Sul', apelido: 'SUL' },
  { id: 4, nome: 'Farmácia Leste', apelido: 'LESTE' },
  { id: 5, nome: 'Farmácia Oeste', apelido: 'OESTE' }
];

// Função para gerar dados aleatórios
const generateRandomData = (count) => {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const produto = produtos[Math.floor(Math.random() * produtos.length)];
    const fabricante = fabricantes[Math.floor(Math.random() * fabricantes.length)];
    const unidade = unidades[Math.floor(Math.random() * unidades.length)];
    
    // Gerar quantidade entre 1 e 10000
    const quantidade = Math.floor(Math.random() * 10000) + 1;
    
    // Gerar valor de estoque entre 10 e 5000
    const valor_estoque = Math.random() * 5000 + 10;
    
    // Gerar dias de estoque entre 1 e 365
    const dias_estoque = Math.floor(Math.random() * 365) + 1;
    
    // Gerar última venda entre 1 e 180 dias atrás
    const ultima_venda_dias = Math.floor(Math.random() * 180) + 1;
    
    // Gerar última compra entre 1 e 365 dias atrás
    const ultima_compra_dias = Math.floor(Math.random() * 365) + 1;
    
    data.push({
      produto_nome: produto,
      fabricante: fabricante,
      quantidade: quantidade,
      valor_estoque: valor_estoque,
      dias_estoque: dias_estoque,
      ultima_venda_dias: ultima_venda_dias,
      ultima_compra_dias: ultima_compra_dias,
      unidade_id: unidade.id,
      apelido_unidade: unidade.apelido,
      unidades: {
        nome: unidade.nome,
        codigo: unidade.apelido
      }
    });
  }
  
  return data;
};

// Função principal
const generateMassiveData = async () => {
  try {
    console.log('🚀 Iniciando geração de dados massivos...');
    
    // Gerar 47.641 registros (como mostrado na imagem)
    const totalRecords = 47641;
    const batchSize = 1000; // Inserir em lotes de 1000
    const batches = Math.ceil(totalRecords / batchSize);
    
    console.log(`📊 Gerando ${totalRecords.toLocaleString('pt-BR')} registros em ${batches} lotes...`);
    
    for (let batch = 0; batch < batches; batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalRecords);
      const currentBatchSize = endIndex - startIndex;
      
      console.log(`📦 Processando lote ${batch + 1}/${batches} (${currentBatchSize} registros)...`);
      
      const batchData = generateRandomData(currentBatchSize);
      
      const { data, error } = await supabase
        .from('estoque_2')
        .insert(batchData);
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${batch + 1}:`, error);
        continue;
      }
      
      console.log(`✅ Lote ${batch + 1} inserido com sucesso!`);
      
      // Pequena pausa entre lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Dados massivos gerados com sucesso!');
    console.log(`📈 Total de registros inseridos: ${totalRecords.toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Erro durante a geração de dados:', error);
  }
};

// Executar o script
generateMassiveData(); 