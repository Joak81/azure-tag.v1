# 🔐 Azure AD Configuration for PRODUCTION

## 🎯 Current Issue
Need to configure Azure AD app registration for production URL: **https://finops-tag-manager-prod.azurewebsites.net**

## 📋 REQUIRED STEPS in Azure Portal

### 1. Access Azure Portal
- Go to [portal.azure.com](https://portal.azure.com)
- Navigate to **Azure Active Directory** → **App registrations**
- Find your app: **Client ID: `52498d89-ea81-4584-aa00-dc3004ef9dd4`**

### 2. Update Redirect URIs for Production

#### ✅ Add Production Redirect URI:
In **Authentication** → **Single-page application** platform:
1. **ADD** new redirect URI: `https://finops-tag-manager-prod.azurewebsites.net`
2. **KEEP** the existing: `http://localhost:5174` (for development)

**Final Redirect URIs should be:**
- ✅ `http://localhost:5174` (development)
- ✅ `https://finops-tag-manager-prod.azurewebsites.net` (production)

### 3. Update App Settings with Production Variables

Run this PowerShell command:
```powershell
$env:AZURE_CLI_DISABLE_CONNECTION_VERIFICATION = "1"
az webapp config appsettings set --name finops-tag-manager-prod --resource-group FinOps-Azure-TAG --settings "AZURE_CLIENT_ID=52498d89-ea81-4584-aa00-dc3004ef9dd4" "AZURE_TENANT_ID=cd49f469-eabf-4bb1-8520-4991392c368b" "FRONTEND_URL=https://finops-tag-manager-prod.azurewebsites.net"
```

### 4. Verify Scopes and Permissions
Ensure these scopes are configured:
- **Microsoft Graph** → **User.Read** (Delegated)
- **Azure Service Management** → **user_impersonation** (Delegated)

### 5. Configure Azure Management API Access
For accessing Azure Resource Manager:
- Add **Azure Service Management** API permissions
- Scope: `https://management.azure.com/user_impersonation`

## 🔧 After Configuration

Test the authentication flow:
1. Access: https://finops-tag-manager-prod.azurewebsites.net
2. Click login
3. Should redirect to Microsoft login
4. After consent, should redirect back to production app

## ✅ Production Environment Variables Set:
- `AZURE_CLIENT_ID`: 52498d89-ea81-4584-aa00-dc3004ef9dd4
- `AZURE_TENANT_ID`: cd49f469-eabf-4bb1-8520-4991392c368b
- `FRONTEND_URL`: https://finops-tag-manager-prod.azurewebsites.net