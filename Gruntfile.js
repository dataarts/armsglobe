// Gruntfile for building the dataglobe project
us = require( 'underscore' );

module.exports = function( grunt ) {

  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),

    clean: {
      all: [ 'build/tmp/components', 'build/tmp', 'build/*.js', 'public/*.js' ],
      incr: [ 'build/tmp/components', 'build/tmp', 'build/*.js', 'public/public/<%= pkg.name %>.min.js' ]
    },

    bower_concat: {
      all: {
        dest: 'build/bower.js',
        // nice little callback to look for/use minified versions when available
        callback: function( mainFiles, component ) {
          return us.map( mainFiles, function( filepath ) {
            min = filepath.replace( /\.js$/, '.min.js' );
            if( grunt.file.exists( min ) ) {
              return min;
            } else {
              return filepath;
            }
          });
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['<%= bower_concat.all.dest %>', 'thirdparty/*.js'],
        dest: 'build/thirdparty.js'
      }
    },

    browserify: {
      options: {
        debug: true,
        destFile: 'build/bundle.js',
        src: [ 'src/**/*.js', 'src/**/*.jsx' ],
        transform: ['babelify']
      },

      dev: {
        src: '<%= browserify.options.src %>',
        dest: '<%= browserify.options.destFile %>'
      },

      production: {
        options: {
          debug: false
        },
        src: '<%= browserify.options.src %>',
        dest: '<%= browserify.options.destFile %>'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },

      all: {
        files: {
          'public/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ],
          'public/thirdparty.min.js': [ '<%= concat.dist.dest %>' ]
        }
      },

      incr: {
        files: {
          'public/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ]
        }
      },
    },

    watch: {
      files: [
        'Gruntfile.js',
        'src/**/*.js',
        'src/**/*.jsx'
      ],
      tasks: 'incremental'
    },
  });

  grunt.loadNpmTasks( 'grunt-browserify' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-clean' );
  grunt.loadNpmTasks( 'grunt-bower-concat' );
  grunt.loadNpmTasks( 'grunt-contrib-concat' );

  grunt.registerTask( 'default', [
    'clean:all',
    'bower_concat:all',
    'concat:dist',
    'browserify:production',
    'uglify:all'
  ]);

  grunt.registerTask( 'incremental', [
    'clean:incr',
    'browserify:production',
    'uglify:incr'
  ]);
};
