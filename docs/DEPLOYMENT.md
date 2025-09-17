# Azure Tag Manager - Deployment Guide

Este guia contém instruções detalhadas para fazer deploy do Azure Tag Manager para Azure.

## 🎯 Overview

O Azure Tag Manager é deployado como:
- **Azure Web App** (Linux, Node.js 20)
- **Application Insights** (monitoring)
- **Azure Storage Account** (exports)
- **Azure Key Vault** (secrets)

**Target Environment**:
- **Subscription**: DSP-CA MONITOR-MG
- **Resource Group**: FinOps-Azure-TAG
- **Location**: West Europe

## 📋 Pré-requisitos

### Local Development Machine
- **Azure CLI** 2.50.0 ou superior
- **PowerShell** 5.1 ou superior (Windows) ou **PowerShell Core** 7+ (cross-platform)
- **Node.js** 20 LTS
- **Git**

### Azure Requirements
- Acesso à subscription **DSP-CA MONITOR-MG**
- Permissões:
  - **Contributor** no resource group **FinOps-Azure-TAG**
  - **User Access Administrator** (para configurar managed identity)
  - **Application Administrator** (para Azure AD app registration)

### Azure AD App Registration
- App registration configurado (ver [DEVELOPMENT.md](DEVELOPMENT.md))
- Client ID, Tenant ID, e Client Secret

## 🚀 Deployment Methods

### Método 1: PowerShell Script (Recomendado)

#### Passo 1: Preparação

```powershell
# Clone do repositório
git clone <repository-url>
cd azure-tag-manager

# Login no Azure
az login

# Verificar subscription
az account show
```

#### Passo 2: Configurar Variáveis

Edite o ficheiro `infrastructure/config/appsettings.prod.json`:

```json
{
  "NODE_ENV": "production",
  "LOG_LEVEL": "info",
  "AZURE_CLIENT_ID": "your-app-registration-client-id",
  "AZURE_TENANT_ID": "your-tenant-id",
  "AZURE_CLIENT_SECRET": "your-client-secret",
  "FRONTEND_URL": "https://finops-tag-manager-prod.azurewebsites.net",
  "SMTP_HOST": "smtp.office365.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "alerts@yourcompany.com",
  "SMTP_PASS": "your-smtp-password"
}
```

#### Passo 3: Execute o Deployment

```powershell
# Executar script de deployment
./infrastructure/scripts/deploy.ps1 -Environment prod

# Com parâmetros específicos
./infrastructure/scripts/deploy.ps1 `
  -Environment prod `
  -SubscriptionId "DSP-CA MONITOR-MG" `
  -ResourceGroupName "FinOps-Azure-TAG" `
  -Location "West Europe"
```

### Método 2: GitHub Actions (CI/CD)

#### Configurar Secrets

No GitHub repository, adicione os seguintes secrets:

1. **AZURE_CREDENTIALS**:
```json
{
  "clientId": "your-service-principal-client-id",
  "clientSecret": "your-service-principal-secret",
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}
```

2. **AZURE_CLIENT_ID**: Client ID da app registration
3. **AZURE_CLIENT_SECRET**: Client secret da app registration
4. **SMTP_USER**: Email para alertas
5. **SMTP_PASS**: Password do email

#### Trigger Deployment

```bash
# Push para main branch triggera deployment para produção
git push origin main

# Push para develop branch triggera deployment para staging
git push origin develop
```

### Método 3: Azure CLI Manual

#### Passo 1: Deploy Infrastructure

```bash
# Deploy ARM template
az deployment group create \
  --resource-group FinOps-Azure-TAG \
  --template-file infrastructure/arm-templates/main.json \
  --parameters infrastructure/arm-templates/parameters.prod.json
```

#### Passo 2: Build Application

```bash
npm run install:all
npm run build
```

#### Passo 3: Create Deployment Package

```bash
# Create zip file
zip -r deployment-package.zip frontend/dist/* backend/dist/* backend/package.json
```

#### Passo 4: Deploy to Web App

```bash
az webapp deployment source config-zip \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --src deployment-package.zip
```

## ⚙️ Post-Deployment Configuration

### 1. Configure Managed Identity Permissions

```bash
# Get the Web App's managed identity principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --query principalId -o tsv)

# Assign Reader role on subscription level
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Reader" \
  --scope "/subscriptions/your-subscription-id"

# Assign Tag Contributor role (if needed)
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Tag Contributor" \
  --scope "/subscriptions/your-subscription-id"
```

### 2. Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name finops-tag-manager-prod \
  --resource-group FinOps-Azure-TAG \
  --hostname tagmanager.yourcompany.com

# Bind SSL certificate
az webapp config ssl bind \
  --certificate-thumbprint your-cert-thumbprint \
  --ssl-type SNI \
  --name finops-tag-manager-prod \
  --resource-group FinOps-Azure-TAG
```

### 3. Configure Alerts and Monitoring

```bash
# Create availability test
az monitor app-insights web-test create \
  --resource-group FinOps-Azure-TAG \
  --name "TagManager-AvailabilityTest" \
  --location "West Europe" \
  --kind ping \
  --web-test-name "TagManager Ping Test" \
  --http-verb GET \
  --request-url "https://finops-tag-manager-prod.azurewebsites.net/health" \
  --locations "West Europe" "East US"

# Create action group for notifications
az monitor action-group create \
  --resource-group FinOps-Azure-TAG \
  --name "TagManagerAlerts" \
  --short-name "TagMgrAlt" \
  --email alerts finops@yourcompany.com
```

## 🔐 Security Configuration

### 1. Key Vault Secrets

```bash
# Store sensitive configuration in Key Vault
az keyvault secret set \
  --vault-name finops-tag-manager-kv-prod \
  --name "AzureClientSecret" \
  --value "your-client-secret"

