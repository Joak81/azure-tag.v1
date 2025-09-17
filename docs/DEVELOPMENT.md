# Azure Tag Manager - Development Guide

Este guia contém instruções detalhadas para configurar e desenvolver o Azure Tag Manager.

## 📋 Pré-requisitos

- **Node.js 20 LTS** ou superior
- **npm** ou **yarn**
- **Azure CLI** (para testes com Azure)
- **Visual Studio Code** (recomendado)
- **Git**
- Conta Azure com permissões adequadas

## 🚀 Setup Inicial

### 1. Clone do Repositório

```bash
git clone <repository-url>
cd azure-tag-manager
```

### 2. Instalação de Dependências

```bash
# Instalar dependências de todos os projetos
npm run install:all

# Ou instalar manualmente
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configuração do Azure AD

#### Criar App Registration

1. Aceda ao [Azure Portal](https://portal.azure.com)
2. Navegue para **Azure Active Directory** > **App registrations**
3. Clique em **New registration**
4. Configure:
   - **Name**: `Azure Tag Manager Dev`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**:
     - Type: `Single-page application (SPA)`
     - URI: `http://localhost:3000`

5. Após criar, anote:
   - **Application (client) ID**
   - **Directory (tenant) ID**

#### Configurar Permissões

1. Em **API permissions**, adicione:
   - **Microsoft Graph**: `User.Read`
   - **Azure Service Management**: `user_impersonation`

2. Clique em **Grant admin consent**

#### Configurar Authentication

1. Em **Authentication**, adicione URIs de redirecionamento:
   - `http://localhost:3000` (desenvolvimento)
   - `https://your-domain.azurewebsites.net` (produção)

2. Em **Implicit grant and hybrid flows**, ative:
   - Access tokens
   - ID tokens

### 4. Configuração de Variáveis de Ambiente

#### Frontend

```bash
cd frontend
cp .env.example .env
```

Edite o `.env`:
```env
VITE_AZURE_CLIENT_ID=your-client-id-from-azure-ad
VITE_AZURE_TENANT_ID=your-tenant-id-from-azure-ad
VITE_REDIRECT_URI=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
```

#### Backend

```bash
cd backend
cp ../.env.example .env
```

Edite o `.env`:
```env
AZURE_CLIENT_ID=your-client-id-from-azure-ad
AZURE_TENANT_ID=your-tenant-id-from-azure-ad
AZURE_CLIENT_SECRET=your-client-secret-from-azure-ad
REDIRECT_URI=http://localhost:3000
API_URL=http://localhost:5000
PORT=5000
NODE_ENV=development

# Email configuration (opcional para desenvolvimento)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password

LOG_LEVEL=debug
```

## 🛠️ Desenvolvimento

### Executar em Modo de Desenvolvimento

```bash
# Executar tudo (frontend + backend)
npm run dev

# Ou executar separadamente
npm run client  # Frontend apenas
npm run server  # Backend apenas
```

Isto irá iniciar:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Scripts Disponíveis

```bash
# Root level
npm run dev           # Executar frontend + backend
npm run build         # Build de produção
npm run test          # Executar todos os testes
npm run lint          # Linting de todo o código
npm run typecheck     # Type checking
npm run clean         # Limpar builds e node_modules

# Frontend specific
cd frontend
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run preview       # Preview do build
npm test              # Testes
npm run lint          # ESLint
npm run lint:fix      # Fix automático de linting
npm run typecheck     # TypeScript checking

# Backend specific
cd backend
npm run dev           # Servidor com hot reload
npm run build         # Compilar TypeScript
npm start             # Executar build de produção
npm test              # Testes
npm run lint          # ESLint
npm run lint:fix      # Fix automático de linting
npm run typecheck     # TypeScript checking
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
cd frontend && npm test
cd backend && npm test

# Testes com coverage
npm run test:coverage
cd frontend && npm run test:coverage
cd backend && npm run test:coverage

# Testes em modo watch
cd frontend && npm run test:watch
cd backend && npm run test:watch
```

### Estrutura de Testes

#### Frontend
- **Unit Tests**: Componentes, hooks, utilities
- **Integration Tests**: Fluxos de autenticação
- **E2E Tests**: User journeys críticas

#### Backend
- **Unit Tests**: Services, utilities
- **Integration Tests**: API endpoints
- **E2E Tests**: Fluxos completos API

## 🏗️ Arquitetura

### Frontend (React + TypeScript)

```
frontend/src/
├── components/        # Componentes reutilizáveis
│   ├── Layout.tsx    # Layout principal
│   ├── LoginButton.tsx
│   └── ProtectedRoute.tsx
├── pages/            # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── ResourcesPage.tsx
│   ├── TagManagementPage.tsx
│   ├── ReportsPage.tsx
│   └── SettingsPage.tsx
├── hooks/            # Custom React hooks
│   └── useAuth.ts
├── services/         # Services e APIs
│   └── authService.ts
├── config/           # Configurações
│   └── authConfig.ts
└── utils/            # Utilitários
```

