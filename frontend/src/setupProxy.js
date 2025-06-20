const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    ['/config', '/search', '/reindex', '/term'],
    createProxyMiddleware({
      target: 'http://127.0.0.1:8001',
      changeOrigin: true,
      logLevel: 'debug',
      timeout: 120000,
      proxyTimeout: 120000,
    })
  );
};