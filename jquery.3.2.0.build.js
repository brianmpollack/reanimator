({
    baseUrl: 'lib',
    out: './dist/reanimator-jquery.3.2.0.js',
    name: '../node_modules/almond/almond',

    include: ['reanimator-jquery.3.2.0'],
    wrap: {
        start: '(function (global) {',
        end: 'require("reanimator-jquery.3.2.0");\n}(this))'
    },

    optimize: 'none',

    cjsTranslate: true
})
