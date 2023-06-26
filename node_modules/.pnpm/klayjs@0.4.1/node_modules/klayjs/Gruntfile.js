var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: '<json:package.json>',
        config: {
            baseurl: 'http://rtsys.informatik.uni-kiel.de/~kieler/files/',
            folder: 'nightly/klayjs/',
            file: 'klay_layered_js_plainjslinker_nightly_latest.zip'
        },
        curl: {
            'get-klayjs': {
                src: '<%= config.baseurl %><%= config.folder %><%= config.file %>',
                dest: '<%= config.file %>'
            }
        },
        unzip: {
            'klay': '<%= config.file %>'
        },
        rename: {
            options: {
                ignore: true
            },
            moveThis: {
                src: 'klay/klay.js',
                dest: 'klay.js'
            }
        },
        file_append: {
            default_options: {
                files: [{
                    prepend: '/** klay.js version ' + pkg.version + ' build <%= grunt.template.today("yyyymmddhhmm") %> */\n',
                    input: 'klay.js',
                    output: 'klay.js'
                }]
            }
        },
        clean: {
            klay_package: '<%= config.file %>',
            temp_dir: 'klay'
        }
    });
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-rename');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-file-append');
    grunt.registerTask('default', ['curl', 'unzip', 'rename', 'file_append', 'clean']);
};