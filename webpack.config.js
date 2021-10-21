const HtmlWebpackPlugin = require('html-webpack-plugin'); // 通过 npm 安装
const path = require('path')

module.exports = {
  mode: 'production',
  entry: './demo/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'chip8.js'
  },
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader' }],
  },
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ]
  },
  plugins: [new HtmlWebpackPlugin({ template: './demo/index.html' })],
  devServer: {
    static: {
      directory: path.join(__dirname, ''),
    },
    compress: true,
    port: 9006,
  },
};
