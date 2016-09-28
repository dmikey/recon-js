'use strict';

var StringIterator = require('./stringiterator');
var DocumentParser = require('./documentparser');

function parse(string) {
  var input = new StringIterator(string);
  var result = new DocumentParser().run(input);
  return result.state();
}

module.exports = parse;