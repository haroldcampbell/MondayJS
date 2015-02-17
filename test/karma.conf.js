module.exports = function(config){
    config.set({

        basePath : '../',

        files : [
            'lib/monday.js'
            ,'test/unit/**/*.js'
            //,'app/js/**/*.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine'],

        browsers : ['Chrome'],

        plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine'
        ],

        junitReporter : {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};
