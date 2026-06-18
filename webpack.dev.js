const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    port: 4000,
    historyApiFallback: true,
    hot: true,
    open: true,
    proxy: [
      {
        context: ['/api/admin'],
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      {
        context: ['/monitor-api'],
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/monitor-api': '/api' },
      },
    ],
  },
});
