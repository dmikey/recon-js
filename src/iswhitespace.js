'use strict';

function isWhitespace(c) {
  return isSpace(c) || isNewline(c);
}

module.exports = isWhitespace;