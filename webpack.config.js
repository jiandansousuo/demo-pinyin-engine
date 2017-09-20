const path = require('path')
const webpack = require('webpack')
const packageInfo = require('./package.json')
const name = packageInfo.name
const version = packageInfo.version
const homepage = packageInfo.homepage

module.exports = {
  entry: {
    PinyinEngine: path.join(__dirname, 'src', 'PinyinEngine')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: 'PinyinEngine',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }]
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin(`${name}@${version} | ${homepage}`),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: false
      },
      mangle: {
        screw_ie8: false
      },
      output: {
        screw_ie8: false
      }
    })
  ]
}
