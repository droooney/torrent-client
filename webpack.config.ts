import path from 'node:path';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { Configuration } from 'webpack';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const config: Configuration = {
  name: 'web-client',
  mode: IS_PRODUCTION ? 'production' : 'development',
  target: 'web',
  entry: path.resolve('./web-client/index.tsx'),
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  output: {
    filename: `[${IS_PRODUCTION ? 'contenthash' : 'name'}].js`,
    chunkFilename: `[${IS_PRODUCTION ? 'contenthash' : 'name'}].js`,
    path: path.resolve('./build'),
    publicPath: '/build',
  },
  resolve: {
    alias: {
      'web-client': path.resolve('./web-client'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map',
  cache: IS_PRODUCTION
    ? false
    : {
        type: 'filesystem',
        cacheDirectory: path.resolve('./.cache'),
      },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./web-client/index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: `[${IS_PRODUCTION ? 'contenthash' : 'name'}].css`,
    }),
  ],
};

export default config;
