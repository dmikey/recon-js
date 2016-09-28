'use strict';

var StringIterator = require('./stringiterator');
var PathParser = require('./pathparser');

function parsePath(string) {
  var input = new StringIterator(string);
  var result = new PathParser().run(input);
  return result.state();
}

module.exports = parsePath;