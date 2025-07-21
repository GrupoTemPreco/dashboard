# 📊 Dashboard de Análise de Vendas e Estoque

Um dashboard moderno e responsivo para análise de dados de vendas e estoque, baseado na imagem de referência fornecida.

## 🚀 Características

- **Layout Fiel à Referência**: Interface baseada na imagem fornecida com barra lateral e métricas específicas
- **Importação de Planilhas Excel**: Sistema completo para importar dados de planilhas Excel
- **Gráficos Interativos**: Visualizações de faturamento, vendas por loja, estoque e CMV
- **Filtros Dinâmicos**: Filtros por período, loja e categoria
- **Banco de Dados Supabase**: Backend robusto com PostgreSQL
- **Interface Responsiva**: Design moderno com Tailwind CSS

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuita)

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd projeto-dashboard-tempreco
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o banco de dados**
- Acesse o painel do Supabase
- Execute a migração SQL em `supabase/migrations/20250717165420_silent_tooth.sql`
- Ou use o CLI do Supabase:
```bash
supabase db push
```

5. **Gere dados de exemplo (opcional)**
```bash
node scripts/generate-sample-data.js
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 📊 Estrutura do Dashboard

### **Barra Lateral**
- Navegação principal (Home, Usuários, Relatórios, Estratégia, Financeiro)
- Lista de lojas disponíveis
- Filtros de período (Mês/Ano)

### **Métricas Principais**
- **Faturamento**: Valor total das vendas
- **Dias no Estoque**: Média de dias que produtos ficam em estoque
- **Maior Tempo no Estoque**: Produto com maior tempo em estoque
- **Média Margem Bruta**: Percentual médio de lucro
- **CMV**: Custo das Mercadorias Vendidas

### **Gráficos e Tabelas**
- **Faturamento por Mês**: Gráfico de barras com evolução mensal
- **Resumo Vendas**: Vendas por loja
- **Projeção de Faturamento**: Projeções para o mês atual
- **Média Dias de Estoque**: Por loja
- **Valor de Estoque**: Lista dos produtos com maior valor
- **CMV**: Percentual por loja

## 📁 Estrutura do Projeto

```
projeto-dashboard-tempreco/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Componente principal do dashboard
│   │   ├── ExcelImporter.tsx      # Importador de planilhas Excel
│   │   ├── FileUpload.tsx         # Upload de arquivos CSV
│   │   ├── MetricCard.tsx         # Cards de métricas
│   │   ├── ChartCard.tsx          # Componente de gráficos
│   │   └── DashboardFilters.tsx   # Filtros do dashboard
│   ├── hooks/
│   │   └── useSupabase.ts         # Hook para integração com Supabase
│   ├── lib/
│   │   └── supabase.ts            # Configuração do Supabase
│   ├── types/
│   │   └── index.ts               # Definições de tipos TypeScript
│   └── App.tsx                    # Componente raiz da aplicação
├── supabase/
│   └── migrations/
│       └── 20250717165420_silent_tooth.sql  # Estrutura do banco
├── scripts/
│   └── generate-sample-data.js    # Script para dados de exemplo
└── package.json
```

## 📈 Importação de Dados

### **Via Planilha Excel**
1. Acesse a aba "Importar Excel" no dashboard
2. Selecione sua planilha Excel
3. O sistema mapeará automaticamente as colunas:
   - Ano-mês
   - Itens
   - Venda
   - % Tot.
   - Desconto
   - %
   - Custo
   - %
   - Lucro
   - %
   - Cód. Un. Neg.

### **Formato Esperado**
```csv
Ano-mês,Itens,Venda,% Tot.,Desconto,%,Custo,%,Lucro,%,Cód. Un. Neg.
2025-01,36526.00,428360.94,13.31,226656.23,34.60,258300.95,60.30,170059.99,39.70,02
```

## 🗄️ Estrutura do Banco de Dados

### **Tabelas Principais**
- `unidades`: Lojas/unidades de negócio
- `faturamento`: Dados de vendas por período
- `produtos`: Catálogo de produtos
- `estoque`: Controle de estoque
- `vendas_item`: Histórico detalhado de vendas

### **Relacionamentos**
- `faturamento.unidade_id` → `unidades.id`
- `estoque.produto_id` → `produtos.id`
- `estoque.unidade_id` → `unidades.id`

## 🎨 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Gráficos**: Chart.js
- **Backend**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Ícones**: Lucide React

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint

# Gerar dados de exemplo
node scripts/generate-sample-data.js
```

## 📝 Configuração do Supabase

1. **Crie um projeto no Supabase**
2. **Configure as variáveis de ambiente**:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```
3. **Execute a migração** para criar as tabelas
4. **Configure as políticas de segurança** (RLS)

## 🚀 Deploy

### **Vercel (Recomendado)**
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### **Netlify**
1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente
3. Build command: `npm run build`
4. Publish directory: `dist`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se as variáveis de ambiente estão configuradas
3. Verifique se o banco de dados foi configurado corretamente
4. Abra uma issue no repositório

## 🔄 Atualizações Futuras

- [ ] Sistema de autenticação
- [ ] Relatórios em PDF
- [ ] Notificações em tempo real
- [ ] API REST completa
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)

---

**Desenvolvido com ❤️ para análise de dados de vendas e estoque** 