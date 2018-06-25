const path = require('path');
const { dev, prod } = require('@ionic/app-scripts/config/webpack.config.js');
const webpackMerge = require('webpack-merge');

const customConfig = {
    resolve: {
        alias: {
            "@app": path.resolve('./src/app/'),
            "@pages": path.resolve('./src/pages/'),
            "@providers": path.resolve('./src/providers/'),
            "@components": path.resolve('./src/components/'),
        }
    }
};

module.exports = {
    dev: webpackMerge(dev, customConfig),
    prod: webpackMerge(prod, customConfig)
};
