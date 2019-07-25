const webpack = require('webpack');
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = merge(common, {
  // sourceMap : 'source-map', <-- in case you need to debug prod app just uncomment this line
  mode: "production",
  output : {
    filename: '[name].js',
    path: path.join(__dirname, '../dist/js'),
    publicPath: 'js/'
  },
   optimization: {
    minimizer: [
      new TerserPlugin({
        parallel : true,
        sourceMap: true,
        terserOptions : {
          module : true,
          toplevel : true,
          keep_classnames  : false,
          comments: false,
          compress: {
            warnings: true,
            // drop_console: true,
            unused: true,
            keep_fargs : false,
            toplevel : true
          }
        }
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
        canPrint: true
      })
    ]
  },
  plugins : [
    // Avoid publishing files when compilation fails
    new webpack.NoEmitOnErrorsPlugin(), 
    new webpack.HashedModuleIdsPlugin(),
     new webpack.DefinePlugin({
      "process.env": { 
         NODE_ENV: JSON.stringify("production") 
       }
    }),
    new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
        chunkFileName: "[name].[contenthash].css"
    }),
  ]
});

