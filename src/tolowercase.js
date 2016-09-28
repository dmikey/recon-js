'use strict';

function toLowerCase(c) {
  if (c >= 65/*'A'*/ && c <= 90/*'Z'*/) return c + (97/*'a'*/ - 65/*'A'*/);
  else return c;
}

module.exports = toLowerCase;