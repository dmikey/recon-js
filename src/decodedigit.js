'use strict';

function decodeDigit(c) {
  if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c - 48/*'0'*/;
}

module.exports = decodeDigit;