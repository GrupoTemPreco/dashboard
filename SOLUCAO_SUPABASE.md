# 🔧 Solução para Problemas do Supabase

## 🚨 Problema Identificado

Baseado na análise do código e da imagem do Supabase, o problema está relacionado à **configuração das variáveis de ambiente** e às **políticas de segurança das tabelas** que aparecem como "Unrestricted".

## 📋 Passo a Passo para Resolver

### **Passo 1: Configurar Variáveis de Ambiente**

1. **Crie um arquivo `.env` na raiz do projeto:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

2. **Obtenha as credenciais do Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em **Settings > API**
   - Copie a **Project URL** e **anon public key**

### **Passo 2: Corrigir Políticas de Segurança**

1. **Acesse o SQL Editor do Supabase:**
   - No painel do Supabase, vá em **SQL Editor**
   - Execute o script: `supabase/migrations/fix_security_issues.sql`

2. **Ou execute manualmente no SQL Editor:**

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE public.faturamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;

-- Ou criar políticas adequadas
CREATE POLICY "Enable read access for all users" ON public.faturamento
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.estoque_2
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.unidades
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.colaboradores
    FOR SELECT USING (true);
```

### **Passo 3: Verificar a Conexão**

Execute o script de diagnóstico:

```bash
node scripts/fix-supabase-issues.js
```

### **Passo 4: Executar Migrações**

1. **Execute as migrações existentes:**
```bash
# Se você tem o Supabase CLI instalado
supabase db push

# Ou execute manualmente no SQL Editor:
# - create_colaboradores_table.sql
# - create_estoque_2_table.sql
# - create_unidades_table.sql
# - add_categoria_column.sql
```

### **Passo 5: Gerar Dados de Exemplo (Opcional)**

```bash
node scripts/generate-sample-data.js
```

### **Passo 6: Testar a Aplicação**

```bash
npm run dev
```

## 🔍 Diagnóstico Automático

O script `scripts/fix-supabase-issues.js` irá:

- ✅ Verificar se as variáveis de ambiente estão configuradas
- ✅ Testar a conexão com o Supabase
- ✅ Verificar se as tabelas existem
- ✅ Identificar problemas de políticas RLS
- ✅ Sugerir correções específicas

## 🚨 Problemas Comuns e Soluções

### **1. "Supabase URL and Anon Key are required"**
**Solução:** Configure o arquivo `.env` com as credenciais corretas

### **2. "permission denied"**
**Solução:** Execute o script SQL para corrigir as políticas RLS

### **3. "Table does not exist"**
**Solução:** Execute as migrações SQL no Supabase

### **4. "Connection timeout"**
**Solução:** Verifique se a URL do Supabase está correta

## 📊 Verificação Final

Após seguir todos os passos, você deve ver:

1. ✅ Conexão estabelecida com o Supabase
2. ✅ Tabelas acessíveis sem erros de permissão
3. ✅ Dashboard carregando dados corretamente
4. ✅ Status das tabelas mudando de "Unrestricted" para "Secure"

## 🆘 Se Ainda Houver Problemas

1. **Verifique os logs do console** (F12 no navegador)
2. **Execute o script de diagnóstico** novamente
3. **Verifique se as credenciais estão corretas**
4. **Confirme se as migrações foram executadas**

## 📞 Suporte

Se o problema persistir, verifique:
- Logs do console do navegador
- Logs do terminal onde o `npm run dev` está rodando
- Status das tabelas no painel do Supabase 