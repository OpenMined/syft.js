const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode,
  entry: ['regenerator-runtime/runtime', './index.js'],
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'index.bundle.js'
  },
  devtool: argv.mode === 'development' ? 'eval-source-map' : 'source-map',
  devServer: {
    port: 8080,
    hot: true,
    open: true,
    stats: {
      children: false, // Hide children information
      maxModules: 0 // Set the maximum number of modules to be shown
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({ template: './index.html' })],
  externals: {
    '@tensorflow/tfjs-core': 'tf'
  }
});
