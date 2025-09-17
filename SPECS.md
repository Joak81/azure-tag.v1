# Azure Tag Manager - Especificações do Projeto

## 1. Visão Geral

### 1.1 Objetivo
Desenvolver uma aplicação web moderna para gestão centralizada de tags em recursos Azure, permitindo operações unitárias e em bulk, com interface intuitiva e integração completa com Azure Active Directory.

### 1.2 Problema a Resolver
- Dificuldade em manter consistência de tags across subscriptions
- Falta de visibilidade sobre recursos não tagueados
- Ausência de alertas automatizados para compliance de tags
- Complexidade na aplicação de tags em bulk no portal Azure

### 1.3 Escopo
- Gestão de tags em todas as subscriptions acessíveis ao utilizador
- Interface web responsiva e moderna
- Autenticação SSO com Azure AD (mesma do portal.azure.com)
- Deployment como Azure Web App
  
## 2. Requisitos Funcionais

### 2.1 Autenticação e Autorização
- **RF01**: Autenticação via Azure AD (MSAL - Microsoft Authentication Library)
- **RF02**: Single Sign-On (SSO) - mesma sessão do portal.azure.com
- **RF03**: Autorização baseada em RBAC do Azure
- **RF04**: Refresh token automático
- **RF05**: Logout com limpeza de cache

### 2.2 Visualização de Recursos
- **RF06**: Listar todos os recursos de todas as subscriptions acessíveis
- **RF07**: Visualização hierárquica (Subscription > Resource Group > Resource)
- **RF08**: Paginação e lazy loading para performance
- **RF09**: Pesquisa por nome de recurso
- **RF10**: Filtros por tipo de recurso
- **RF11**: Filtros por subscription
- **RF12**: Filtros por resource group

### 2.3 Gestão de Tags
- **RF13**: Visualizar todas as tags de um recurso
- **RF14**: Adicionar tags individuais a recursos
- **RF15**: Editar valores de tags existentes
- **RF16**: Remover tags de recursos
- **RF17**: Aplicar tags em bulk a múltiplos recursos
- **RF18**: Templates de tags predefinidos
- **RF19**: Validação de formato de tags (key-value)
- **RF20**: Limite de 50 tags por recurso (limite Azure)

### 2.4 Filtros e Pesquisa por Tags
- **RF21**: Filtrar recursos por uma ou múltiplas tags
- **RF22**: Operadores AND/OR para múltiplas tags
- **RF23**: Pesquisa por key de tag
- **RF24**: Pesquisa por value de tag
- **RF25**: Filtro de recursos SEM determinada tag
- **RF26**: Combinação de filtros de tags com outros filtros

### 2.5 Compliance e Alertas
- **RF27**: Dashboard de compliance de tags
- **RF28**: Identificar recursos sem tags obrigatórias
- **RF29**: Configurar tags obrigatórias por subscription/resource group
- **RF30**: Alertas por email para recursos não compliance
- **RF31**: Frequência configurável de alertas (diário/semanal)
- **RF32**: Relatórios de compliance exportáveis

### 2.6 Funcionalidades Avançadas
- **RF33**: Histórico de alterações de tags (audit log)
- **RF34**: Undo/Redo de operações
- **RF35**: Import de tags via CSV
- **RF36**: Export de recursos e tags para Excel/CSV
- **RF37**: Análise de custos por tags
- **RF38**: Sugestões de tags baseadas em naming conventions
- **RF39**: Políticas de tags (enforcement rules)
- **RF40**: Bulk delete de tags específicas

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- **RNF01**: Carregamento inicial < 3 segundos
- **RNF02**: Resposta a filtros < 1 segundo
- **RNF03**: Operações em bulk até 1000 recursos
- **RNF04**: Cache de dados com TTL configurável

### 3.2 Segurança
- **RNF05**: Todas as comunicações via HTTPS
- **RNF06**: Tokens armazenados de forma segura
- **RNF07**: Sanitização de inputs
- **RNF08**: Rate limiting de APIs
- **RNF09**: Logs de auditoria para todas as alterações

