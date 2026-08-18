const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = (env, argv) => ({
    entry: './src/js/main/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'assets/js/[name].[contenthash:8].js',
        clean: true,
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
    cache: {
        type: 'filesystem',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: [
            '.js',
            '.json',
        ],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            filename: 'index.html',
        }),
        new CompressionPlugin({
            test: /\.js$/i,
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
        hot: true,
        open: false,
    },
});