### Backend (Node.js + Express + TypeScript)

```
backend/src/
├── controllers/      # Route handlers
│   ├── authController.ts
│   ├── resourceController.ts
│   ├── tagController.ts
│   ├── reportController.ts
│   └── alertController.ts
├── services/         # Business logic
│   ├── azureService.ts
│   └── emailService.ts
├── middleware/       # Express middleware
│   ├── auth.ts
│   ├── logger.ts
│   └── errorHandler.ts
├── models/           # Data models/types
└── jobs/             # Background jobs
```

## 🔧 Debugging

### Frontend Debugging

1. **Browser DevTools**: F12 para abrir
2. **React DevTools**: Instalar extensão
3. **VS Code Debugging**:
   ```json
   // .vscode/launch.json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug React App",
     "url": "http://localhost:3000",
     "webRoot": "${workspaceFolder}/frontend/src"
   }
   ```

### Backend Debugging

1. **VS Code Debugging**:
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Backend",
     "program": "${workspaceFolder}/backend/src/index.ts",
     "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
     "runtimeArgs": ["-r", "ts-node/register"]
   }
   ```

2. **Console Logging**: Use `winston` logger
3. **API Testing**: Use Postman ou Thunder Client

## 🗃️ Base de Dados

### Desenvolvimento
- Dados em memória (arrays/objects)
- Mock data para desenvolvimento rápido

### Produção
- Azure Cosmos DB para configurações
- Azure Blob Storage para exports
- Azure Key Vault para secrets

## 🔐 Segurança

### Desenvolvimento
- Tokens em sessionStorage (frontend)
- Validação de tokens via Microsoft Graph
- CORS configurado para localhost

### Produção
- HTTPS obrigatório
- Managed Identity para Azure services
- Rate limiting
- Input sanitization
- Security headers

## 📊 Logging e Monitoring

### Logs
- **Frontend**: Console + Application Insights
- **Backend**: Winston + Application Insights

### Métricas
- Performance
- Errors
- Usage
- Business metrics

## 🚢 Deployment

### Desenvolvimento Local
```bash
npm run build
npm start
```

### Azure Web App
```bash
# Usando Azure CLI
az login
./infrastructure/scripts/deploy.ps1 -Environment dev

# Ou usando GitHub Actions
git push origin main  # Deploy automático
```

## 🤝 Contribuição

### Git Workflow

1. **Feature Branch**:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Commits Convencionais**:
   ```bash
   git commit -m "feat: adicionar filtro por tags"
   git commit -m "fix: corrigir erro de autenticação"
   git commit -m "docs: atualizar README"
   ```

3. **Pull Request**: Criar PR para `main` branch

### Code Standards

- **TypeScript**: Strict mode ativo
- **ESLint**: Regras configuradas
- **Prettier**: Formatação automática
- **Testes**: Coverage mínimo de 80%

### Code Review

- Pelo menos 1 aprovação necessária
- Todos os checks CI/CD devem passar
- Sem conflicts com main branch

## ❓ Troubleshooting

### Problemas Comuns

1. **Erro de CORS**:
   ```bash
   # Verificar se backend está em execução
   curl http://localhost:5000/health
   ```

2. **Erro de Autenticação**:
   - Verificar Azure AD app registration
   - Verificar variáveis de ambiente
   - Verificar permissões API

3. **Build Falha**:
   ```bash
   # Limpar node_modules
   npm run clean
   npm run install:all
   ```

4. **Testes Falham**:
   ```bash
   # Verificar mocks
   # Verificar imports
   # Verificar setup de testes
   ```

### Debug Steps

1. Verificar logs (browser console / backend logs)
2. Verificar network tab (requests/responses)
3. Verificar variáveis de ambiente
4. Verificar Azure AD configuration
5. Verificar permissões Azure

## 📖 Recursos Úteis

- [Azure AD Authentication Guide](https://docs.microsoft.com/azure/active-directory/)
- [Azure Resource Manager API](https://docs.microsoft.com/rest/api/resources/)
- [React Documentation](https://reactjs.org/docs/)
- [Fluent UI Documentation](https://developer.microsoft.com/fluentui)
- [Express.js Guide](https://expressjs.com/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Suporte

Para questões ou problemas:

1. Verificar documentação
2. Procurar issues existentes no repositório
3. Criar nova issue com:
   - Descrição do problema
   - Steps to reproduce
   - Environment info
   - Screenshots/logs se aplicável

---

**Happy Coding! 🚀**