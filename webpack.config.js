const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssPresetEnv = require('postcss-preset-env')

module.exports = (env, argv) => {
  const mainScript = require.resolve('./src/main.js')

  return {
    entry: mainScript,
    module: {
      rules: [
        {
          test: /\.(sc|c)ss$/i,
          generator: {
            filename: 'static/[hash][ext][query]'
          },
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: () => [postcssPresetEnv({ stage: 0 })]
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        },
        {
          test: mainScript,
          use: ['babel-loader']
        },
        {
          test: /\.(png|svg|mp3|woff2)$/i,
          type: 'asset/inline'
        },
        {
          test: /\.(ico)$/i,
          loader: 'file-loader',
          options: {
            name: '[path][name]',
            context: 'src'
          }
        }
      ]
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    plugins: [
      new HtmlWebpackPlugin({ template: './src/index.html' }),
      new MiniCssExtractPlugin({
        filename: 'style.css',
        chunkFilename: '[id].css'
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all'
      },
      minimize: true,
      minimizer: [
        new HtmlMinimizerPlugin()
      ]
    }
  }
}