### 3.3 Usabilidade
- **RNF10**: Interface responsiva (desktop, tablet, mobile)
- **RNF11**: Suporte para temas claro/escuro
- **RNF12**: Acessibilidade WCAG 2.1 AA
- **RNF13**: Mensagens de erro claras e actionable

### 3.4 Disponibilidade
- **RNF14**: 99.9% uptime (Azure Web App SLA)
- **RNF15**: Graceful degradation em caso de falha parcial
- **RNF16**: Health checks automáticos

## 4. Arquitetura Técnica

### 4.1 Stack Tecnológico

#### Frontend
```
- Framework: React 18+ com TypeScript
- UI Library: Fluent UI v9 (Microsoft Design System)
- State Management: Redux Toolkit + RTK Query
- Autenticação: @azure/msal-react
- Build Tool: Vite
- Testing: Jest + React Testing Library
```

#### Backend
```
- Runtime: Node.js 20 LTS
- Framework: Express.js ou NestJS
- Language: TypeScript
- Authentication: @azure/msal-node
- Azure SDK: @azure/arm-resources
- API Documentation: OpenAPI/Swagger
- Testing: Jest + Supertest
```

#### Infraestrutura
```
- Hosting: Azure Web App (Linux)
- Database: Azure Cosmos DB (para cache e configurações)
- Storage: Azure Blob Storage (para exports)
- Email: Azure Communication Services
- Monitoring: Application Insights
- CI/CD: Azure DevOps ou GitHub Actions
```