az keyvault secret set \
  --vault-name finops-tag-manager-kv-prod \
  --name "SmtpPassword" \
  --value "your-smtp-password"
```

### 2. Network Security

```bash
# Restrict access to Key Vault
az keyvault network-rule add \
  --name finops-tag-manager-kv-prod \
  --resource-group FinOps-Azure-TAG \
  --vnet-name your-vnet \
  --subnet your-subnet

# Configure Web App VNet integration (if required)
az webapp vnet-integration add \
  --name finops-tag-manager-prod \
  --resource-group FinOps-Azure-TAG \
  --vnet your-vnet \
  --subnet your-webapp-subnet
```

## 📊 Monitoring Setup

### 1. Application Insights Configuration

O Application Insights é configurado automaticamente. Para customizar:

```bash
# Configure custom events tracking
az monitor app-insights component update \
  --app finops-tag-manager-insights-prod \
  --resource-group FinOps-Azure-TAG \
  --retention-time 90
```

### 2. Log Analytics Queries

Queries úteis para monitoring:

```kusto
// Application errors
traces
| where severityLevel >= 2
| order by timestamp desc

// Performance metrics
performanceCounters
| where counterName == "Requests/Sec"
| summarize avg(counterValue) by bin(timestamp, 5m)

// User activity
pageViews
| summarize count() by tostring(customDimensions.userId)
| order by count_ desc
```

### 3. Alerting Rules

```bash
# High error rate alert
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group FinOps-Azure-TAG \
  --scopes "/subscriptions/your-subscription/resourceGroups/FinOps-Azure-TAG/providers/Microsoft.Web/sites/finops-tag-manager-prod" \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group TagManagerAlerts

# High response time alert
az monitor metrics alert create \
  --name "High Response Time" \
  --resource-group FinOps-Azure-TAG \
  --scopes "/subscriptions/your-subscription/resourceGroups/FinOps-Azure-TAG/providers/Microsoft.Web/sites/finops-tag-manager-prod" \
  --condition "average requests/duration > 5000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group TagManagerAlerts
```

## 🔄 Updates e Maintenance

### 1. Rolling Updates

```bash
# Use deployment slots for zero-downtime updates
az webapp deployment slot create \
  --name finops-tag-manager-prod \
  --resource-group FinOps-Azure-TAG \
  --slot staging

# Deploy to staging slot
az webapp deployment source config-zip \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --slot staging \
  --src deployment-package.zip

# Swap staging to production
az webapp deployment slot swap \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --slot staging \
  --target-slot production
```

### 2. Backup Strategy

```bash
# Backup Web App configuration
az webapp config backup create \
  --resource-group FinOps-Azure-TAG \
  --webapp-name finops-tag-manager-prod \
  --backup-name "weekly-backup-$(date +%Y%m%d)" \
  --storage-account-url "https://finopstagmgrstorage.blob.core.windows.net/backups"
```

### 3. Scaling

```bash
# Manual scaling
az webapp plan update \
  --name finops-tag-manager-plan-prod \
  --resource-group FinOps-Azure-TAG \
  --number-of-workers 2

# Auto-scaling rules
az monitor autoscale create \
  --resource-group FinOps-Azure-TAG \
  --resource /subscriptions/your-subscription/resourceGroups/FinOps-Azure-TAG/providers/Microsoft.Web/serverfarms/finops-tag-manager-plan-prod \
  --name autoscale-tagmanager \
  --min-count 1 \
  --max-count 5 \
  --count 1
```

## 🧪 Validation e Testing

### 1. Smoke Tests

```bash
# Health check
curl -f https://finops-tag-manager-prod.azurewebsites.net/health

# API endpoints
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://finops-tag-manager-prod.azurewebsites.net/api/auth/user
```

### 2. Load Testing

```bash
# Using Artillery.js
npx artillery run tests/load/basic-load-test.yml
```

### 3. Security Testing

```bash
# OWASP ZAP scan (if available)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://finops-tag-manager-prod.azurewebsites.net
```

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails**:
   ```bash
   # Check deployment logs
   az webapp log deployment list \
     --name finops-tag-manager-prod \
     --resource-group FinOps-Azure-TAG
   ```

2. **App Won't Start**:
   ```bash
   # Check application logs
   az webapp log tail \
     --name finops-tag-manager-prod \
     --resource-group FinOps-Azure-TAG
   ```

3. **Authentication Issues**:
   - Verify Azure AD app registration
   - Check redirect URIs
   - Verify app settings configuration

4. **Performance Issues**:
   ```bash
   # Check resource usage
   az monitor metrics list \
     --resource /subscriptions/your-subscription/resourceGroups/FinOps-Azure-TAG/providers/Microsoft.Web/sites/finops-tag-manager-prod \
     --metric "CpuPercentage,MemoryPercentage"
   ```

### Debug Steps

1. Check Azure portal for resource status
2. Review Application Insights for errors
3. Check Web App logs
4. Verify managed identity permissions
5. Test API endpoints manually

## 📝 Rollback Procedure

In case of issues:

```bash
# Option 1: Swap back to previous slot
az webapp deployment slot swap \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --slot production \
  --target-slot staging

# Option 2: Redeploy previous version
az webapp deployment source config-zip \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager-prod \
  --src previous-version.zip

# Option 3: Restore from backup
az webapp config backup restore \
  --resource-group FinOps-Azure-TAG \
  --webapp-name finops-tag-manager-prod \
  --backup-name "backup-to-restore"
```

## 📞 Support

Para suporte com deployment:

1. Verificar logs de deployment
2. Consultar Azure Service Health
3. Contactar equipa de infraestrutura
4. Abrir ticket de suporte Azure (se necessário)

---

**Deployment successful! 🎉**