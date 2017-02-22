var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'public/bundle');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
  entry: APP_DIR + '/index.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'index.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?/,
      include: APP_DIR,
      loader: 'babel-loader'
    },{
      test: /\.scss$/,
      include: APP_DIR,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
    }]
  }
};

module.exports = config;
