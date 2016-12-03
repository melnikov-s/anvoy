var path = require('path');

module.exports = {
    entry: __dirname + '/src/index.js',
    output: {
        library: 'Anvoy',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        path: __dirname + '/lib',
        filename: 'anvoy.js'
    },
    resolve: {
        root: path.resolve('./src'),
        extensions: ['', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015-loose'],
                    plugins: [
                        "transform-for-of-array"
                    ]
                }
            },
            {
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/
            }
        ]
    }
};
