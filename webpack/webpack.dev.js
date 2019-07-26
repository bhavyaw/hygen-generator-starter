const merge = require('webpack-merge'); // eslint-disable-line no-extraneous-dependencies
const path = require('path');
const common = require('./webpack.common.js');

const developmentConfig = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, '../dist/js'),
    filename: '[name].js',
  },
});

module.exports = developmentConfig;
