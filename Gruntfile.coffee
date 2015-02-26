# Gruntfile for building the dataglobe project

module.exports = ( grunt ) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    coffee:
      lib:
        files:
          'js/*.js': 'src/**/*.coffee'

    browserify:
      options:
        debug: true
        destFile: 'build/bundle.js'
        src: [ 'js/**/*.js' ]

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
          'build/<%= pkg.name %>.min.js': [ '<%= browserify.options.destFile %>' ]

    watch:
      files: [
        'Gruntfile.coffee'
        'src/**/*.coffee'
      ]
      tasks: 'default'

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-browserify'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'default', [ 'coffee', 'browserify', 'uglify' ]
