module.exports = function (grunt) {
  var curver = require('../../package.json').version;
  var semver = require('semver');
  var type = grunt.option('type') || 'patch';
  var version = grunt.option('version') || semver.inc(curver, type);

  function file (path) {
    return {
      dest: path,
      src: path
    };
  }

  return {
    release: {
      options: {
        patterns: [
          {
            match: new RegExp(curver),
            replacement: version
          }
        ]
      },
      files: [
        file('src/version.js'),
        file('bower.json'),
        file('package.json')
      ]
    }
  };
};