### 4.2 Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Components │  Services  │  State     │  Utils  │  Hooks    │
│  - Pages    │  - Auth    │  - Redux   │  - API  │  - useAuth│
│  - Widgets  │  - Azure   │  - Context │  - Date │  - useAzure│
│  - Common   │  - Export  │  - Cache   │  - Tags │  - useFilter│
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API (Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│  Controllers │  Services  │  Middleware │  Models  │  Jobs  │
│  - Auth      │  - Azure   │  - Auth     │  - Tag   │  - Email│
│  - Resources │  - Cache   │  - Logger   │  - User  │  - Report│
│  - Tags      │  - Email   │  - Error    │  - Alert │  - Sync │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Azure Services                        │
├─────────────────────────────────────────────────────────────┤
│  Azure AD  │  ARM API  │  Cosmos DB  │  Blob  │  App Insights│
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Fluxo de Autenticação

```
1. User acessa aplicação
2. Redirect para Azure AD login (se não autenticado)
3. Azure AD valida credenciais (mesmo fluxo portal.azure.com)
4. Return com access token + refresh token
5. Frontend armazena tokens (sessionStorage)
6. Todas as requests incluem bearer token
7. Backend valida token com Azure AD
8. Backend usa token para chamar Azure APIs
```

## 5. Interface do Utilizador

### 5.1 Páginas Principais

#### Dashboard
- Métricas de compliance
- Recursos sem tags obrigatórias
- Últimas alterações
- Quick actions

#### Resources View
- Grid/List view toggle
- Filtros laterais
- Bulk selection
- Inline tag editing
- Export button

#### Tag Management
- Tag templates
- Bulk operations
- Tag policies
- Naming conventions

#### Reports
- Compliance reports
- Cost analysis by tags
- Historical trends
- Export options

#### Settings
- Tag policies configuration
- Alert rules
- Email preferences
- User preferences

### 5.2 Design System

```
Cores Principais:
- Primary: #0078D4 (Azure Blue)
- Success: #107C10
- Warning: #FFB900
- Error: #D13438
- Neutral: #605E5C

Typography:
- Font: Segoe UI (Microsoft standard)
- Headers: 600 weight
- Body: 400 weight

Spacing:
- Base unit: 4px
- Componentes: 8px, 16px, 24px, 32px

Componentes:
- Fluent UI React components
- Custom components seguindo design tokens
```

## 6. APIs e Integrações

### 6.1 Azure Resource Manager APIs

```typescript
// Principais endpoints utilizados
GET /subscriptions
GET /subscriptions/{id}/resources
GET /subscriptions/{id}/resourceGroups
GET /subscriptions/{id}/providers/Microsoft.Resources/tags/default
PATCH /subscriptions/{id}/resourceGroups/{name}/providers/{type}/{resource}
```

### 6.2 Backend API Endpoints

```yaml
/api/auth:
  POST /login
  POST /logout
  GET /user
  POST /refresh

/api/resources:
  GET /resources
  GET /resources/{id}
  GET /resources/{id}/tags
  PATCH /resources/{id}/tags
  POST /resources/bulk-update

/api/tags:
  GET /tags
  GET /tags/templates
  POST /tags/templates
  GET /tags/compliance
  POST /tags/validate

/api/reports:
  GET /reports/compliance
  GET /reports/costs
  POST /reports/export

/api/alerts:
  GET /alerts
  POST /alerts
  PUT /alerts/{id}
  DELETE /alerts/{id}
```

## 7. Deployment e DevOps

### 7.1 Ambiente de Desenvolvimento

```bash
# Requisitos
- Node.js 20 LTS
- npm ou yarn
- Azure CLI
- Visual Studio Code

# Setup inicial
1. Clone do repositório
2. npm install
3. Configurar .env com Azure AD app registration
4. npm run dev (frontend)
5. npm run server (backend)

# Variáveis de ambiente (.env)
AZURE_CLIENT_ID=<app-registration-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_SECRET=<secret>
REDIRECT_URI=http://localhost:3000
API_URL=http://localhost:5000
```

### 7.2 Ambiente de Produção

```yaml
Subscription: DSP-CA MONITOR-MG
Resource Group: FinOps-Azure-TAG

Recursos a criar:
1. Azure Web App (Linux, Node.js 20)
   - Name: finops-tag-manager
   - SKU: B2 ou superior
   - Always On: true

2. Application Insights
   - Name: finops-tag-manager-insights

3. Cosmos DB (opcional)
   - Name: finops-tag-manager-db
   - API: Core (SQL)

4. Storage Account
   - Name: finopstagmgrstorage
   - Kind: StorageV2

5. Key Vault
   - Name: finops-tag-manager-kv
   - Secrets: API keys, connection strings

6. Managed Identity
   - System assigned identity para Web App
   - Permissões: Reader em todas as subscriptions
   - Tag Contributor em recursos permitidos
```

### 7.3 CI/CD Pipeline

```yaml
# Azure DevOps Pipeline
stages:
  - Build:
      - Node.js install
      - npm ci
      - npm run build
      - npm run test
      - npm run lint

  - Package:
      - Create artifact
      - Include build output
      - Include package.json

  - Deploy to Staging:
      - Deploy to staging slot
      - Run smoke tests
      - Health check

  - Deploy to Production:
      - Swap staging to production
      - Verify deployment
      - Rollback on failure
```

## 8. Testes

### 8.1 Estratégia de Testes

```
Unit Tests (80% coverage):
- Components isolados
- Services e utils
- Reducers e actions

Integration Tests:
- API endpoints
- Authentication flow
- Azure API integration

E2E Tests:
- Critical user journeys
- Tag management workflows
- Report generation

Performance Tests:
- Load testing com K6
- 1000 concurrent users
- Response time < 1s p95
```

### 8.2 Test Cases Principais

```typescript
describe('Tag Management', () => {
  test('Should list all resources with tags')
  test('Should filter resources without specific tag')
  test('Should apply tags in bulk')
  test('Should validate tag format')
  test('Should enforce tag policies')
  test('Should send alert for non-compliant resources')
})
```

## 9. Monitorização e Observabilidade

### 9.1 Métricas Chave

```
Application Metrics:
- Request rate
- Response time
- Error rate
- Active users

Business Metrics:
- Resources tagged per day
- Compliance percentage
- Alerts triggered
- Reports generated

Infrastructure Metrics:
- CPU usage
- Memory usage
- Network throughput
- Storage usage
```

### 9.2 Dashboards

```
1. Operational Dashboard
   - Real-time performance
   - Error tracking
   - User activity

2. Business Dashboard
   - Tag compliance trends
   - Cost analysis
   - Usage patterns

3. Security Dashboard
   - Authentication failures
   - Suspicious activities
   - API abuse detection
```

## 10. Roadmap e Melhorias Futuras

### Phase 1 (MVP - 3 meses)
- ✅ Autenticação Azure AD
- ✅ Listagem de recursos
- ✅ Gestão básica de tags
- ✅ Filtros simples
- ✅ Alertas básicos

### Phase 2 (3-6 meses)
- 🔄 Templates de tags
- 🔄 Políticas de enforcement
- 🔄 Relatórios avançados
- 🔄 Export/Import CSV
- 🔄 Histórico de alterações

### Phase 3 (6-12 meses)
- 📋 Machine Learning para sugestões
- 📋 Integração com Azure Policy
- 📋 Automação com Logic Apps
- 📋 Mobile app
- 📋 API pública para integrações

## 11. Considerações de Compliance

### 11.1 Tags Obrigatórias Recomendadas

```json
{
  "Environment": ["Development", "Staging", "Production"],
  "Owner": "email@domain.com",
  "CostCenter": "CC-XXXX",
  "Project": "ProjectName",
  "ExpirationDate": "YYYY-MM-DD",
  "DataClassification": ["Public", "Internal", "Confidential"],
  "BusinessUnit": "BU-Name",
  "Application": "AppName"
}
```

### 11.2 Políticas de Retenção

- Logs de auditoria: 90 dias
- Relatórios: 12 meses
- Exports: 30 dias
- Cache de dados: 5 minutos

## 12. Glossário

| Termo | Descrição |
|-------|-----------|
| Tag | Par key-value para categorizar recursos Azure |
| Bulk Operation | Operação aplicada a múltiplos recursos simultaneamente |
| Compliance | Conformidade com políticas de tagging definidas |
| RBAC | Role-Based Access Control do Azure |
| ARM | Azure Resource Manager |
| MSAL | Microsoft Authentication Library |
| SSO | Single Sign-On |

## 13. Anexos

### 13.1 Estrutura de Projeto

```
azure-tag-manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── hooks/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── jobs/
│   └── package.json
├── infrastructure/
│   ├── arm-templates/
│   ├── terraform/
│   └── scripts/
├── docs/
├── tests/
└── README.md
```

### 13.2 Configuração Exemplo

```json
{
  "authentication": {
    "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "authority": "https://login.microsoftonline.com/common",
    "redirectUri": "https://finops-tag-manager.azurewebsites.net",
    "scopes": ["https://management.azure.com/user_impersonation"]
  },
  "api": {
    "baseUrl": "https://finops-tag-manager.azurewebsites.net/api",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "features": {
    "enableBulkOperations": true,
    "maxBulkSize": 1000,
    "enableAlerts": true,
    "enableCostAnalysis": true
  }
}
```

## 14. Contactos e Suporte

**Equipa de Desenvolvimento**
- Technical Lead: [A definir]
- Product Owner: [A definir]
- DevOps: [A definir]

**Documentação**
- Wiki: [URL do Wiki]
- API Docs: [URL do Swagger]
- User Guide: [URL do Guide]

---

**Versão**: 1.0.0
**Data**: 2025-01-16
**Status**: Draft - Aguardando aprovação

**Notas de Revisão**:
- Este documento deve ser revisto e atualizado conforme o projeto evolui
- Feedback e sugestões devem ser documentados em issues do projeto
- Alterações significativas requerem aprovação do Product Owner