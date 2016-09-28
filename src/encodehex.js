'use strict';

function encodeHex(x) {
  if (x < 10) return 48/*'0'*/ + x;
  else return 65/*'A'*/ + (x - 10);
}

module.exports = encodeHex;