'use strict';
const path = require('path');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

function getDefaultConfiguration() {
    return {
        cache: true,
        performance: { hints: false },
        stats: 'errors-only',
        externals: [{
            'lodash': '_'
        }],
        entry: './dist/npm/index.js',
        output: {
            library: 'keyburner-sidewinder-core',
            path: path.join(__dirname, 'build/'),
            filename: `keyburner-sidewinder-core.default.js`,
        },
        plugins: [
            new webpack.NormalModuleReplacementPlugin(/^ws$/, './wswrapper'),
            new webpack.NormalModuleReplacementPlugin(/^\.\/wallet$/, './wallet-web'),
            new webpack.NormalModuleReplacementPlugin(/^.*setup-api$/, './setup-api-web'),
        ],
        module: {
            rules: []
        },
        resolve: {
            extensions: ['.js', '.json']
        },
    };
}

module.exports = [
    function(env, argv) {
        const config = getDefaultConfiguration();
        config.mode = 'development';
        config.output.filename = `keyburner-sidewinder-core-latest.js`;
        return config;
    }
];