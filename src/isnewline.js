'use strict';

function isNewline(c) {
  return c === 0xA || c === 0xD;
}

module.exports = isNewline;
