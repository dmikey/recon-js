'use strict';

var StringIterator = require('./stringiterator');
var AuthorityParser = require('./authorityparser');

function parseAuthority(string) {
  var input = new StringIterator(string);
  var result = new AuthorityParser().run(input);
  return result.state();
}

module.exports = parseAuthority;