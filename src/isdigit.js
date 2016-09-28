'use strict';

function isDigit(c) {
  return c >= 48/*'0'*/ && c <= 57/*'9'*/;
}

module.exports = isDigit;