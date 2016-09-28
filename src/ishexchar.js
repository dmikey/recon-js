'use strict';

function isHexChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 70/*'F'*/ ||
    c >= 97/*'a'*/ && c <= 102/*'f'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/);
}

module.exports = isHexChar;