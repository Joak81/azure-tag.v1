# Azure Tag Manager

Sistema web moderno para gestão centralizada de tags em recursos Azure, com suporte para operações unitárias e em bulk.

## 🚀 Funcionalidades

- **Autenticação SSO** com Azure AD (mesma sessão do portal.azure.com)
- **Gestão de Tags** unitária e em bulk
- **Filtros Avançados** por múltiplas tags e propriedades
- **Compliance Dashboard** com identificação de recursos não conformes
- **Alertas por Email** para recursos sem tags obrigatórias
- **Relatórios** exportáveis em CSV/Excel
- **Interface Moderna** com Fluent UI

## 📋 Pré-requisitos

- Node.js 20 LTS ou superior
- npm ou yarn
- Azure CLI (para deployment)
- Conta Azure com permissões adequadas

## 🛠️ Instalação e Setup

### 1. Clone e Instale Dependências

```bash
git clone <repository-url>
cd azure-tag-manager
npm run install:all
```

### 2. Configuração Azure AD

1. Acesse o [Azure Portal](https://portal.azure.com)
2. Vá para "Azure Active Directory" > "App registrations"
3. Clique "New registration"
4. Configure:
   - Name: `Azure Tag Manager`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: `Single-page application (SPA)` - `http://localhost:3000`

5. Após criar, anote:
   - Application (client) ID
   - Directory (tenant) ID

6. Em "Authentication", adicione:
   - Redirect URIs: `http://localhost:3000` e `https://your-domain.azurewebsites.net`
   - Enable: `Access tokens` e `ID tokens`

7. Em "API permissions", adicione:
   - Microsoft Graph: `User.Read`
   - Azure Service Management: `user_impersonation`

### 3. Configuração de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env`:
```env
AZURE_CLIENT_ID=your-client-id-from-step-2
AZURE_TENANT_ID=your-tenant-id-from-step-2
REDIRECT_URI=http://localhost:3000
API_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

Isto irá iniciar:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Estrutura do Projeto

```
azure-tag-manager/
├── frontend/              # React + TypeScript + Fluent UI
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Services API e Azure
│   │   ├── store/         # Redux store
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utilitários
│   └── package.json
├── backend/               # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   └── jobs/          # Background jobs
│   └── package.json
├── infrastructure/        # Deployment configs
│   ├── arm-templates/     # Azure Resource Manager
│   ├── terraform/         # Terraform configs
│   └── scripts/           # Deployment scripts
└── docs/                  # Documentação
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 🔍 Linting e Type Check

```bash
# Lint
npm run lint
npm run lint:fix

# Type checking
npm run typecheck
```

## 📦 Build de Produção

```bash
npm run build
```

## 🌐 Deploy para Azure

### Recursos Necessários

O deploy será feito na subscription `DSP-CA MONITOR-MG` no resource group `FinOps-Azure-TAG`.

Recursos que serão criados:
- Azure Web App (Linux, Node.js 20)
- Application Insights
- Storage Account (para exports)
- Key Vault (para secrets)

### Deploy Automático

```bash
# Usando Azure CLI
az login
cd infrastructure/scripts
./deploy.ps1 -Environment prod
```

### Deploy Manual

1. Build da aplicação:
```bash
npm run build
```

2. Deploy via Azure CLI:
```bash
az webapp deployment source config-zip \
  --resource-group FinOps-Azure-TAG \
  --name finops-tag-manager \
  --src deployment-package.zip
```

## 🔧 Configuração de Produção

### Variáveis de Ambiente (Azure Web App)

Configure no Azure Portal > Web App > Configuration:

```
AZURE_CLIENT_ID=<production-client-id>
AZURE_TENANT_ID=<tenant-id>
REDIRECT_URI=https://finops-tag-manager.azurewebsites.net
API_URL=https://finops-tag-manager.azurewebsites.net/api
NODE_ENV=production
```

### Managed Identity

A Web App deve ter uma System Assigned Managed Identity com as seguintes permissões:

- **Reader** role em todas as subscriptions que precisam ser gerenciadas
- **Tag Contributor** role nos recursos que precisam ter tags modificadas

## 📖 Uso

### 1. Login
- Acesse a aplicação
- Será redirecionado para Azure AD login (mesma sessão do portal.azure.com)
- Após login, terá acesso a todas as subscriptions disponíveis

### 2. Visualizar Recursos
- Dashboard principal mostra todos os recursos
- Use filtros para navegar por subscription, resource group, tipo
- Pesquise por nome ou tags específicas

### 3. Gerir Tags
- Clique em qualquer recurso para ver/editar tags
- Use seleção múltipla para operações em bulk
- Apply templates de tags predefinidos

### 4. Compliance
- Dashboard de compliance mostra recursos não conformes
- Configure tags obrigatórias por subscription/resource group
- Receba alertas por email para recursos não compliance

## 🔒 Segurança

- Todas as comunicações são via HTTPS
- Tokens Azure AD são armazenados de forma segura
- Rate limiting aplicado em todas as APIs
- Logs de auditoria para todas as alterações
- Input sanitization e validação

## 📊 Monitorização

A aplicação inclui:
- Application Insights para performance e erros
- Health checks automáticos
- Logging estruturado
- Métricas de business (compliance, usage)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou questões:
- Abra uma issue no repositório
- Contacte a equipa FinOps
- Consulte a documentação em `/docs`

## 🔄 Changelog

### v1.0.0
- Implementação inicial
- Autenticação Azure AD
- Gestão básica de tags
- Dashboard de compliance
- Alertas por email

## 📚 Documentação Adicional

- [Guia de Desenvolvimento](docs/DEVELOPMENT.md)
- [Guia de Deployment](docs/DEPLOYMENT.md)
- [Especificações Técnicas](SPECS.md)
- [Status do Projeto](PROJECT_STATUS.md)

## 🏷️ Tags de Exemplo

### Tags Obrigatórias Recomendadas

```json
{
  "Environment": ["Development", "Staging", "Production"],
  "Owner": "email@domain.com",
  "CostCenter": "CC-XXXX",
  "Project": "ProjectName",
  "Application": "AppName"
}
```

### Templates Comuns

#### Ambiente de Produção
```json
{
  "Environment": "Production",
  "Criticality": "High",
  "DataClassification": "Internal",
  "BackupRequired": "Yes"
}
```

#### Ambiente de Desenvolvimento
```json
{
  "Environment": "Development",
  "Criticality": "Low",
  "DataClassification": "Internal",
  "BackupRequired": "No"
}
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**: Verificar Azure AD app registration
2. **Permissões negadas**: Verificar roles da managed identity
3. **Recursos não aparecem**: Verificar permissões de leitura nas subscriptions
4. **Tags não são aplicadas**: Verificar role "Tag Contributor"

### Logs e Debugging

```bash
# Ver logs da aplicação
az webapp log tail --name finops-tag-manager --resource-group FinOps-Azure-TAG

# Health check
curl https://finops-tag-manager.azurewebsites.net/health
```

## ⚡ Performance

### Otimizações Implementadas
- Lazy loading de componentes
- Paginação de recursos
- Cache de dados Azure
- Debounce em filtros
- Batch operations para bulk updates

### Limites
- Máximo 1000 recursos por operação bulk
- Máximo 50 tags por recurso (limite Azure)
- Cache TTL: 5 minutos
- Rate limit: 1000 requests/15min por IP

---

**Desenvolvido com ❤️ pela equipa FinOps**