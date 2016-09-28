'use strict';

function isAlpha(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/);
}

module.exports = isALpha;