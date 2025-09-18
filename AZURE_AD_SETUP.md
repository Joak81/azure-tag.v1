# 🔐 Azure AD Configuration Guide

## 🎯 Problem
Error: `AADSTS9002326: Cross-origin token redemption is permitted only for the 'Single-Page Application' client-type`

## 📋 Step-by-Step Solution

### 1. Access Azure Portal
- Go to [portal.azure.com](https://portal.azure.com)
- Navigate to **Azure Active Directory** → **App registrations**
- Find your app: **Client ID: `52498d89-ea81-4584-aa00-dc3004ef9dd4`**

### 2. Authentication Configuration
Click on **Authentication** in the left menu:

#### ❌ Remove Wrong Platforms:
- **Delete** any **Web** platform configurations
- **Delete** any **Mobile and desktop applications** configurations

#### ✅ Add Correct Platform:
1. Click **"Add a platform"**
2. Select **"Single-page application"**
3. Add Redirect URI: `http://localhost:5174`
4. Click **"Configure"**

### 3. Advanced Settings
In the **Authentication** page, scroll to **Advanced settings**:

#### ✅ Enable These Options:
- **Access tokens (used for implicit flows)**: ✅ **CHECKED**
- **ID tokens (used for implicit and hybrid flows)**: ✅ **CHECKED**

#### ✅ Allow Public Client Flows:
- **Allow public client flows**: ✅ **Yes**

### 4. Supported Account Types
Verify in **Authentication** → **Supported account types**:
- Should be: **"Accounts in this organizational directory only (Single tenant)"**

### 5. API Permissions
Go to **API permissions**:
- Ensure **Microsoft Graph** → **User.Read** is present
- Click **"Grant admin consent"** if available

## 🔧 Current Configuration Status

### ✅ Working:
- Client ID: `52498d89-ea81-4584-aa00-dc3004ef9dd4`
- Tenant ID: `cd49f469-eabf-4bb1-8520-4991392c368b`
- Redirect URI: `http://localhost:5174`
- App reaches Microsoft consent page

### ❌ Issue:
- Platform type not configured as SPA correctly

## 🚀 After Configuration

1. Clear browser cache
2. Test login at: http://localhost:5174/
3. Should successfully authenticate without `AADSTS9002326` error

## 📞 Troubleshooting

If issues persist:
1. Wait 5-10 minutes after configuration changes
2. Clear browser cache completely
3. Try incognito/private browser mode
4. Verify all platforms except SPA are removed