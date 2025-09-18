const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// API health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// Debug info
app.get('/api/debug', (req, res) => {
  try {
    const currentDir = __dirname;
    const files = fs.readdirSync(currentDir);

    res.json({
      status: 'OK',
      currentDir,
      files,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT_SET',
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID ? 'SET' : 'NOT_SET'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Try to serve static files if they exist
const staticPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));

  // Serve React app
  app.get('*', (req, res) => {
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
      message: 'Azure Tag Manager API',
      status: 'OK',
      version: '1.0.0',
      endpoints: ['/health', '/api/health', '/api/debug'],
      staticPath,
      exists: false
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Static path: ${staticPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});