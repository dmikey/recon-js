'use strict';

function decodeHex(c) {
  if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c - 48/*'0'*/;
  else if (c >= 65/*'A'*/ && c <= 70/*'F'*/) return 10 + (c - 65/*'A'*/);
  else if (c >= 97/*'a'*/ && c <= 102/*'f'*/) return 10 + (c - 97/*'a'*/);
}

module.exports = decodeHex;