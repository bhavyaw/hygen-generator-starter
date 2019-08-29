const path = require('path');
const webpackGlobEntries = require('webpack-glob-entries');
const srcDirectoryPath = path.join(process.cwd(), "/src/**/*.{js,jsx}");
const originalEntriesHash = webpackGlobEntries(srcDirectoryPath);
const webpack = require('webpack');
// plugins 
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const { pick } = require('lodash');
// config files
let mainChunks = pick(originalEntriesHash, [
  'popup',
  'options',
  'contentScript1',
  'webAccessScript',
  'appGlobals',
  'appMessages',
  'appConstants',
  // other files - add manually
]);

/**
 * Important Notes : 
 * 
 * 1. No need for bundle splitting and separate runtime chunk for / amongst background, popup, options and contentScripts Chunk
 * as they are separate contexts and cannot share any code among them
 * 
 * 2. Only bundle splitting and code splitting related optimization can be done for content scripts which need to loaded on
 * different urls
 * 
 *    2.1 Bundle splitting of shared npm packages
 *    2.2 Code splitting ( or lazy loading ) of modules which can deferred or not initially required
 */

mainChunks[
  'background'
] = "C:/Users/bhavy/Desktop/Projects/starters/chrome-extensions/my-starters/hygen-generator-starter/src/background/main.js";

const isProduction = process.env.NODE_ENV === 'production';

console.log(`
Source Directory Path : ${srcDirectoryPath}
Main Chunks : `, JSON.stringify(mainChunks, undefined, 4), 
`Is Production environment : `, isProduction
);

module.exports = {
    entry : mainChunks,
    module : {
      rules : getRulesConfig()
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.scss', '.css'],
    },
    plugins : [
      ...getPluginConfig()
    ],
    //optimization : getOptimizationConfig()
};


function getRulesConfig() {
  const rules = [
    {
      test:/\.[jt]sx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }, 
    {
      test: /\.module\.s?css$/,
      exclude: /node_modules/, 
      sideEffects : true,
      use: [
        isProduction ? MiniCssExtractPlugin.loader :  'style-loader', // Creates style nodes from JS strings        
        {
            loader: 'css-loader', // Translates CSS into CommonJS
            options: {
              importLoaders : 2,
              modules: {
                localIdentName: '[name]__[local]',
                context : path.resolve(__dirname, '../src')
              },
              sourceMap: !isProduction,
              localsConvention: 'camelCase',
              url : false
            }
        },
        'resolve-url-loader',
        {
          loader : 'sass-loader',
          options: {
              outputStyle: isProduction ? 'compressed' : 'expanded',
              sourceMap: !isProduction,
          }
        }
      ]
    },
    {
      test: /^((?!module).)*\.s?css$/,
      exclude: /\.module\.s?css$/, 
      sideEffects : true,
      use: [
        isProduction ? MiniCssExtractPlugin.loader :  'style-loader', // Creates style nodes from JS strings
        {
          loader: 'css-loader', // Translates CSS into CommonJS
          options : {
            url : false,
            importLoaders : 2,
          }
        },
        
        'resolve-url-loader',
        {
          loader : 'sass-loader',
          options: {
              outputStyle: isProduction ? 'compressed' : 'expanded',
              sourceMap: !isProduction,
          }
        }
      ]
    },
    {
      test: /\.svg$/,
      use: "file-loader",
    },
    {
      test: /\.(png|jpe?g|gif)$/,
      //exclude: path.resolve(__dirname, "../src/assets/images/source"),
      use: [
          {
            loader: "url-loader",
            options: {
                limit: 8192,
                name: "name].[ext]",
                //publicPath: ""
            }
          }
      ]
    },
    {
      test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
      use: {
          loader: "url-loader",
          options: {
            limit: 8192,
            name: "fonts/[name].[ext]?[hash]"
            // publicPath: "../", // Take the directory into account
          }
      }
    },
  ];

  return rules;
}

function getPluginConfig() {
  const plugins = [
      new webpack.ProgressPlugin(),
      new CopyPlugin([
          { from: path.join(__dirname, '../src/assets') , to: path.join(__dirname, '../dist/assets') },
      ]), 
      new CopyPlugin([
        { from: path.join(__dirname, '../src/manifest.json') , to: path.join(__dirname, '../dist/') },
      ]),
      new HtmlWebpackPlugin({
        title : "suave-chrome-extension-starter",
        inject: true,
        chunks: ['popup'],
        filename: path.join(__dirname, '../dist/popup.html'),
        template : path.join(__dirname, '../src/popup/popup.html'),
        minify : getHtmlMinificationConfig(),
        chunksSortMode : 'manual'
      }),
      new HtmlWebpackPlugin({
        title : "suave-chrome-extension-starter",
        inject: true,
        chunks: ['options'],
        filename: path.join(__dirname, '../dist/options.html'),
        template : path.join(__dirname, '../src/options/options.html'),
        minify : getHtmlMinificationConfig(),
        chunksSortMode : 'manual'
      }),
      new HtmlWebpackPlugin({
        title : "suave-chrome-extension-starter", 
        inject: true,
        chunks: ['background'],
        filename: path.join(__dirname, '../dist/background.html'),
        template : path.join(__dirname, '../src/background/background.html'),
        minify : getHtmlMinificationConfig(),
        chunksSortMode : 'manual'
      }),
      new LodashModuleReplacementPlugin({
        'array': true,
      }),
      new CleanWebpackPlugin()
  ];

  if (process.env.analyzeBundle) {
    plugins.push(new BundleAnalyzerPlugin());
  }
  return plugins;
}

function getOptimizationConfig() {
  return {
    splitChunks: {
      automaticNameDelimiter: '-',
      cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/i,
            minSize: 0,
            minChunks: 2,
            // @priority high
            //TODO - Test this with async chunks i.e code splitting 
            // if it doesn't work then revert to chunks : 'all'
            // TODO - Check this with bundle analyzer
            chunks: chunk => chunk.name !== 'contentScript1',
            priority: 20,
          },
          common : {
            minSize : 0,
            minChunks: 2,
            chunks: 'all',
            reuseExistingChunk: true,
            priority: 10,
          }
      }
    },
    sideEffects: true
  }
}

function getHtmlMinificationConfig() {
  return  isProduction
    ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
      }
    : undefined;
}
 