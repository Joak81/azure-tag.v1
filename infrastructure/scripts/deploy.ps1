# Azure Tag Manager Deployment Script
param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = "DSP-CA MONITOR-MG",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "FinOps-Azure-TAG",

    [Parameter(Mandatory=$false)]
    [string]$Location = "West Europe"
)

Write-Host "🚀 Starting Azure Tag Manager deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Subscription: $SubscriptionId" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow

# Check if Azure CLI is installed
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it first."
    exit 1
}

# Login check
Write-Host "Checking Azure login status..." -ForegroundColor Blue
$loginStatus = az account show --output json 2>$null
if (-not $loginStatus) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}

# Set subscription
Write-Host "Setting subscription..." -ForegroundColor Blue
az account set --subscription $SubscriptionId

# Create resource group if it doesn't exist
Write-Host "Creating resource group if needed..." -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location

# Deploy infrastructure using ARM template
Write-Host "Deploying infrastructure..." -ForegroundColor Blue
$deploymentResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "infrastructure/arm-templates/main.json" `
    --parameters "infrastructure/arm-templates/parameters.$Environment.json" `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Infrastructure deployment failed!"
    exit 1
}

$deployment = $deploymentResult | ConvertFrom-Json
$webAppName = $deployment.properties.outputs.webAppName.value
$storageAccountName = $deployment.properties.outputs.storageAccountName.value

Write-Host "Infrastructure deployed successfully!" -ForegroundColor Green
Write-Host "Web App: $webAppName" -ForegroundColor Yellow
Write-Host "Storage Account: $storageAccountName" -ForegroundColor Yellow

# Build application
Write-Host "Building application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Blue
$packagePath = "deploy-package.zip"
if (Test-Path $packagePath) {
    Remove-Item $packagePath -Force
}

# Create zip with both frontend dist and backend
Compress-Archive -Path @("frontend/dist/*", "backend/dist/*", "backend/package.json", "backend/node_modules") -DestinationPath $packagePath

# Deploy to Web App
Write-Host "Deploying to Web App..." -ForegroundColor Blue
az webapp deployment source config-zip `
    --resource-group $ResourceGroupName `
    --name $webAppName `
    --src $packagePath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Web App deployment failed!"
    exit 1
}

# Configure App Settings
Write-Host "Configuring App Settings..." -ForegroundColor Blue

# Read environment-specific settings
$settingsFile = "infrastructure/config/appsettings.$Environment.json"
if (Test-Path $settingsFile) {
    $settings = Get-Content $settingsFile | ConvertFrom-Json

    foreach ($setting in $settings.PSObject.Properties) {
        az webapp config appsettings set `
            --resource-group $ResourceGroupName `
            --name $webAppName `
            --settings "$($setting.Name)=$($setting.Value)"
    }
}

# Enable managed identity
Write-Host "Configuring managed identity..." -ForegroundColor Blue
az webapp identity assign `
    --resource-group $ResourceGroupName `
    --name $webAppName

# Health check
Write-Host "Performing health check..." -ForegroundColor Blue
Start-Sleep -Seconds 30
$healthUrl = "https://$webAppName.azurewebsites.net/health"
try {
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Deployment successful! Application is healthy." -ForegroundColor Green
        Write-Host "Application URL: https://$webAppName.azurewebsites.net" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ Deployment completed but health check failed. Status: $($response.StatusCode)"
    }
} catch {
    Write-Warning "⚠️ Deployment completed but health check failed. Error: $($_.Exception.Message)"
}

# Cleanup
Remove-Item $packagePath -Force -ErrorAction SilentlyContinue

Write-Host "🎉 Deployment completed!" -ForegroundColor Green