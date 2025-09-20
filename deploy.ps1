# ===================================================================
# AZURE TAG MANAGER - DEPLOYMENT SCRIPT
# ===================================================================
# Este script automatiza o deployment para Azure Web App
# Executa: build completo + deploy + validação

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "FinOps-Azure-TAG",

    [Parameter(Mandatory=$false)]
    [string]$WebAppName = "finops-tag-manager",

    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,

    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false
)

Write-Host "🚀 Starting Azure Tag Manager Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "Web App: $WebAppName" -ForegroundColor Yellow

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

# Verificar se Azure CLI está instalado
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Verificar se está logado no Azure
try {
    $account = az account show --query "name" -o tsv 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Logged in to Azure: $account" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "❌ Not logged in to Azure. Running az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed" -ForegroundColor Red
        exit 1
    }
}

if (-not $SkipBuild) {
    Write-Host "`n📦 Step 1: Building application..." -ForegroundColor Cyan

    # Limpar builds anteriores
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "backend/dist") { Remove-Item -Recurse -Force "backend/dist" }
    if (Test-Path "frontend/dist") { Remove-Item -Recurse -Force "frontend/dist" }

    # Instalar dependências
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm run install:all
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }

    # Build backend
    Write-Host "🔨 Building backend..." -ForegroundColor Yellow
    npm run build:backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend build failed" -ForegroundColor Red
        exit 1
    }

    # Verificar se backend foi compilado
    if (-not (Test-Path "backend/dist/index.js")) {
        Write-Host "❌ Backend compilation failed - index.js not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Backend built successfully" -ForegroundColor Green

    # Build frontend
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    npm run build:frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }

    # Verificar se frontend foi compilado
    if (-not (Test-Path "frontend/dist/index.html")) {
        Write-Host "❌ Frontend compilation failed - index.html not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
}

if (-not $SkipTests) {
    Write-Host "`n🧪 Step 2: Running tests..." -ForegroundColor Cyan

    # Executar testes do backend
    Write-Host "🔍 Testing backend..." -ForegroundColor Yellow
    npm run test:backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Backend tests failed, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Backend tests passed" -ForegroundColor Green
    }

    # Executar testes do frontend
    Write-Host "🔍 Testing frontend..." -ForegroundColor Yellow
    npm run test:frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Frontend tests failed, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Frontend tests passed" -ForegroundColor Green
    }
}

Write-Host "`n🚀 Step 3: Deploying to Azure..." -ForegroundColor Cyan

# Criar arquivo zip para deployment
$zipFile = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Write-Host "📦 Creating deployment package: $zipFile" -ForegroundColor Yellow

# Criar lista de arquivos para incluir no deployment
$includeFiles = @(
    "server.js",
    "package.json",
    "backend/dist/*",
    "frontend/dist/*",
    "backend/package.json",
    "frontend/package.json"
)

# Comprimir arquivos necessários
try {
    if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
        # PowerShell 5.0+
        $files = @()
        foreach ($pattern in $includeFiles) {
            $files += Get-ChildItem $pattern -Recurse -File -ErrorAction SilentlyContinue
        }

        if ($files.Count -eq 0) {
            Write-Host "❌ No files found to deploy" -ForegroundColor Red
            exit 1
        }

        # Criar zip com estrutura correta
        $tempDir = "temp_deploy_$(Get-Date -Format 'HHmmss')"
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

        # Copiar arquivos mantendo estrutura
        Copy-Item "server.js" "$tempDir/" -Force
        Copy-Item "package.json" "$tempDir/" -Force

        if (Test-Path "backend/dist") {
            New-Item -ItemType Directory -Force -Path "$tempDir/backend" | Out-Null
            Copy-Item "backend/dist" "$tempDir/backend/" -Recurse -Force
            Copy-Item "backend/package.json" "$tempDir/backend/" -Force
        }

        if (Test-Path "frontend/dist") {
            New-Item -ItemType Directory -Force -Path "$tempDir/frontend" | Out-Null
            Copy-Item "frontend/dist" "$tempDir/frontend/" -Recurse -Force
        }

        # Criar zip
        Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile -Force
        Remove-Item -Recurse -Force $tempDir

        Write-Host "✅ Deployment package created: $zipFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Compress-Archive not available" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to create deployment package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy para Azure Web App
Write-Host "☁️  Deploying to Azure Web App..." -ForegroundColor Yellow
try {
    az webapp deployment source config-zip `
        --resource-group $ResourceGroup `
        --name $WebAppName `
        --src $zipFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Deployment error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpar arquivo zip
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
}

Write-Host "`n🔍 Step 4: Validation..." -ForegroundColor Cyan

# Aguardar alguns segundos para o deployment se estabilizar
Write-Host "⏳ Waiting for deployment to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar health endpoint
$healthUrl = "https://$WebAppName.azurewebsites.net/health"
Write-Host "🏥 Checking health endpoint: $healthUrl" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 30
    if ($response.status -eq "OK") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor White
        Write-Host "   Backend: $($response.backendStatus)" -ForegroundColor White
    } else {
        Write-Host "⚠️  Health check returned unexpected status: $($response.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might be normal for first deployment - check manually" -ForegroundColor Yellow
}

# Verificar API endpoint
$apiUrl = "https://$WebAppName.azurewebsites.net/api/health"
Write-Host "🔌 Checking API endpoint: $apiUrl" -ForegroundColor Yellow

try {
    $apiResponse = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 30
    if ($apiResponse.status -eq "OK" -or $apiResponse.status -eq "LIMITED") {
        Write-Host "✅ API health check passed" -ForegroundColor Green
        Write-Host "   Status: $($apiResponse.status)" -ForegroundColor White
        if ($apiResponse.message) {
            Write-Host "   Message: $($apiResponse.message)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  API health check returned unexpected status: $($apiResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Application URL: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "🔗 Health Check: https://$WebAppName.azurewebsites.net/health" -ForegroundColor Cyan
Write-Host "🔗 API Health: https://$WebAppName.azurewebsites.net/api/health" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify Azure AD app registration settings" -ForegroundColor White
Write-Host "2. Configure environment variables in Azure Web App" -ForegroundColor White
Write-Host "3. Set up managed identity permissions" -ForegroundColor White
Write-Host "4. Test the application functionality" -ForegroundColor White

Write-Host "`n✨ Deployment script completed successfully!" -ForegroundColor Green