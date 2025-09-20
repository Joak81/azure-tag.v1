const express = require('express');
const path = require('path');
const fs = require('fs');

// Check if compiled backend exists
const backendPath = path.join(__dirname, 'backend', 'dist', 'index.js');
const hasCompiledBackend = fs.existsSync(backendPath);

if (hasCompiledBackend) {
  console.log('🚀 Starting Azure Tag Manager with full backend...');

  // Load and start the compiled backend
  try {
    require(backendPath);
    console.log('✅ Backend loaded successfully');
  } catch (error) {
    console.error('❌ Error loading backend:', error);
    console.log('🔄 Falling back to basic server...');
    startBasicServer();
  }
} else {
  console.log('⚠️  Compiled backend not found, starting basic server...');
  console.log('📁 Expected backend at:', backendPath);
  startBasicServer();
}

function startBasicServer() {
  const app = express();
  const PORT = process.env.PORT || 8080;

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: PORT,
      backendStatus: hasCompiledBackend ? 'LOADED' : 'MISSING'
    });
  });

  // API health
  app.get('/api/health', (req, res) => {
    res.json({
      status: hasCompiledBackend ? 'OK' : 'LIMITED',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: PORT,
      message: hasCompiledBackend ? 'Full backend available' : 'Backend not compiled - limited functionality'
    });
  });

  // Debug info
  app.get('/api/debug', (req, res) => {
    try {
      const currentDir = __dirname;
      const files = fs.readdirSync(currentDir);
      const backendFiles = fs.existsSync(path.join(__dirname, 'backend'))
        ? fs.readdirSync(path.join(__dirname, 'backend'))
        : [];

      res.json({
        status: 'OK',
        currentDir,
        files,
        backendFiles,
        backendPath,
        hasCompiledBackend,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT_SET',
          AZURE_TENANT_ID: process.env.AZURE_TENANT_ID ? 'SET' : 'NOT_SET',
          AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT_SET'
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        error: error.message
      });
    }
  });

  // Mock API endpoints for limited functionality
  if (!hasCompiledBackend) {
    app.get('/api/resources/subscriptions', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Backend not available',
        message: 'Backend needs to be compiled and deployed. Run: npm run build:backend'
      });
    });

    app.get('/api/resources', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Backend not available',
        message: 'Backend needs to be compiled and deployed. Run: npm run build:backend'
      });
    });
  }

  // Serve static files
  const staticPath = path.join(__dirname, 'frontend', 'dist');
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'API endpoint not found',
          path: req.path
        });
      }

      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({
          error: 'Frontend not found',
          path: indexPath,
          staticPath
        });
      }
    });
  } else {
    // Fallback if frontend not found
    app.get('*', (req, res) => {
      res.json({
        message: 'Azure Tag Manager',
        status: hasCompiledBackend ? 'BACKEND_ONLY' : 'LIMITED',
        version: '1.0.0',
        availableEndpoints: ['/health', '/api/health', '/api/debug'],
        staticPath,
        frontendExists: false,
        backendStatus: hasCompiledBackend ? 'AVAILABLE' : 'MISSING',
        instructions: {
          buildBackend: 'npm run build:backend',
          buildFrontend: 'npm run build:frontend',
          buildAll: 'npm run build'
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Static path: ${staticPath}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔧 Backend status: ${hasCompiledBackend ? 'AVAILABLE' : 'MISSING'}`);

    if (!hasCompiledBackend) {
      console.log('');
      console.log('⚠️  To enable full functionality:');
      console.log('   1. Run: npm run build:backend');
      console.log('   2. Redeploy the application');
      console.log('');
    }
  });
}