const webpack = require('webpack');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      // Use built-in Webpack ProgressPlugin with no extra options
      new webpack.ProgressPlugin()
    ]
  },
  outputDir: 'dist',
  assetsDir: 'assets',
  pages: {
    index: {
      entry: './client/src/main.js',
      template: './client/public/index.html',
      filename: 'index.html'
    }
  },
  // ensure Babel preset is applied via babel.config.js
  transpileDependencies: []
});