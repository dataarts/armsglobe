# Gruntfile for building the dataglobe project
us = require 'underscore'

module.exports = ( grunt ) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    clean:
      all: [ 'build/tmp/components', 'build/tmp', 'build/*.js', 'public/*.js' ]
      incr: [ 'build/tmp/components', 'build/tmp', 'build/*.js', 'public/public/<%= pkg.name %>.min.js' ]

    bower_concat:
      all:
        dest: 'build/bower.js'
        # nice little callback to look for/use minified versions when available
        callback: ( mainFiles, component ) ->
          us.map( mainFiles, ( filepath ) ->
            min = filepath.replace( /\.js$/, '.min.js' )
            if grunt.file.exists( min ) then return min else return filepath
          )

    concat:
      options:
        separator: ';'
      dist:
        src: ['<%= bower_concat.all.dest %>', 'thirdparty/*.js']
        dest: 'build/thirdparty.js'

    cjsx:
      options:
        bare: true

      files:
        expand: true
        flatten: true
        cwd: 'src/components/'
        src: ['*.cjsx']
        dest: 'build/tmp/components'
        ext: '.js'

    coffee:
      options:
        bare: true # we don't want the wrapper function or else bad things
                   # happen with browserify
      files:
        expand: true
        flatten: true
        cwd: 'src/'
        src: ['**/*.coffee']
        dest: 'build/tmp'
        ext: '.js'

    browserify:
      options:
        debug: true
        destFile: 'build/bundle.js'
        src: [ 'build/tmp/**/*.js' ]

      dev:
        src: '<%= browserify.options.src %>'
        dest: '<%= browserify.options.destFile %>'

      production:
        options:
          debug: false
        src: '<%= browserify.options.src %>'
        dest: '<%= browserify.options.destFile %>'

    uglify:
      options:
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'

      all:
        files:
          'public/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ]
          'public/thirdparty.min.js': [ '<%= concat.dist.dest %>' ]

      incr:
        files:
          'public/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ]

    watch:
      files: [
        'Gruntfile.coffee'
        'src/**/*.coffee'
        'src/**/*.cjsx'
      ]
      tasks: 'incremental'

  grunt.loadNpmTasks 'grunt-coffee-react'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-bower-concat'
  grunt.loadNpmTasks 'grunt-contrib-concat'

  grunt.registerTask 'default', [
    'clean:all'
    'bower_concat:all'
    'concat:dist'
    'cjsx'
    'coffee'
    'browserify:production'
    'uglify:all'
  ]

  grunt.registerTask 'incremental', [
    'clean:incr'
    'cjsx'
    'coffee'
    'browserify:production'
    'uglify:incr'
  ]
