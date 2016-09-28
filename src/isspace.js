'use strict';

function isSpace(c) {
  return c === 0x20 || c === 0x9;
}

module.exports = isSpace;