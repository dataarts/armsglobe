# Gruntfile for building the dataglobe project

module.exports = ( grunt ) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    clean:
      [ 'build/tmp/components', 'build/tmp', 'build/*.js', 'public/<%= pkg.name %>.min.js' ]

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

      dist:
        files:
          'public/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ]

    watch:
      files: [
        'Gruntfile.coffee'
        'src/**/*.coffee'
        'src/**/*.cjsx'
      ]
      tasks: 'default'

  grunt.loadNpmTasks 'grunt-coffee-react'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-clean'

  grunt.registerTask 'default', [ 'clean', 'cjsx', 'coffee', 'browserify', 'uglify' ]
