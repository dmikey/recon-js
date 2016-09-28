'use strict';

var isSpace = require('./isspace');
var isNewline = require('./isnewline');

function isWhitespace(c) {
  return isSpace(c) || isNewline(c);
}

module.exports = isWhitespace;