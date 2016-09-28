'use strict';

function parsePath(string) {
  var input = new StringIterator(string);
  var result = new PathParser().run(input);
  return result.state();
}

module.exports = parsePath;