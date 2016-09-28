'use strict';

function isUnreservedChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/ ||
    c === 45/*'-'*/ || c === 46/*'.'*/ ||
    c === 95/*'_'*/ || c === 126/*'~'*/);
}

module.exports = isUnreservedChar;