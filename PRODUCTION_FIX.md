# 🚨 AZURE TAG MANAGER - RESOLUÇÃO PROBLEMA PRODUÇÃO

## 🔍 PROBLEMA IDENTIFICADO

A aplicação em produção **NÃO está consultando dados reais do Azure** porque:

1. **Server.js incorreto**: Estava servindo apenas ficheiros estáticos
2. **Backend não compilado**: APIs Azure não estão disponíveis
3. **Falta de build process**: TypeScript não está a ser compilado

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Server.js Corrigido ✅
- Deteta automaticamente se backend compilado existe
- Carrega backend completo com APIs Azure se disponível
- Fallback para servidor básico se backend não compilado
- Melhor diagnóstico e error messages

### 2. Package.json Atualizado ✅
- Scripts de build automático adicionados
- `postinstall` executa build completo
- Scripts para desenvolvimento e produção

### 3. Script de Deploy Criado ✅
- `deploy.ps1` automatiza todo o processo
- Build, testes, deployment e validação
- Suporte para Azure Web App

## 🚀 DEPLOY IMEDIATO

### Opção A: Deploy Automático (Recomendado)
```powershell
# Executar script de deploy
.\deploy.ps1

# Ou com parâmetros específicos
.\deploy.ps1 -ResourceGroup "FinOps-Azure-TAG" -WebAppName "finops-tag-manager"
```

### Opção B: Deploy Manual
```bash
# 1. Build completo
npm run build:all

# 2. Verificar se backend foi compilado
ls backend/dist/index.js

# 3. Deploy via Azure CLI
az webapp deployment source config-zip \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager \
  --src deployment.zip
```

### Opção C: GitHub Actions (Automático)
O pipeline GitHub Actions vai executar automaticamente:
1. Build backend e frontend
2. Deploy para Azure
3. Verificação de saúde

## 🔧 CONFIGURAÇÃO AZURE

### Variáveis de Ambiente Necessárias
Configurar no **Azure Portal > Web App > Configuration**:

```env
AZURE_CLIENT_ID=<azure-ad-app-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_SECRET=<client-secret>
FRONTEND_URL=https://finops-tag-manager.azurewebsites.net
PORT=8080
NODE_ENV=production
```

### Managed Identity (Recomendado)
1. **Ativar System Assigned Identity** na Web App
2. **Atribuir permissões**:
   - `Reader` em todas as subscriptions alvo
   - `Tag Contributor` para modificar tags

## 🧪 VERIFICAÇÃO

### 1. Health Checks
```bash
# Basic health
curl https://finops-tag-manager.azurewebsites.net/health

# API health (deve retornar status OK)
curl https://finops-tag-manager.azurewebsites.net/api/health

# Debug info
curl https://finops-tag-manager.azurewebsites.net/api/debug
```

### 2. Funcionalidade Azure
```bash
# Testar subscriptions (requer autenticação)
curl -H "Authorization: Bearer <token>" \
  https://finops-tag-manager.azurewebsites.net/api/resources/subscriptions

# Testar recursos
curl -H "Authorization: Bearer <token>" \
  https://finops-tag-manager.azurewebsites.net/api/resources?subscriptionId=<id>
```

## 🎯 RESULTADO ESPERADO

Após o deploy correto:

### ✅ Backend Funcional
- Endpoint `/api/health` retorna `status: "OK"`
- APIs Azure funcionais
- Autenticação MSAL ativa

### ✅ Frontend Funcional
- Interface carrega normalmente
- Login Azure AD funciona
- Dados reais das subscriptions aparecem
- Gestão de tags operacional

### ✅ Integração Azure
- Lista subscriptions acessíveis
- Mostra recursos reais
- Tags são aplicadas via Azure ARM API

## 🚨 TROUBLESHOOTING

### Problema: Backend ainda não funciona
```bash
# Verificar logs
az webapp log tail --name finops-tag-manager --resource-group FinOps-Azure-TAG

# Verificar se build existe
az webapp ssh --name finops-tag-manager --resource-group FinOps-Azure-TAG
ls backend/dist/
```

### Problema: Dados Azure não carregam
1. **Verificar Azure AD app registration**
2. **Verificar permissões da Managed Identity**
3. **Verificar tokens de autenticação no browser**

### Problema: Deploy falha
```bash
# Verificar status do deployment
az webapp deployment list-publishing-profiles \
  --name finops-tag-manager \
  --resource-group FinOps-Azure-TAG
```

## 📞 SUPORTE RÁPIDO

### Comandos de Diagnóstico
```bash
# Status da aplicação
az webapp show --name finops-tag-manager --resource-group FinOps-Azure-TAG

# Logs em tempo real
az webapp log tail --name finops-tag-manager --resource-group FinOps-Azure-TAG

# Restart se necessário
az webapp restart --name finops-tag-manager --resource-group FinOps-Azure-TAG
```

### Rollback se Necessário
```bash
# Ver deployments anteriores
az webapp deployment list --name finops-tag-manager --resource-group FinOps-Azure-TAG

# Voltar para deployment anterior
az webapp deployment source delete \
  --name finops-tag-manager \
  --resource-group FinOps-Azure-TAG
```

---

## ⏰ ESTIMATIVA DE TEMPO

- **Deploy automático**: 5-10 minutos
- **Configuração Azure AD**: 2-3 minutos
- **Verificação completa**: 2-3 minutos

**Total**: 10-15 minutos para aplicação 100% funcional

---

**Status**: ✅ Solução implementada e pronta para deploy
**Próximo passo**: Executar `.\deploy.ps1` ou commit para trigger GitHub Actions