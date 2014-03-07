module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      files: ['README.md'],
      tasks: ['build']
    },
    copy: {
      main: {
        src: "README.md",
        dest: "_includes/index.md",
        options: {
          process: function(content, srcpath) {
            return content.replace(/^# .+$/gm, "");
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['copy']);
  grunt.registerTask('default', ['build', 'watch']);
};